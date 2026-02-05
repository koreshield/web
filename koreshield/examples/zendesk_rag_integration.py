"""
Zendesk RAG Integration Example

This script demonstrates how to integrate KoreShield RAG detection
with Zendesk for secure ticket and chat analysis.
"""

import os
from typing import List, Dict, Any
import httpx
from zenpy import Zenpy
from zenpy.lib.api_objects import Ticket, Comment
import yaml


class ZendeskRAGSecurityClient:
    """Client for securing Zendesk RAG workflows."""
    
    def __init__(
        self,
        koreshield_url: str = "http://localhost:8000",
        zendesk_subdomain: str = None,
        zendesk_email: str = None,
        zendesk_token: str = None,
        config_path: str = "crm_templates/zendesk/rag_config.yaml"
    ):
        """
        Initialize Zendesk RAG Security Client.
        
        Args:
            koreshield_url: KoreShield API URL
            zendesk_subdomain: Zendesk subdomain
            zendesk_email: Zendesk email
            zendesk_token: Zendesk API token
            config_path: Path to Zendesk RAG config template
        """
        self.koreshield_url = koreshield_url
        self.http_client = httpx.Client(timeout=30.0)
        
        # Load RAG security config
        with open(config_path) as f:
            self.config = yaml.safe_load(f)
        
        # Initialize Zendesk client
        creds = {
            'email': zendesk_email,
            'token': zendesk_token,
            'subdomain': zendesk_subdomain
        }
        self.zd = Zenpy(**creds)
    
    def scan_ticket_with_comments(self, ticket_id: int) -> Dict[str, Any]:
        """
        Scan a Zen desk ticket and all comments for threats.
        
        Args:
            ticket_id: Zendesk ticket ID
            
        Returns:
            RAG detection result
        """
        # Fetch ticket
        ticket = self.zd.tickets(id=ticket_id)
        
        # Prepare documents
        documents = [
            {
                "id": f"ticket/{ticket_id}",
                "content": f"{ticket.subject}\n\n{ticket.description}",
                "metadata": {
                    "source": "customer_support",
                    "zendesk_object": "tickets",
                    "ticket_id": ticket_id,
                    "priority": ticket.priority,
                    "status": ticket.status,
                    "requester_id": ticket.requester_id
                }
            }
        ]
        
        # Fetch all comments
        comments = self.zd.tickets.comments(ticket=ticket_id)
        for comment in comments:
            documents.append({
                "id": f"comment/{comment.id}",
                "content": comment.body,
                "metadata": {
                    "source": "customer_support",
                    "zendesk_object": "comments",
                    "ticket_id": ticket_id,
                    "author_id": comment.author_id,
                    "public": comment.public
                }
            })
        
        # Scan ticket + comments
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Summarize ticket and suggest resolution",
                "documents": documents
            }
        )
        
        result = response.json()
        
        if not result['is_safe']:
            self._handle_ticket_threat(ticket_id, result)
        
        return result
    
    def scan_chat_transcript(self, chat_id: str) -> Dict[str, Any]:
        """
        Scan a Zendesk chat transcript for threats.
        
        Args:
            chat_id: Zendesk chat ID
            
        Returns:
            RAG detection result
        """
        # Fetch chat
        # Note: Use Zendesk Chat API
        chat = self.zd.chats(id=chat_id)
        
        # Get chat messages
        messages = []
        for message in chat.messages:
            messages.append(f"[{message.nick}]: {message.msg}")
        
        document = {
            "id": f"chat/{chat_id}",
            "content": "\n".join(messages),
            "metadata": {
                "source": "chat_message",
                "zendesk_object": "chats",
                "chat_id": chat_id,
                "visitor_id": chat.visitor.id if hasattr(chat, 'visitor') else None
            }
        }
        
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Analyze chat and suggest next steps",
                "documents": [document]
            }
        )
        
        result = response.json()
        
        if not result['is_safe']:
            self._handle_chat_threat(chat_id, result)
        
        return result
    
    def scan_kb_article(self, article_id: int) -> Dict[str, Any]:
        """
        Scan a Knowledge Base article for poisoning attempts.
        
        Args:
            article_id: Zendesk article ID
            
        Returns:
            RAG detection result
        """
        # Fetch article
        article = self.zd.help_center.articles(id=article_id)
        
        document = {
            "id": f"article/{article_id}",
            "content": f"{article.title}\n\n{article.body}",
            "metadata": {
                "source": "knowledge_base",
                "zendesk_object": "articles",
                "article_id": article_id,
                "author_id": article.author_id,
                "section_id": article.section_id,
                "draft": article.draft
            }
        }
        
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Validate article content",
                "documents": [document]
            }
        )
        
        result = response.json()
        
        if not result['is_safe']:
            self._handle_article_threat(article_id, result)
        
        return result
    
    def scan_community_post(self, post_id: int) -> Dict[str, Any]:
        """
        Scan a community forum post for spam/injection.
        
        Args:
            post_id: Zendesk community post ID
            
        Returns:
            RAG detection result
        """
        # Fetch post
        post = self.zd.help_center.posts(id=post_id)
        
        document = {
            "id": f"post/{post_id}",
            "content": f"{post.title}\n\n{post.details}",
            "metadata": {
                "source": "knowledge_base",
                "zendesk_object": "posts",
                "post_id": post_id,
                "author_id": post.author_id,
                "topic_id": post.topic_id
            }
        }
        
        response = self.http_client.post(
            f"{self.koreshield_url}/v1/rag/scan",
            json={
                "user_query": "Check community post for spam",
                "documents": [document]
            }
        )
        
        result = response.json()
        
        if not result['is_safe']:
            # Block spam post
            self._block_community_post(post_id, result)
        
        return result
    
    def _handle_ticket_threat(self, ticket_id: int, scan_result: Dict[str, Any]):
        """Handle threat in ticket."""
        severity = scan_result['overall_severity']
        tags = self.config['response_actions']['tag']['tags']
        
        # Tag ticket
        ticket = self.zd.tickets(id=ticket_id)
        ticket.tags.extend(tags)
        self.zd.tickets.update(ticket)
        
        print(f"[TAGGED] Ticket {ticket_id} tagged with {tags}")
        
        # Suspend user if critical
        if severity == "critical" and self.config['response_actions']['suspend']['enabled']:
            requester_id = ticket.requester_id
            user = self.zd.users(id=requester_id)
            user.suspended = True
            self.zd.users.update(user)
            print(f"[SUSPENDED] User {requester_id} suspended due to critical threat")
    
    def _handle_chat_threat(self, chat_id: str, scan_result: Dict[str, Any]):
        """Handle threat in chat."""
        severity = scan_result['overall_severity']
        
        if severity in ["high", "critical"]:
            # Escalate to human agent
            print(f"[ESCALATE] Chat {chat_id} escalated to human agent")
            # Transfer chat to agent
    
    def _handle_article_threat(self, article_id: int, scan_result: Dict[str, Any]):
        """Handle threat in KB article."""
        # Move article to draft if published
        article = self.zd.help_center.articles(id=article_id)
        if not article.draft:
            article.draft = True
            self.zd.help_center.articles.update(article)
            print(f"[QUARANTINED] Article {article_id} moved to draft")
    
    def _block_community_post(self, post_id: int, scan_result: Dict[str, Any]):
        """Block spam community post."""
        # Delete or hide post
        post = self.zd.help_center.posts(id=post_id)
        self.zd.help_center.posts.delete(post)
        print(f"[BLOCKED] Community post {post_id} deleted as spam")
    
    def answer_bot_integration(self, ticket_id: int) -> Dict[str, Any]:
        """
        Integration with Zendesk Answer Bot.
        Scans ticket before Answer Bot suggests articles.
        
        Args:
            ticket_id: Zendesk ticket ID
            
        Returns:
            Safe articles to suggest or empty if threat detected
        """
        # Scan ticket first
        scan_result = self.scan_ticket_with_comments(ticket_id)
        
        if not scan_result['is_safe']:
            # Don't let Answer Bot process threatened tickets
            print(f"[BLOCKED] Answer Bot disabled for ticket {ticket_id} due to detected threat")
            return {"suggestions": [], "reason": "security_threat"}
        
        # Safe to proceed with Answer Bot
        # Get article suggestions from Answer Bot
        # ... Answer Bot logic here ...
        
        return {"suggestions": [], "safe": True}


