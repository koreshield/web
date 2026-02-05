"""
Salesforce RAG Integration Example

Demonstrates scanning Salesforce data (EmailMessage, Chatter, Cases) for
indirect prompt injection attacks before using in RAG systems.
"""

import os
from typing import List, Dict, Any
from datetime import datetime

from simple_salesforce import Salesforce
from koreshield_sdk import KoreShieldClient
from koreshield_sdk.types import RAGDocument, RAGScanResponse


class SalesforceRAGScanner:
    """Scanner for Salesforce RAG data."""
    
    def __init__(
        self,
        sf_username: str,
        sf_password: str,
        sf_security_token: str,
        koreshield_api_key: str,
        koreshield_base_url: str = "http://localhost:8000"
    ):
        """Initialize Salesforce and KoreShield clients."""
        print("Connecting to Salesforce...")
        self.sf = Salesforce(
            username=sf_username,
            password=sf_password,
            security_token=sf_security_token
        )
        print("✓ Connected to Salesforce")
        
        print("Connecting to KoreShield...")
        self.koreshield = KoreShieldClient(
            api_key=koreshield_api_key,
            base_url=koreshield_base_url
        )
        print("✓ Connected to KoreShield\n")
    
    def scan_email_messages(
        self,
        user_query: str,
        limit: int = 20
    ) -> RAGScanResponse:
        """Retrieve and scan EmailMessage records."""
        print(f"Retrieving {limit} EmailMessage records...")
        
        # Query Salesforce
        query = f"""
            SELECT Id, TextBody, Subject, FromAddress, ToAddress, CreatedDate
            FROM EmailMessage
            ORDER BY CreatedDate DESC
            LIMIT {limit}
        """
        
        result = self.sf.query(query)
        emails = result['records']
        print(f"✓ Retrieved {len(emails)} emails")
        
        # Convert to RAG documents
        documents = []
        for email in emails:
            # Combine subject and body for better context
            content = f"Subject: {email.get('Subject', 'No Subject')}\n\n{email.get('TextBody', '')}"
            
            doc = RAGDocument(
                id=email['Id'],
                content=content,
                metadata={
                    "source": "salesforce_email",
                    "from": email.get('FromAddress', ''),
                    "to": email.get('ToAddress', ''),
                    "subject": email.get('Subject', ''),
                    "created_date": email.get('CreatedDate', '')
                }
            )
            documents.append(doc)
        
        # Scan with KoreShield
        print(f"\nScanning emails for threats...")
        scan_result = self.koreshield.scan_rag_context(
            user_query=user_query,
            documents=documents,
            config={
                "min_confidence": 0.3,
                "enable_cross_document_analysis": True
            }
        )
        
        return scan_result
    
    def scan_chatter_feeds(
        self,
        user_query: str,
        limit: int = 20
    ) -> RAGScanResponse:
        """Retrieve and scan Chatter FeedItem records."""
        print(f"Retrieving {limit} Chatter posts...")
        
        # Query Salesforce
        query = f"""
            SELECT Id, Body, Type, CreatedBy.Name, CreatedDate
            FROM FeedItem
            WHERE Type IN ('TextPost', 'ContentPost')
            ORDER BY CreatedDate DESC
            LIMIT {limit}
        """
        
        result = self.sf.query(query)
        posts = result['records']
        print(f"✓ Retrieved {len(posts)} Chatter posts")
        
        # Convert to RAG documents
        documents = []
        for post in posts:
            doc = RAGDocument(
                id=post['Id'],
                content=post.get('Body', ''),
                metadata={
                    "source": "salesforce_chatter",
                    "type": post.get('Type', ''),
                    "created_by": post.get('CreatedBy', {}).get('Name', ''),
                    "created_date": post.get('CreatedDate', '')
                }
            )
            documents.append(doc)
        
        # Scan with KoreShield
        print(f"\nScanning Chatter posts for threats...")
        scan_result = self.koreshield.scan_rag_context(
            user_query=user_query,
            documents=documents,
            config={"min_confidence": 0.3}
        )
        
        return scan_result
    
    def scan_cases(
        self,
        user_query: str,
        limit: int = 20
    ) -> RAGScanResponse:
        """Retrieve and scan Case records."""
        print(f"Retrieving {limit} Cases...")
        
        # Query Salesforce
        query = f"""
            SELECT Id, Subject, Description, Status, Priority, CreatedDate
            FROM Case
            ORDER BY CreatedDate DESC
            LIMIT {limit}
        """
        
        result = self.sf.query(query)
        cases = result['records']
        print(f"✓ Retrieved {len(cases)} cases")
        
        # Convert to RAG documents
        documents = []
        for case in cases:
            content = f"Subject: {case.get('Subject', 'No Subject')}\n\n{case.get('Description', '')}"
            
            doc = RAGDocument(
                id=case['Id'],
                content=content,
                metadata={
                    "source": "salesforce_case",
                    "subject": case.get('Subject', ''),
                    "status": case.get('Status', ''),
                    "priority": case.get('Priority', ''),
                    "created_date": case.get('CreatedDate', '')
                }
            )
            documents.append(doc)
        
        # Scan with KoreShield
        print(f"\nScanning cases for threats...")
        scan_result = self.koreshield.scan_rag_context(
            user_query=user_query,
            documents=documents,
            config={"min_confidence": 0.3}
        )
        
        return scan_result
    
    def flag_threatening_records(self, scan_result: RAGScanResponse, object_type: str):
        """Flag threatening records in Salesforce with security alerts."""
        if scan_result.is_safe:
            print("\n✓ No threats detected - all records safe")
            return
        
        threat_ids = scan_result.get_threat_document_ids()
        print(f"\n⚠️  Found {len(threat_ids)} threatening {object_type} records")
        
        # In production, update records with security flags
        for threat in scan_result.context_analysis.document_threats:
            print(f"\n  Record {threat.document_id}:")
            print(f"    - Severity: {threat.severity}")
            print(f"    - Confidence: {threat.confidence:.2f}")
            print(f"    - Vectors: {threat.injection_vectors}")
            
            # Example: Update record with security flag
            # Uncomment in production with proper custom field
            # try:
            #     if object_type == "EmailMessage":
            #         self.sf.EmailMessage.update(
            #             threat.document_id,
            #             {"Security_Alert__c": True, "Threat_Level__c": threat.severity}
            #         )
            #     print(f"    ✓ Flagged in Salesforce")
            # except Exception as e:
            #     print(f"    ✗ Failed to flag: {e}")
    
    def print_scan_summary(self, scan_result: RAGScanResponse, source: str):
        """Print detailed scan summary."""
        print(f"\n{'=' * 60}")
        print(f"Scan Summary: {source}")
        print(f"{'=' * 60}")
        print(f"Safety Status: {'✓ SAFE' if scan_result.is_safe else '✗ THREATS DETECTED'}")
        print(f"Overall Severity: {scan_result.overall_severity}")
        print(f"Confidence: {scan_result.overall_confidence:.2f}")
        
        if not scan_result.is_safe:
            print(f"\nTaxonomy:")
            print(f"  - Injection Vectors: {scan_result.taxonomy.injection_vectors}")
            print(f"  - Operational Targets: {scan_result.taxonomy.operational_targets}")
            print(f"  - Enterprise Context: {scan_result.taxonomy.enterprise_contexts}")
            
            print(f"\nDocument Threats: {len(scan_result.context_analysis.document_threats)}")
            print(f"Cross-Document Threats: {len(scan_result.context_analysis.cross_document_threats)}")


