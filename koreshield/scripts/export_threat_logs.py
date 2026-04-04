import asyncio
import csv
import os
import sys
from pathlib import Path
from sqlalchemy import select

# Add parent directory to sys.path to allow imports from koreshield
sys.path.append(str(Path(__file__).resolve().parent.parent))

from koreshield.database import AsyncSessionLocal
from koreshield.models.request_log import RequestLog
from koreshield.models.rag_scan import RagScan

EXPORT_FILE = "/app/koreshield_threat_logs.csv" if os.path.exists("/app") else "koreshield_threat_logs.csv"

async def export_logs():
    """Export threat and block logs to CSV."""
    print("--- Starting Threat Log Export ---")
    
    async with AsyncSessionLocal() as session:
        # 1. Fetch Request Logs with threats or blocks
        print("Querying request_logs...")
        stmt_requests = select(RequestLog).where(
            (RequestLog.attack_detected == True) | (RequestLog.is_blocked == True)
        )
        result_requests = await session.execute(stmt_requests)
        request_logs = result_requests.scalars().all()
        print(f"Found {len(request_logs)} threat/block entries in request_logs.")
        
        # 2. Fetch RAG Scans with threats
        print("Querying rag_scans...")
        stmt_rag = select(RagScan).where(RagScan.is_safe == False)
        result_rag = await session.execute(stmt_rag)
        rag_scans = result_rag.scalars().all()
        print(f"Found {len(rag_scans)} threat entries in rag_scans.")
        
        # 3. Write to CSV
        with open(EXPORT_FILE, mode='w', newline='') as file:
            writer = csv.writer(file)
            
            # Header
            writer.writerow(["Source", "ID/ID", "Timestamp", "Type/Details", "Outcome", "Additional Info"])
            
            # Write Request Logs
            for log in request_logs:
                writer.writerow([
                    "API_PROMPT",
                    log.request_id,
                    log.timestamp.isoformat(),
                    f"{log.attack_type or 'N/A'}",
                    "BLOCKED" if log.is_blocked else "FLAGGED",
                    f"Provider: {log.provider}, Model: {log.model}, Reason: {log.block_reason or 'N/A'}"
                ])
                
            # Write RAG Scans
            for scan in rag_scans:
                # Extract threat info from nested JSON if needed, or just summarize
                writer.writerow([
                    "RAG_CONTEXT",
                    scan.scan_id,
                    scan.created_at.isoformat(),
                    f"Threats: {scan.total_threats_found}",
                    "UNSAFE",
                    f"Query: {scan.user_query[:100]}..." if scan.user_query else ""
                ])
                
    print(f"--- Export Complete: {EXPORT_FILE} ---")

if __name__ == "__main__":
    if not os.getenv("DATABASE_URL"):
        print("Error: DATABASE_URL not set in environment.")
        sys.exit(1)
    asyncio.run(export_logs())
