"""
Reports API for KoreShield
Provides endpoints for creating, managing, and generating reports.
"""

import asyncio
import csv
import io
import json
import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import AsyncSessionLocal, get_db
from ..models.report import Report, ReportTemplate
from ..models.request_log import RequestLog
from .auth import get_current_admin

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])

# Pydantic Models for Request/Response
# Note: DB models have same names, so using aliases or separate classes


class DateRange(str, Enum):
    TODAY = "today"
    LAST_7_DAYS = "7d"
    LAST_30_DAYS = "30d"
    LAST_90_DAYS = "90d"
    CUSTOM = "custom"


class ReportCategory(str, Enum):
    SECURITY = "Security"
    FINANCIAL = "Financial"
    COMPLIANCE = "Compliance"
    OPERATIONS = "Operations"
    ANALYTICS = "Analytics"


class ReportFilters(BaseModel):
    date_range: DateRange = DateRange.LAST_30_DAYS
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    providers: List[str] = Field(default_factory=list)
    tenants: List[str] = Field(default_factory=list)
    metrics: List[str] = Field(default_factory=list)


class ReportSchema(BaseModel):
    id: str
    name: str
    description: Optional[str]
    template: str  # Name of template
    schedule: str
    format: str
    created_at: datetime
    last_run: str = "Never"  # Computed
    status: str
    filters: dict
    file_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReportCreate(BaseModel):
    name: str
    description: str = ""
    template: str
    schedule: str = "manual"
    format: str = "pdf"
    filters: ReportFilters


class ReportUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    schedule: Optional[str] = None
    format: Optional[str] = None
    filters: Optional[ReportFilters] = None


