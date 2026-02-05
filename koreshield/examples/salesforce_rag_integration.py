"""
Salesforce Einstein RAG Integration Example

This script demonstrates how to integrate KoreShield RAG detection
with Salesforce Einstein for secure email analysis.
"""

import os
from typing import List, Dict, Any
import httpx
from simple_salesforce import Salesforce
import yaml


class SalesforceRAGSecurityClient:
    """Client for securing Salesforce Einstein RAG workflows."""
    
    def __init__(
        self,
        koreshield_url: str = "http://localhost:8000",
        salesforce_instance_url: str = None,
        salesforce_username: str = None,
        salesforce_password: str = None,
        salesforce_security_token: str = None,
        config_path: str = "crm_templates/salesforce/rag_config.yaml"
    ):
        """
        Initialize Salesforce RAG Security Client.
        
        Args:
            koreshield_url: KoreShield API URL
            salesforce_instance_url: Salesforce instance URL
            salesforce_username: Salesforce username
            salesforce_password: Salesforce password
            salesforce_security_token: Salesforce security token
            config_path: Path to Salesforce RAG config template
        """
        self.koreshield_url = koreshield_url
        self.http_client = httpx.Client(timeout=30.0)
        
        # Load RAG security config
        with open(config_path) as f:
            self.config = yaml.safe_load(f)
        
        # Initialize Salesforce client
        self.sf = Salesforce(
            instance_url=salesforce_instance_url,
            username=salesforce_username,
            password=salesforce_password,
            security_token=salesforce_security_token
        )
    
    def scan_email_message(self, email_message_id: str) -> Dict[str, Any]:
        """
        Scan a Salesforce EmailMessage for threats.
        
        Args:
            email_message_id: Salesforce EmailMessage ID
            
        Returns:
            RAG detection result
        """
        # Fetch email from Salesforce
        email = self.sf.EmailMessage.get(email_message_id)
        
        # Prepare document for scanning
        document = {
            "id": f"EmailMessage/{email_message_id}",
            "content": email.get("TextBody", ""),
            "metadata": {
                "source": "email",
                "salesforce_object": "EmailMessage",
                "from_address": email.get("FromAddress"),
                "subject": email.get("Subject"),
                "created_date": email.get("CreatedDate")
            }
        }
        
        # Add HTML body if available
        if email.get("HtmlBody"):
            document["content"] += "\n\n" + email.get("HtmlBody")
        
        # Scan with KoreShield
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Analyze email for Einstein AI processing",
                "documents": [document],
                "config": {
                    "min_confidence": self.config['rag_detection']['min_confidence']
                }
            }
        )
        
        result = response.json()
        
        # Handle threats
        if not result['is_safe']:
            self._handle_threat(email_message_id, result)
        
        return result
    
    def scan_chatter_post(self, feed_item_id: str) -> Dict[str, Any]:
        """
        Scan a Chatter FeedItem for threats.
        
        Args:
            feed_item_id: Salesforce FeedItem ID
            
        Returns:
            RAG detection result
        """
        # Fetch Chatter post
        feed_item = self.sf.FeedItem.get(feed_item_id)
        
        document = {
            "id": f"FeedItem/{feed_item_id}",
            "content": feed_item.get("Body", ""),
            "metadata": {
                "source": "chat_message",
                "salesforce_object": "FeedItem",
                "created_by": feed_item.get("CreatedById"),
                "parent_id": feed_item.get("ParentId"),
                "type": feed_item.get("Type")
            }
        }
        
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Analyze Chatter post",
                "documents": [document]
            }
        )
        
        result = response.json()
        
        if not result['is_safe']:
            self._handle_threat(feed_item_id, result, object_type="FeedItem")
        
        return result
    
    def scan_case_and_comments(self, case_id: str) -> Dict[str, Any]:
        """
        Scan a Salesforce Case and its comments for threats.
        
        Args:
            case_id: Salesforce Case ID
            
        Returns:
            RAG detection result
        """
        # Fetch case
        case = self.sf.Case.get(case_id)
        
        documents = [
            {
                "id": f"Case/{case_id}",
                "content": f"{case.get('Subject', '')}\n\n{case.get('Description', '')}",
                "metadata": {
                    "source": "customer_support",
                    "salesforce_object": "Case",
                    "case_number": case.get("CaseNumber"),
                    "priority": case.get("Priority"),
                    "status": case.get("Status")
                }
            }
        ]
        
        # Fetch case comments
        comments_query = f"SELECT Id, CommentBody, CreatedById, CreatedDate FROM CaseComment WHERE ParentId = '{case_id}'"
        comments = self.sf.query(comments_query)
        
        for comment in comments['records']:
            documents.append({
                "id": f"CaseComment/{comment['Id']}",
                "content": comment.get("CommentBody", ""),
                "metadata": {
                    "source": "customer_support",
                    "salesforce_object": "CaseComment",
                    "parent_case_id": case_id,
                    "created_by": comment['CreatedById']
                }
            })
        
        # Scan all documents (case + comments)
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Summarize case and suggest resolution",
                "documents": documents
            }
        )
        
        result = response.json()
        
        if not result['is_safe']:
            self._handle_threat(case_id, result, object_type="Case")
        
        return result
    
    def _handle_threat(
        self,
        record_id: str,
        scan_result: Dict[str, Any],
        object_type: str = "EmailMessage"
    ):
        """Handle detected threat."""
        severity = scan_result['overall_severity']
        
        # Get response actions from config
        actions = self.config['response_actions']
        
        # Block if severity meets threshold
        if actions['block']['enabled']:
            threshold = actions['block']['severity_threshold']
            if self._severity_meets_threshold(severity, threshold):
                self._block_record(record_id, object_type)
        
        # Flag record
        if actions['flag']['enabled']:
            self._flag_record(record_id, object_type, scan_result)
        
        # Quarantine if critical
        if actions['quarantine']['enabled']:
            threshold = actions['quarantine']['severity_threshold']
            if self._severity_meets_threshold(severity, threshold):
                self._quarantine_record(record_id, object_type)
    
    def _block_record(self, record_id: str, object_type: str):
        """Block/prevent processing of record."""
        print(f"[BLOCKED] {object_type}/{record_id}")
        # Implementation depends on your workflow
        # e.g., prevent Einstein from processing this record
    
    def _flag_record(
        self,
        record_id: str,
        object_type: str,
        scan_result: Dict[str, Any]
    ):
        """Flag record in Salesforce."""
        flag_field = self.config['response_actions']['flag']['flag_field']
        flag_value = self.config['response_actions']['flag']['flag_value']
        
        # Update record with security flag
        try:
            getattr(self.sf, object_type).update(
                record_id,
                {flag_field: flag_value}
            )
            print(f"[FLAGGED] {object_type}/{record_id}")
        except Exception as e:
            print(f"Error flagging record: {e}")
    
    def _quarantine_record(self, record_id: str, object_type: str):
        """Move record to quarantine queue."""
        queue_name = self.config['response_actions']['quarantine'].get(
            'quarantine_queue',
            'Security_Review_Queue'
        )
        
        print(f"[QUARANTINED] {object_type}/{record_id} -> {queue_name}")
        # Move to security review queue/view
    
    def _severity_meets_threshold(
        self,
        severity: str,
        threshold: str
    ) -> bool:
        """Check if severity meets threshold."""
        severity_levels = {"safe": 0, "low": 1, "medium": 2, "high": 3, "critical": 4}
        return severity_levels.get(severity, 0) >= severity_levels.get(threshold, 0)


