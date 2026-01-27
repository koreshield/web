"""
CRM Security Templates for KoreShield
=====================================

This module provides specialized security templates for CRM platforms that use AI features.
Each template includes:
- Platform-specific security policies
- Attack pattern detection rules
- PII protection configurations
- Business logic safeguards
- Integration testing frameworks

Supported CRMs:
- Salesforce (Einstein)
- HubSpot (AI Assistant & Chatbot)
- Zendesk (Support AI)
- Intercom (Customer Messaging)
- Pipedrive (Sales Automation)
- Generic (Configurable base template)
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, field
from enum import Enum
import structlog

logger = structlog.get_logger(__name__)


class CRMPlatform(Enum):
    """Supported CRM platforms."""
    SALESFORCE = "salesforce"
    HUBSPOT = "hubspot"
    ZENDESK = "zendesk"
    INTERCOM = "intercom"
    PIPEDRIVE = "pipedrive"
    GENERIC = "generic"


class CRMFeature(Enum):
    """CRM AI features that need protection."""
    CHATBOT = "chatbot"
    AI_ASSISTANT = "ai_assistant"
    SALES_AUTOMATION = "sales_automation"
    SUPPORT_TICKET_AI = "support_ticket_ai"
    CUSTOMER_MESSAGING = "customer_messaging"
    LEAD_SCORING = "lead_scoring"
    EMAIL_AUTOMATION = "email_automation"
    PREDICTIVE_ANALYTICS = "predictive_analytics"


@dataclass
class CRMSecurityPolicy:
    """Security policy configuration for CRM platforms."""
    platform: CRMPlatform
    features: Set[CRMFeature]
    sensitivity_level: str = "medium"
    enable_pii_detection: bool = True
    enable_business_logic_protection: bool = True
    enable_conversation_isolation: bool = True
    custom_rules: List[Dict[str, Any]] = field(default_factory=list)
    blocked_patterns: List[str] = field(default_factory=list)
    allowed_patterns: List[str] = field(default_factory=list)


@dataclass
class CRMAttackPattern:
    """CRM-specific attack patterns."""
    name: str
    description: str
    pattern_type: str  # "regex", "keyword", "semantic"
    pattern: str
    severity: str
    category: str  # "pii", "business_logic", "conversation_hijacking", "context_poisoning"
    platforms: Set[CRMPlatform]
    examples: List[str] = field(default_factory=list)
    mitigation: str = ""


class CRMTemplate(ABC):
    """Base class for CRM security templates."""

    def __init__(self, platform: CRMPlatform):
        self.platform = platform
        self.logger = structlog.get_logger(f"{__name__}.{platform.value}")

    @abstractmethod
    def get_security_policy(self) -> CRMSecurityPolicy:
        """Get the default security policy for this CRM platform."""
        pass

    @abstractmethod
    def get_attack_patterns(self) -> List[CRMAttackPattern]:
        """Get CRM-specific attack patterns."""
        pass

    @abstractmethod
    def get_pii_patterns(self) -> List[Dict[str, Any]]:
        """Get PII detection patterns specific to this CRM."""
        pass

    @abstractmethod
    def get_business_logic_rules(self) -> List[Dict[str, Any]]:
        """Get business logic protection rules."""
        pass

    def validate_configuration(self, config: Dict[str, Any]) -> List[str]:
        """Validate CRM-specific configuration. Returns list of validation errors."""
        errors = []
        # Common validation logic
        if "api_key" not in config and "oauth_config" not in config:
            errors.append("Either api_key or oauth_config must be provided")
        return errors

    def get_integration_tests(self) -> List[Dict[str, Any]]:
        """Get integration test configurations for this CRM."""
        return []


class CRMTemplateRegistry:
    """Registry for CRM templates."""

    def __init__(self):
        self.templates: Dict[CRMPlatform, CRMTemplate] = {}

    def register(self, platform: CRMPlatform, template: CRMTemplate):
        """Register a CRM template."""
        self.templates[platform] = template
        logger.info("Registered CRM template", platform=platform.value)

    def get_template(self, platform: CRMPlatform) -> Optional[CRMTemplate]:
        """Get a CRM template by platform."""
        return self.templates.get(platform)

    def get_available_platforms(self) -> List[CRMPlatform]:
        """Get list of available CRM platforms."""
        return list(self.templates.keys())


# Global registry instance
crm_registry = CRMTemplateRegistry()

# Import and register all CRM templates
try:
    from .salesforce import SalesforceTemplate
    crm_registry.register(CRMPlatform.SALESFORCE, SalesforceTemplate())
    logger.info("Loaded Salesforce CRM template")
except ImportError as e:
    logger.warning("Failed to load Salesforce template", error=str(e))

try:
    from .hubspot import HubSpotTemplate
    crm_registry.register(CRMPlatform.HUBSPOT, HubSpotTemplate())
    logger.info("Loaded HubSpot CRM template")
except ImportError as e:
    logger.warning("Failed to load HubSpot template", error=str(e))

try:
    from .zendesk import ZendeskTemplate
    crm_registry.register(CRMPlatform.ZENDESK, ZendeskTemplate())
    logger.info("Loaded Zendesk CRM template")
except ImportError as e:
    logger.warning("Failed to load Zendesk template", error=str(e))

try:
    from .intercom import IntercomTemplate
    crm_registry.register(CRMPlatform.INTERCOM, IntercomTemplate())
    logger.info("Loaded Intercom CRM template")
except ImportError as e:
    logger.warning("Failed to load Intercom template", error=str(e))

try:
    from .pipedrive import PipedriveTemplate
    crm_registry.register(CRMPlatform.PIPEDRIVE, PipedriveTemplate())
    logger.info("Loaded Pipedrive CRM template")
except ImportError as e:
    logger.warning("Failed to load Pipedrive template", error=str(e))

try:
    from .generic import GenericCRMTemplate
    crm_registry.register(CRMPlatform.GENERIC, GenericCRMTemplate())
    logger.info("Loaded Generic CRM template")
except ImportError as e:
    logger.warning("Failed to load Generic CRM template", error=str(e))