# Example Usage
if __name__ == "__main__":
    # Initialize client
    client = ZendeskRAGSecurityClient(
        koreshield_url="http://localhost:8000",
        zendesk_subdomain=os.getenv("ZENDESK_SUBDOMAIN"),
        zendesk_email=os.getenv("ZENDESK_EMAIL"),
        zendesk_token=os.getenv("ZENDESK_TOKEN")
    )
    
    # Example 1: Scan ticket with comments
    print("\n=== Example 1: Scan Ticket + Comments ===")
    ticket_result = client.scan_ticket_with_comments(12345)
    print(f"Ticket is safe: {ticket_result['is_safe']}")
    if not ticket_result['is_safe']:
        print(f"Severity: {ticket_result['overall_severity']}")
        print(f"Threats: {ticket_result['context_analysis']['statistics']['total_threats_found']}")
    
    # Example 2: Scan chat transcript
    print("\n=== Example 2: Scan Chat ===")
    chat_result = client.scan_chat_transcript("chat123")
    print(f"Chat is safe: {chat_result['is_safe']}")
    
    # Example 3: Scan KB article before publishing
    print("\n=== Example 3: Scan KB Article ===")
    article_result = client.scan_kb_article(67890)
    print(f"Article is safe: {article_result['is_safe']}")
    
    # Example 4: Scan community post (spam detection)
    print("\n=== Example 4: Scan Community Post ===")
    post_result = client.scan_community_post(11111)
    if not post_result['is_safe']:
        print("Post BLOCKED as spam/injection")
    
    # Example 5: Answer Bot integration
    print("\n=== Example 5: Answer Bot Integration ===")
    answer_bot_result = client.answer_bot_integration(12345)
    if answer_bot_result.get('safe'):
        print("Safe to proceed with Answer Bot suggestions")
    else:
        print("Answer Bot disabled due to security threat")
