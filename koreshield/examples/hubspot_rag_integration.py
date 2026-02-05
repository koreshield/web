"""
HubSpot RAG Integration Example

This script demonstrates how to integrate KoreShield RAG detection
with HubSpot for secure conversation and ticket analysis.
"""

import os
from typing import List, Dict, Any
import httpx
from hubspot import HubSpot
from hubspot.crm.tickets import SimplePublicObjectInput
import yaml


class HubSpotRAGSecurityClient:
    """Client for securing HubSpot RAG workflows."""
    
    def __init__(
        self,
        koreshield_url: str = "http://localhost:8000",
        hubspot_access_token: str = None,
        config_path: str = "crm_templates/hubspot/rag_config.yaml"
    ):
        """
        Initialize HubSpot RAG Security Client.
        
        Args:
            koreshield_url: KoreShield API URL
            hubspot_access_token: HubSpot API access token
            config_path: Path to HubSpot RAG config template
        """
        self.koreshield_url = koreshield_url
        self.http_client = httpx.Client(timeout=30.0)
        
        # Load RAG security config
        with open(config_path) as f:
            self.config = yaml.safe_load(f)
        
        # Initialize HubSpot client
        self.hs = HubSpot(access_token=hubspot_access_token)
    
    def scan_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """
        Scan a HubSpot conversation for threats.
        
        Args:
            conversation_id: HubSpot conversation ID
            
        Returns:
            RAG detection result
        """
        # Fetch conversation messages
        # Note: Use HubSpot Conversations API
        conversation_response = self.hs.conversations.conversations_api.get_by_id(
            conversation_id
        )
        
        messages = conversation_response.messages
        
        # Prepare documents from messages
        documents = []
        for idx, message in enumerate(messages):
            documents.append({
                "id": f"conversation/{conversation_id}/message/{idx}",
                "content": message.text,
                "metadata": {
                    "source": "chat_message",
                    "hubspot_object": "conversations",
                    "sender_id": message.sender.get("actorId"),
                    "timestamp": message.created_at
                }
            })
        
        # Scan conversation thread
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Generate chatbot response or summary",
                "documents": documents
            }
        )
        
        result = response.json()
        
        if not result['is_safe']:
            self._handle_conversation_threat(conversation_id, result)
        
        return result
    
    def scan_ticket(self, ticket_id: str) -> Dict[str, Any]:
        """
        Scan a HubSpot ticket for threats.
        
        Args:
            ticket_id: HubSpot ticket ID
            
        Returns:
            RAG detection result
        """
        # Fetch ticket
        ticket = self.hs.crm.tickets.basic_api.get_by_id(
            ticket_id,
            properties=["content", "subject", "hs_ticket_priority"]
        )
        
        document = {
            "id": f"ticket/{ticket_id}",
            "content": f"{ticket.properties.get('subject', '')}\n\n{ticket.properties.get('content', '')}",
            "metadata": {
                "source": "customer_support",
                "hubspot_object": "tickets",
                "ticket_id": ticket_id,
                "priority": ticket.properties.get("hs_ticket_priority")
            }
        }
        
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Analyze support ticket",
                "documents": [document]
            }
        )
        
        result = response.json()
        
        if not result['is_safe']:
            self._handle_ticket_threat(ticket_id, result)
        
        return result
    
    def scan_deal_notes(self, deal_id: str) -> Dict[str, Any]:
        """
        Scan HubSpot deal and associated notes.
        
        Args:
            deal_id: HubSpot deal ID
            
        Returns:
            RAG detection result
        """
        # Fetch deal
        deal = self.hs.crm.deals.basic_api.get_by_id(
            deal_id,
            properties=["dealname", "hs_note_body"]
        )
        
        # Fetch associated notes
        # Note: Use engagements API for notes
        notes_response = self.hs.crm.objects.notes.basic_api.get_page(
            associations=[deal_id]
        )
        
        documents = [
            {
                "id": f"deal/{deal_id}",
                "content": deal.properties.get("hs_note_body", ""),
                "metadata": {
                    "source": "database",
                    "hubspot_object": "deals",
                    "deal_name": deal.properties.get("dealname")
                }
            }
        ]
        
        for note in notes_response.results:
            documents.append({
                "id": f"note/{note.id}",
                "content": note.properties.get("hs_note_body", ""),
                "metadata": {
                    "source": "database",
                    "hubspot_object": "notes",
                    "associated_deal": deal_id
                }
            })
        
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Summarize deal status and notes",
                "documents": documents
            }
        )
        
        result = response.json()
        
        if not result['is_safe']:
            self._handle_deal_threat(deal_id, result)
        
        return result
    
    def scan_form_submission(self, form_submission: Dict[str, Any]) -> Dict[str, Any]:
        """
        Scan a form submission for spam/injection.
        
        Args:
            form_submission: Form submission data
            
        Returns:
            RAG detection result
        """
        # Extract form field values
        field_values = []
        for field in form_submission.get("values", []):
            field_values.append(f"{field['name']}: {field['value']}")
        
        document = {
            "id": f"form_submission/{form_submission.get('submission_id')}",
            "content": "\n".join(field_values),
            "metadata": {
                "source": "web_scraping",
                "hubspot_object": "form_submissions",
                "form_id": form_submission.get("form_id"),
                "page_url": form_submission.get("page_url")
            }
        }
        
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Validate form submission",
                "documents": [document]
            }
        )
        
        result = response.json()
        
        if not result['is_safe']:
            # Block spam submission
            print(f"[SPAM BLOCKED] Form submission: {result['overall_severity']}")
            return {"blocked": True, "reason": result}
        
        return {"blocked": False}
    
    def _handle_conversation_threat(
        self,
        conversation_id: str,
        scan_result: Dict[str, Any]
    ):
        """Handle threat in conversation."""
        severity = scan_result['overall_severity']
        
        # Escalate to human agent for high/critical severity
        if severity in ["high", "critical"]:
            print(f"[ESCALATE] Conversation {conversation_id} escalated to human agent")
            # Transfer conversation to human agent
        
        # Tag conversation
        print(f"[TAG] Conversation {conversation_id} tagged as security_flagged")
    
    def _handle_ticket_threat(self, ticket_id: str, scan_result: Dict[str, Any]):
        """Handle threat in ticket."""
        tag_name = self.config['response_actions']['flag']['tag_name']
        
        # Tag ticket
        try:
            self.hs.crm.tickets.basic_api.update(
                ticket_id,
                simple_public_object_input=SimplePublicObjectInput(
                    properties={"hs_tag": tag_name}
                )
            )
            print(f"[TAGGED] Ticket {ticket_id} tagged as {tag_name}")
        except Exception as e:
            print(f"Error tagging ticket: {e}")
    
    def _handle_deal_threat(self, deal_id: str, scan_result: Dict[str, Any]):
        """Handle threat in deal."""
        print(f"[ALERT] Deal {deal_id} flagged for security review")
        # Alert sales team, add internal note


