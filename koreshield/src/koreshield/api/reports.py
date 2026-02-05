"""
Reports API for KoreShield
Provides endpoints for creating, managing, and generating reports.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, status
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import structlog
import uuid

from .auth import get_current_admin

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


# Enums

class ReportSchedule(str, Enum):
    MANUAL = "manual"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ReportFormat(str, Enum):
    PDF = "pdf"
    CSV = "csv"
    JSON = "json"


class ReportStatus(str, Enum):
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


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


# Models

class ReportFilters(BaseModel):
    date_range: DateRange = DateRange.LAST_30_DAYS
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    providers: List[str] = Field(default_factory=list)
    tenants: List[str] = Field(default_factory=list)
    metrics: List[str] = Field(default_factory=list)


class Report(BaseModel):
    id: str
    name: str
    description: str
    template: str
    schedule: ReportSchedule
    format: ReportFormat
    created_at: str
    last_run: str
    status: ReportStatus
    filters: ReportFilters
    file_url: Optional[str] = None


class ReportCreate(BaseModel):
    name: str
    description: str = ""
    template: str
    schedule: ReportSchedule = ReportSchedule.MANUAL
    format: ReportFormat = ReportFormat.PDF
    filters: ReportFilters


class ReportUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    schedule: Optional[ReportSchedule] = None
    format: Optional[ReportFormat] = None
    filters: Optional[ReportFilters] = None


class ReportTemplate(BaseModel):
    id: str
    name: str
    description: str
    category: ReportCategory
    available_metrics: List[str]


# In-memory stores
_reports_store: Dict[str, Report] = {}
_templates_store: List[ReportTemplate] = []


def _initialize_templates():
    """Initialize report templates."""
    global _templates_store
    
    if _templates_store:
        return
    
    _templates_store = [
        ReportTemplate(
            id="1",
            name="Security Overview",
            description="Comprehensive security analysis including threats, blocks, and attack patterns",
            category=ReportCategory.SECURITY,
            available_metrics=[
                "Total Attacks Blocked",
                "Attack Types Distribution",
                "Top Threat Sources",
                "Security Rule Effectiveness",
                "Vulnerability Scan Results",
                "Incident Response Time"
            ]
        ),
        ReportTemplate(
            id="2",
            name="Cost Analytics",
            description="Detailed cost breakdown across providers, tenants, and time periods",
            category=ReportCategory.FINANCIAL,
            available_metrics=[
                "Total API Costs",
                "Cost by Provider",
                "Cost by Tenant",
                "Token Usage",
                "Request Volume",
                "Cost Trends",
                "Budget vs Actual"
            ]
        ),
        ReportTemplate(
            id="3",
            name="Compliance",
            description="Policy compliance status, violations, and audit trails",
            category=ReportCategory.COMPLIANCE,
            available_metrics=[
                "Policy Violations",
                "Compliance Score",
                "Audit Trail Events",
                "Data Privacy Metrics",
                "Access Control Logs",
                "Regulatory Requirements"
            ]
        ),
        ReportTemplate(
            id="4",
            name="Performance",
            description="System performance metrics including latency, throughput, and reliability",
            category=ReportCategory.OPERATIONS,
            available_metrics=[
                "Average Response Time",
                "Request Throughput",
                "Error Rates",
                "Uptime Percentage",
                "Cache Hit Ratio",
                "Resource Utilization"
            ]
        ),
        ReportTemplate(
            id="5",
            name="User Activity",
            description="User behavior analysis, access patterns, and engagement metrics",
            category=ReportCategory.ANALYTICS,
            available_metrics=[
                "Active Users",
                "Login Frequency",
                "Feature Usage",
                "Session Duration",
                "User Retention",
                "Activity Heatmap"
            ]
        ),
        ReportTemplate(
            id="6",
            name="API Usage",
            description="Detailed API endpoint usage, request patterns, and performance",
            category=ReportCategory.OPERATIONS,
            available_metrics=[
                "Request Count by Endpoint",
                "Most Used Providers",
                "Request Success Rate",
                "Rate Limit Events",
                "Payload Sizes",
                "Geographic Distribution"
            ]
        )
    ]
    
    # Initialize some sample reports
    _reports_store.update({
        "1": Report(
            id="1",
            name="Monthly Security Report",
            description="Comprehensive security analysis for the past month",
            template="Security Overview",
            schedule=ReportSchedule.MONTHLY,
            format=ReportFormat.PDF,
            created_at="2024-01-15T10:00:00Z",
            last_run="3 days ago",
            status=ReportStatus.COMPLETED,
            filters=ReportFilters(
                date_range=DateRange.LAST_30_DAYS,
                providers=["all"],
                tenants=["all"],
                metrics=["attacks", "blocks", "threats"]
            ),
            file_url="/api/v1/reports/1/download"
        ),
        "2": Report(
            id="2",
            name="Weekly Cost Analysis",
            description="API usage costs breakdown by provider",
            template="Cost Analytics",
            schedule=ReportSchedule.WEEKLY,
            format=ReportFormat.CSV,
            created_at="2024-01-20T14:30:00Z",
            last_run="1 day ago",
            status=ReportStatus.COMPLETED,
            filters=ReportFilters(
                date_range=DateRange.LAST_7_DAYS,
                providers=["all"],
                tenants=["all"],
                metrics=["cost", "requests"]
            ),
            file_url="/api/v1/reports/2/download"
        ),
        "3": Report(
            id="3",
            name="Compliance Audit",
            description="Policy compliance and violations report",
            template="Compliance",
            schedule=ReportSchedule.MANUAL,
            format=ReportFormat.PDF,
            created_at="2024-02-01T09:15:00Z",
            last_run="5 hours ago",
            status=ReportStatus.READY,
            filters=ReportFilters(
                date_range=DateRange.LAST_90_DAYS,
                providers=["all"],
                tenants=["all"],
                metrics=["violations", "policies"]
            )
        ),
        "4": Report(
            id="4",
            name="Tenant Performance",
            description="Performance metrics for all active tenants",
            template="Performance",
            schedule=ReportSchedule.MANUAL,
            format=ReportFormat.JSON,
            created_at="2024-02-03T16:45:00Z",
            last_run="Never",
            status=ReportStatus.READY,
            filters=ReportFilters(
                date_range=DateRange.LAST_30_DAYS,
                providers=["all"],
                tenants=["all"],
                metrics=["latency", "throughput"]
            )
        )
    })


_initialize_templates()


# Endpoints

@router.get("/templates", response_model=List[ReportTemplate])
async def get_templates(
    category: Optional[ReportCategory] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Get all report templates."""
    logger.info("get_templates", category=category, user_id=current_user.get("id"))
    
    templates = _templates_store
    
    if category:
        templates = [t for t in templates if t.category == category]
    
    return templates