# Example Usage
if __name__ == "__main__":
    # Initialize client
    client = SalesforceRAGSecurityClient(
        koreshield_url="http://localhost:8000",
        salesforce_instance_url=os.getenv("SF_INSTANCE_URL"),
        salesforce_username=os.getenv("SF_USERNAME"),
        salesforce_password=os.getenv("SF_PASSWORD"),
        salesforce_security_token=os.getenv("SF_SECURITY_TOKEN")
    )
    
    # Example 1: Scan email before Einstein processes it
    print("\n=== Example 1: Scan Email ===")
    email_result = client.scan_email_message("001xx000001ABCD")
    print(f"Email is safe: {email_result['is_safe']}")
    print(f"Severity: {email_result['overall_severity']}")
    
    # Example 2: Scan Chatter post
    print("\n=== Example 2: Scan Chatter Post ===")
    chatter_result = client.scan_chatter_post("0D5xx000001EFGH")
    print(f"Chatter post is safe: {chatter_result['is_safe']}")
    
    # Example 3: Scan case with comments (multi-document)
    print("\n=== Example 3: Scan Case + Comments ===")
    case_result = client.scan_case_and_comments("500xx000001IJKL")
    print(f"Case is safe: {case_result['is_safe']}")
    if case_result.get('context_analysis', {}).get('cross_document_threats'):
        print("Cross-document threats detected!")