# Example Usage
if __name__ == "__main__":
    # Initialize client
    client = HubSpotRAGSecurityClient(
        koreshield_url="http://localhost:8000",
        hubspot_access_token=os.getenv("HUBSPOT_ACCESS_TOKEN")
    )
    
    # Example 1: Scan conversation before chatbot responds
    print("\n=== Example 1: Scan Conversation ===")
    conversation_result = client.scan_conversation("12345")
    print(f"Conversation is safe: {conversation_result['is_safe']}")
    
    # Example 2: Scan support ticket
    print("\n=== Example 2: Scan Ticket ===")
    ticket_result = client.scan_ticket("67890")
    print(f"Ticket is safe: {ticket_result['is_safe']}")
    
    # Example 3: Scan deal and notes
    print("\n=== Example 3: Scan Deal + Notes ===")
    deal_result = client.scan_deal_notes("11111")
    print(f"Deal is safe: {deal_result['is_safe']}")
    
    # Example 4: Scan form submission (spam detection)
    print("\n=== Example 4: Scan Form Submission ===")
    form_data = {
        "submission_id": "22222",
        "form_id": "contact-form",
        "page_url": "https://example.com/contact",
        "values": [
            {"name": "email", "value": "user@example.com"},
            {"name": "message", "value": "<script>alert('xss')</script>"}
        ]
    }
    form_result = client.scan_form_submission(form_data)
    if form_result['blocked']:
        print("Form submission BLOCKED as spam/injection")