@router.get("/templates/{template_id}", response_model=ReportTemplate)
async def get_template(
    template_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Get a specific report template."""
    logger.info("get_template", template_id=template_id, user_id=current_user.get("id"))
    
    template = next((t for t in _templates_store if t.id == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template


@router.get("", response_model=List[Report])
async def get_reports(
    status: Optional[ReportStatus] = None,
    schedule: Optional[ReportSchedule] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Get all reports with optional filters."""
    logger.info("get_reports", status=status, schedule=schedule, user_id=current_user.get("id"))
    
    reports = list(_reports_store.values())
    
    if status:
        reports = [r for r in reports if r.status == status]
    
    if schedule:
        reports = [r for r in reports if r.schedule == schedule]
    
    return reports


@router.get("/{report_id}", response_model=Report)
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Get a specific report by ID."""
    logger.info("get_report", report_id=report_id, user_id=current_user.get("id"))
    
    if report_id not in _reports_store:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return _reports_store[report_id]


@router.post("", response_model=Report, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_data: ReportCreate,
    current_user: dict = Depends(get_current_admin)
):
    """Create a new report."""
    logger.info("create_report", name=report_data.name, template=report_data.template,
                creator=current_user.get("id"))
    
    # Verify template exists
    template = next((t for t in _templates_store if t.name == report_data.template), None)
    if not template:
        raise HTTPException(status_code=400, detail="Invalid template")
    
    report_id = str(uuid.uuid4())
    new_report = Report(
        id=report_id,
        name=report_data.name,
        description=report_data.description,
        template=report_data.template,
        schedule=report_data.schedule,
        format=report_data.format,
        created_at=datetime.utcnow().isoformat() + "Z",
        last_run="Never",
        status=ReportStatus.READY,
        filters=report_data.filters
    )
    
    _reports_store[report_id] = new_report
    
    return new_report


@router.put("/{report_id}", response_model=Report)
async def update_report(
    report_id: str,
    report_update: ReportUpdate,
    current_user: dict = Depends(get_current_admin)
):
    """Update a report."""
    logger.info("update_report", report_id=report_id, updater=current_user.get("id"))
    
    if report_id not in _reports_store:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report = _reports_store[report_id]
    
    # Apply updates
    if report_update.name is not None:
        report.name = report_update.name
    
    if report_update.description is not None:
        report.description = report_update.description
    
    if report_update.schedule is not None:
        report.schedule = report_update.schedule
    
    if report_update.format is not None:
        report.format = report_update.format
    
    if report_update.filters is not None:
        report.filters = report_update.filters
    
    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Delete a report."""
    logger.info("delete_report", report_id=report_id, deleter=current_user.get("id"))
    
    if report_id not in _reports_store:
        raise HTTPException(status_code=404, detail="Report not found")
    
    del _reports_store[report_id]
    return None


async def _generate_report_task(report_id: str, user_id: str):
    """Background task to generate a report."""
    import asyncio
    
    logger.info("generating_report", report_id=report_id, user_id=user_id)
    
    if report_id not in _reports_store:
        logger.error("report_not_found", report_id=report_id)
        return
    
    report = _reports_store[report_id]
    report.status = ReportStatus.RUNNING
    
    # Simulate report generation (2-5 seconds)
    await asyncio.sleep(3)
    
    # Mark as completed
    report.status = ReportStatus.COMPLETED
    report.last_run = "Just now"
    report.file_url = f"/api/v1/reports/{report_id}/download"
    
    logger.info("report_generated", report_id=report_id, status="completed")


@router.post("/{report_id}/generate")
async def generate_report(
    report_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_admin)
):
    """Generate (run) a report."""
    logger.info("generate_report_request", report_id=report_id, user_id=current_user.get("id"))
    
    if report_id not in _reports_store:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report = _reports_store[report_id]
    
    if report.status == ReportStatus.RUNNING:
        raise HTTPException(status_code=409, detail="Report is already running")
    
    # Queue the report generation task
    background_tasks.add_task(_generate_report_task, report_id, current_user.get("id"))
    
    return {
        "status": "queued",
        "message": "Report generation started",
        "report_id": report_id
    }


@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Download a generated report."""
    logger.info("download_report", report_id=report_id, user_id=current_user.get("id"))
    
    if report_id not in _reports_store:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report = _reports_store[report_id]
    
    if report.status != ReportStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Report is not ready for download")
    
    # In production, this would return the actual file
    return {
        "report_id": report_id,
        "name": report.name,
        "format": report.format,
        "url": f"/reports/{report_id}.{report.format}",
        "message": "In production, this would stream the actual file"
    }
