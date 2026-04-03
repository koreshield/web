"""
Reports API for KoreShield
Provides endpoints for creating, managing, and generating reports.
"""

import uuid
import structlog
import asyncio
from datetime import datetime
from typing import List, Optional, Dict
from enum import Enum

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, status, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import get_current_admin
from ..database import get_db, AsyncSessionLocal
from ..models.report import Report, ReportTemplate, ReportStatus, ReportSchedule, ReportFormat
from ..models.request_log import RequestLog

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])

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
    template: str # Name of template
    schedule: str
    format: str
    created_at: datetime
    last_run: str = "Never" # Computed
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

@router.get("/templates", response_model=List[ReportTemplateSchema])
async def get_templates(
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """Get all report templates."""
    await _seed_templates(session) # Ensure seeded
    
    stmt = select(ReportTemplate)
    result = await session.execute(stmt)
    templates = result.scalars().all()
    return templates

@router.get("", response_model=List[ReportSchema])
async def get_reports(
    status: Optional[str] = None,
    schedule: Optional[str] = None,
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """Get all reports."""
    stmt = select(Report).options(select(ReportTemplate)) # Eager load? Or manual join
    # Actually Report.template relationship should load automatically or lazily. 
    # For pydantic 'template' field (str name), we need the relationship.
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

@router.post("", response_model=ReportSchema)
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
        filters=report_data.filters.dict(),
        created_by=current_user["id"],
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
        result = await session.execute(select(Report).where(Report.id == report_id))
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

@router.post("/{report_id}/generate")
async def generate_report(
    report_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """Generate a report."""
    result = await session.execute(select(Report).where(Report.id == report_id))
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

@router.get("/logs", response_model=List[dict])
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