def demo_email_scanning():
    """Demo: Scan Salesforce emails."""
    print("\n" + "=" * 60)
    print("DEMO 1: Scanning Salesforce Emails")
    print("=" * 60)
    
    scanner = SalesforceRAGScanner(
        sf_username=os.getenv("SF_USERNAME", "your-username"),
        sf_password=os.getenv("SF_PASSWORD", "your-password"),
        sf_security_token=os.getenv("SF_SECURITY_TOKEN", "your-token"),
        koreshield_api_key=os.getenv("KORESHIELD_API_KEY", "your-key")
    )
    
    # Scan emails
    result = scanner.scan_email_messages(
        user_query="Summarize customer sentiment from recent emails",
        limit=20
    )
    
    scanner.print_scan_summary(result, "Salesforce Emails")
    scanner.flag_threatening_records(result, "EmailMessage")


def demo_chatter_scanning():
    """Demo: Scan Chatter posts."""
    print("\n" + "=" * 60)
    print("DEMO 2: Scanning Chatter Posts")
    print("=" * 60)
    
    scanner = SalesforceRAGScanner(
        sf_username=os.getenv("SF_USERNAME", "your-username"),
        sf_password=os.getenv("SF_PASSWORD", "your-password"),
        sf_security_token=os.getenv("SF_SECURITY_TOKEN", "your-token"),
        koreshield_api_key=os.getenv("KORESHIELD_API_KEY", "your-key")
    )
    
    # Scan Chatter
    result = scanner.scan_chatter_feeds(
        user_query="What are teams discussing in Chatter?",
        limit=20
    )
    
    scanner.print_scan_summary(result, "Chatter Posts")
    scanner.flag_threatening_records(result, "FeedItem")


def demo_case_scanning():
    """Demo: Scan support cases."""
    print("\n" + "=" * 60)
    print("DEMO 3: Scanning Support Cases")
    print("=" * 60)
    
    scanner = SalesforceRAGScanner(
        sf_username=os.getenv("SF_USERNAME", "your-username"),
        sf_password=os.getenv("SF_PASSWORD", "your-password"),
        sf_security_token=os.getenv("SF_SECURITY_TOKEN", "your-token"),
        koreshield_api_key=os.getenv("KORESHIELD_API_KEY", "your-key")
    )
    
    # Scan cases
    result = scanner.scan_cases(
        user_query="Analyze common support issues",
        limit=20
    )
    
    scanner.print_scan_summary(result, "Support Cases")
    scanner.flag_threatening_records(result, "Case")


def main():
    """Run all demos."""
    print("\n" + "=" * 60)
    print("Salesforce + KoreShield RAG Security Demo")
    print("=" * 60)
    
    # Check environment
    required_vars = ["SF_USERNAME", "SF_PASSWORD", "SF_SECURITY_TOKEN", "KORESHIELD_API_KEY"]
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        print(f"\n⚠️  Missing environment variables: {', '.join(missing)}")
        print("\nSet them with:")
        for var in missing:
            print(f"  export {var}='your-value'")
        print("\nRunning with placeholder values (will fail)...\n")
    
    try:
        # Run demos
        demo_email_scanning()
        demo_chatter_scanning()
        demo_case_scanning()
        
        print("\n" + "=" * 60)
        print("✓ All demos completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nNote: This demo requires valid Salesforce credentials.")
        print("Set SF_USERNAME, SF_PASSWORD, and SF_SECURITY_TOKEN environment variables.")


if __name__ == "__main__":
    main()