class ReportTemplateSchema(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: Optional[str]
    available_metrics: List[str]

    model_config = ConfigDict(from_attributes=True)


def _build_report_export_payload(report: Report, template: ReportTemplate) -> dict:
    return {
        "report_name": report.name,
        "template": template.name,
        "description": report.description or "",
        "generated_at": report.last_run_at.isoformat() if report.last_run_at else None,
        "filters": report.filters,
        "status": report.status,
        "format": report.format,
    }


def _build_simple_pdf(lines: List[str]) -> bytes:
    sanitized_lines = []
    for line in lines:
        safe_line = (
            line.replace("\\", "\\\\")
            .replace("(", "\\(")
            .replace(")", "\\)")
        )
        sanitized_lines.append(safe_line)

    content_lines = ["BT", "/F1 12 Tf", "50 760 Td", "14 TL"]
    for index, line in enumerate(sanitized_lines):
        if index == 0:
            content_lines.append(f"({line}) Tj")
        else:
            content_lines.append("T*")
            content_lines.append(f"({line}) Tj")
    content_lines.append("ET")
    content_stream = "\n".join(content_lines).encode("utf-8")

    objects = [
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
        f"4 0 obj<< /Length {len(content_stream)} >>stream\n".encode("utf-8")
        + content_stream
        + b"\nendstream endobj",
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets: List[int] = [0]
    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj)
        pdf.extend(b"\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(offsets)}\n".encode("utf-8"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("utf-8"))
    pdf.extend(
        (
            f"trailer<< /Size {len(offsets)} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF"
        ).encode("utf-8")
    )
    return bytes(pdf)

# Helper to seed templates


async def _seed_templates(session: AsyncSession):
    stmt = select(ReportTemplate)
    result = await session.execute(stmt)
    existing = result.scalars().first()

    if existing:
        return

    # Seed data
    templates_data = [
        {
            "name": "Security Overview",
            "description": "Comprehensive security analysis including threats, blocks, and attack patterns",
            "category": "Security",
            "available_metrics": ["Total Attacks Blocked", "Attack Types Distribution", "Top Threat Sources"]
        },
        {
            "name": "Cost Analytics",
            "description": "Detailed cost breakdown across providers, tenants, and time periods",
            "category": "Financial",
            "available_metrics": ["Total API Costs", "Cost by Provider", "Token Usage"]
        },
        # Add others as needed
    ]

    for t_data in templates_data:
        template = ReportTemplate(
            name=t_data["name"],
            description=t_data["description"],
            category=t_data["category"],
            available_metrics=t_data["available_metrics"]
        )
        session.add(template)

    await session.commit()


@router.get("/templates", response_model=List[ReportTemplateSchema], summary="List Report Templates",
            description="List all available report templates including security summaries, compliance audits, and threat analysis reports.")
async def get_templates(
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """Get all report templates."""
    await _seed_templates(session)  # Ensure seeded

    stmt = select(ReportTemplate)
    result = await session.execute(stmt)
    templates = result.scalars().all()
    return templates


@router.get("", response_model=List[ReportSchema], summary="List Reports",
            description="List all reports created by the authenticated user. Filter by status, schedule, or format.")
async def get_reports(
    status: Optional[str] = None,
    schedule: Optional[str] = None,
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """Get all reports."""
    stmt = select(Report, ReportTemplate).join(ReportTemplate, Report.template_id == ReportTemplate.id)

    if status:
        stmt = stmt.where(Report.status == status)
    if schedule:
        stmt = stmt.where(Report.schedule == schedule)

    result = await session.execute(stmt)
    rows = result.all()

    # Map to schema
    reports = []
    for report, template in rows:
        r_dict = {
            "id": str(report.id),
            "name": report.name,
            "description": report.description,
            "template": template.name,
            "schedule": report.schedule,
            "format": report.format,
            "created_at": report.created_at,
            "last_run": report.last_run_at.isoformat() if report.last_run_at else "Never",
            "status": report.status,
            "filters": report.filters,
            "file_url": report.file_url
        }
        reports.append(r_dict)

    return reports


@router.post("", response_model=ReportSchema, summary="Create Report",
             description="Create a new report from a template. Optionally configure scheduling, output format, and filters.")
async def create_report(
    report_data: ReportCreate,
    request: Request,
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """Create a new report."""
    await _seed_templates(session)

    # Find template
    stmt = select(ReportTemplate).where(ReportTemplate.name == report_data.template)
    result = await session.execute(stmt)
    template = result.scalars().first()

    if not template:
        raise HTTPException(status_code=400, detail="Invalid template")

    new_report = Report(
        name=report_data.name,
        description=report_data.description,
        template_id=template.id,
        schedule=report_data.schedule,
        format=report_data.format,
        status="ready",
        filters=report_data.filters.model_dump(),
        created_by=UUID(current_user["id"]),
        created_at=datetime.utcnow()
    )

    session.add(new_report)
    await session.commit()
    await session.refresh(new_report)

    monitoring = getattr(request.app.state, "monitoring", None)
    if monitoring:
        await monitoring.notify_operational_event(
            event_name="report_created",
            severity="info",
            message="Report configuration created",
            publish_event_type="report_event",
            details={
                "report_id": str(new_report.id),
                "report_name": new_report.name,
                "template": template.name,
                "format": new_report.format,
                "schedule": new_report.schedule,
                "user_id": current_user["id"],
            },
        )

    # Return schema
    return {
        "id": str(new_report.id),
        "name": new_report.name,
        "description": new_report.description,
        "template": template.name,
        "schedule": new_report.schedule,
        "format": new_report.format,
        "created_at": new_report.created_at,
        "last_run": "Never",
        "status": new_report.status,
        "filters": new_report.filters,
        "file_url": new_report.file_url
    }


async def _generate_report_task(report_id: str, user_id: str, monitoring=None):
    """Background task to generate report."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Report).where(Report.id == uuid.UUID(report_id)))
        report = result.scalars().first()

        if not report:
            return

        report.status = "running"
        await session.commit()
        if monitoring:
            await monitoring.notify_operational_event(
                event_name="report_generation_started",
                severity="info",
                message="Report generation started",
                publish_event_type="report_event",
                details={
                    "report_id": str(report.id),
                    "report_name": report.name,
                    "status": "running",
                    "user_id": user_id,
                },
            )

        try:
            # Simulate generation
            await asyncio.sleep(2)

            # In real impl, fetch RequestLogs depending on filters
            # logs_stmt = select(RequestLog)...

            report.status = "completed"
            report.last_run_at = datetime.utcnow()
            report.file_url = f"/api/v1/reports/{report.id}/download"
            await session.commit()

            if monitoring:
                await monitoring.notify_operational_event(
                    event_name="report_generation_completed",
                    severity="info",
                    message="Report generation completed",
                    publish_event_type="report_event",
                    details={
                        "report_id": str(report.id),
                        "report_name": report.name,
                        "status": "completed",
                        "file_url": report.file_url,
                        "user_id": user_id,
                    },
                )
        except Exception as exc:
            report.status = "failed"
            await session.commit()
            if monitoring:
                await monitoring.notify_operational_event(
                    event_name="report_generation_failed",
                    severity="error",
                    message="Report generation failed",
                    publish_event_type="operational_error",
                    details={
                        "report_id": str(report.id),
                        "report_name": report.name,
                        "status": "failed",
                        "error": str(exc),
                        "user_id": user_id,
                    },
                )
            raise


@router.post("/{report_id}/generate", summary="Generate Report",
             description="Trigger immediate generation of a report. The report status will update to generating and then completed or failed.")
async def generate_report(
    report_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """Generate a report."""
    try:
        report_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid report ID format")

    result = await session.execute(select(Report).where(Report.id == report_uuid))
    report = result.scalars().first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status == "running":
        raise HTTPException(status_code=409, detail="Report is already running")

    monitoring = getattr(request.app.state, "monitoring", None)
    background_tasks.add_task(
        _generate_report_task,
        str(report.id),
        str(current_user["id"]),
        monitoring,
    )
    if monitoring:
        await monitoring.notify_operational_event(
            event_name="report_generation_queued",
            severity="info",
            message="Report generation queued",
            publish_event_type="report_event",
            details={
                "report_id": str(report.id),
                "report_name": report.name,
                "status": "queued",
                "user_id": current_user["id"],
            },
        )

    return {"status": "queued", "message": "Report generation started"}


@router.put("/{report_id}", response_model=ReportSchema, summary="Update Report",
            description="Update report configuration such as name, description, schedule, or format.")
async def update_report(
    report_id: str,
    report_update: ReportUpdate,
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db),
):
    """Update an existing report's configuration."""
    try:
        report_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid report ID format")

    stmt = select(
    Report,
    ReportTemplate).join(
        ReportTemplate,
        Report.template_id == ReportTemplate.id).where(
            Report.id == report_uuid)
    result = await session.execute(stmt)
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")

    report, template = row

    if report_update.name is not None:
        report.name = report_update.name
    if report_update.description is not None:
        report.description = report_update.description
    if report_update.schedule is not None:
        report.schedule = report_update.schedule
    if report_update.format is not None:
        report.format = report_update.format
    if report_update.filters is not None:
        report.filters = report_update.filters.model_dump()

    await session.commit()
    await session.refresh(report)

    return {
        "id": str(report.id),
        "name": report.name,
        "description": report.description,
        "template": template.name,
        "schedule": report.schedule,
        "format": report.format,
        "created_at": report.created_at,
        "last_run": report.last_run_at.isoformat() if report.last_run_at else "Never",
        "status": report.status,
        "filters": report.filters,
        "file_url": report.file_url,
    }


@router.delete("/{report_id}", status_code=204, summary="Delete Report",
               description="Permanently delete a report and all its data.")
async def delete_report(
    report_id: str,
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db),
):
    """Delete an existing report."""
    try:
        report_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid report ID format")

    stmt = select(Report).where(Report.id == report_uuid)
    result = await session.execute(stmt)
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    await session.delete(report)
    await session.commit()


@router.get("/{report_id}/download", summary="Download Report",
            description="Download the generated output of a completed report. Returns CSV or JSON data based on the report format.")
async def download_report(
    report_id: str,
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db),
):
    """Download the generated report file."""

    try:
        report_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid report ID format")

    stmt = select(
    Report,
    ReportTemplate).join(
        ReportTemplate,
        Report.template_id == ReportTemplate.id).where(
            Report.id == report_uuid)
    result = await session.execute(stmt)
    row = result.one_or_none()

    if not row:
        raise HTTPException(status_code=404, detail="Report not found")

    report, template = row

    if report.status not in ["completed"]:
        raise HTTPException(status_code=400, detail="Report has not been generated yet. Run the report first.")

    # Build export data from report filters/metadata
    export_data = _build_report_export_payload(report, template)

    if report.format == "json":
        content = json.dumps(export_data, indent=2, default=str)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{report.name.replace(" ", "_")}.json"'},
        )
    if report.format == "pdf":
        pdf_lines = [
            f"Report: {export_data['report_name']}",
            f"Template: {export_data['template']}",
            f"Generated at: {export_data['generated_at'] or 'Not generated'}",
            f"Status: {export_data['status']}",
            f"Format: {export_data['format']}",
            "",
            "Filters:",
            json.dumps(export_data["filters"], indent=2, default=str),
        ]
        content = _build_simple_pdf(pdf_lines)
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{report.name.replace(" ", "_")}.pdf"'},
        )

    else:
        # CSV format
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Field", "Value"])
        for key, value in export_data.items():
            writer.writerow([key, str(value)])
        content = output.getvalue()
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{report.name.replace(" ", "_")}.csv"'},
        )


@router.get("/logs", response_model=List[dict], summary="Report Logs",
            description="Get a log of all report generation events including timestamps, statuses, and error messages.")
async def get_logs(
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """Get raw request logs."""
    stmt = (
        select(RequestLog)
        .order_by(desc(RequestLog.timestamp))
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(stmt)
    logs = result.scalars().all()
    # Need to_dict method on RequestLog or use pydantic
    return [
        {
            "id": str(log.id),
            "timestamp": log.timestamp,
            "provider": log.provider,
            "cost": log.cost,
            "model": log.model,
            "status_code": log.status_code,
            "is_blocked": log.is_blocked
        }
        for log in logs
    ]
