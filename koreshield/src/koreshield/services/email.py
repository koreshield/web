"""
Email service using Resend API.
"""
import os
from typing import Optional
from urllib.parse import urlencode

import httpx
import structlog
from dotenv import load_dotenv

logger = structlog.get_logger(__name__)

load_dotenv(".env.local")
load_dotenv(".env")

RESEND_API_URL = "https://api.resend.com/emails"


def _get_resend_api_key() -> str:
    """Read the Resend API key lazily so runtime env loading works reliably."""
    return os.getenv("RESEND_API_KEY", "").strip()


def _get_public_app_base_url() -> str:
    """Return the public web app URL used for user-facing email links."""
    base_url = (
        os.getenv("KORESHIELD_APP_URL")
        or os.getenv("FRONTEND_BASE_URL")
        or os.getenv("APP_BASE_URL")
        or "https://koreshield.com"
    )
    return base_url.rstrip("/")


def _build_public_url(path: str, **query_params: str) -> str:
    """Build a public web URL for emails."""
    url = f"{_get_public_app_base_url()}/{path.lstrip('/')}"
    if query_params:
        return f"{url}?{urlencode(query_params)}"
    return url

async def send_email(
    to: str,
    subject: str,
    html: str,
    from_email: str = "KoreShield <hello@koreshield.com>",
) -> bool:
    """
    Send email via Resend API.

    Args:
        to: Recipient email address
        subject: Email subject
        html: HTML email body
        from_email: Sender email (must be verified in Resend)

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    resend_api_key = _get_resend_api_key()

    if not resend_api_key:
        logger.error("resend_api_key_not_configured")
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": from_email,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
                timeout=10.0,
            )

            if response.status_code == 200:
                logger.info("email_sent_successfully", to=to, subject=subject)
                return True
            else:
                logger.error(
                    "email_send_failed",
                    to=to,
                    status_code=response.status_code,
                    response=response.text
                )
                return False

    except Exception as e:
        logger.error("email_send_exception", to=to, error=str(e))
        return False


async def send_welcome_email(email: str, name: Optional[str] = None) -> bool:
    """Send welcome email to new user."""
    display_name = name or email.split('@')[0]
    login_url = _build_public_url("/login")
    docs_url = _build_public_url("/docs")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
            .feature {{ margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #667eea; }}
            .feature-title {{ font-weight: 600; color: #667eea; margin-bottom: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 32px;">Welcome to KoreShield! </h1>
            </div>
            <div class="content">
                <p>Hi {display_name},</p>

                <p>Welcome to KoreShield - your AI security firewall! We're excited to have you on board.</p>

                <p>KoreShield protects your AI applications from:</p>

                <div class="feature">
                    <div class="feature-title">Prompt Injection Attacks</div>
                    <div>Advanced detection and blocking of malicious prompts trying to manipulate your AI</div>
                </div>

                <div class="feature">
                    <div class="feature-title">Data Leakage Prevention</div>
                    <div>Protect sensitive information from being exposed through AI responses</div>
                </div>

                <div class="feature">
                    <div class="feature-title">Real-time Monitoring</div>
                    <div>Track threats, analyze patterns, and get instant alerts</div>
                </div>

                <div class="feature">
                    <div class="feature-title">⚡ Multi-Provider Support</div>
                    <div>Works with OpenAI, Anthropic, Google Gemini, DeepSeek, and more</div>
                </div>

                <p style="margin-top: 30px;">
                    <a href="{login_url}" class="button">Get Started →</a>
                </p>

                <p>If you have any questions, our documentation is available at <a href="{docs_url}">{docs_url}</a></p>

                <p>Need help? Reply to this email or reach out to our founders:</p>
                <ul>
                    <li>Teslim - Co-Founder</li>
                    <li>Isaac - Co-Founder</li>
                </ul>

                <p>Best regards,<br>
                The KoreShield Team</p>
            </div>
            <div class="footer">
                <p>KoreShield - AI Security Made Simple</p>
                <p>Built with ❤ by Teslim & Isaac</p>
            </div>
        </div>
    </body>
    </html>
    """

    return await send_email(
        to=email,
        subject="Welcome to KoreShield! ",
        html=html
    )


async def send_verification_email(email: str, token: str, name: Optional[str] = None) -> bool:
    """Send email verification link."""
    display_name = name or email.split('@')[0]
    verification_url = _build_public_url("/verify-email", token=token)

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }}
            .button {{ display: inline-block; padding: 14px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: 600; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
            .code {{ background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 16px; text-align: center; letter-spacing: 2px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Verify Your Email</h1>
            </div>
            <div class="content">
                <p>Hi {display_name},</p>

                <p>Thanks for signing up! Please verify your email address to activate your KoreShield account.</p>

                <p style="text-align: center;">
                    <a href="{verification_url}" class="button">Verify Email Address</a>
                </p>

                <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <div class="code">{verification_url}</div>

                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                    This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                </p>
            </div>
            <div class="footer">
                <p>KoreShield - AI Security Made Simple</p>
            </div>
        </div>
    </body>
    </html>
    """

    return await send_email(
        to=email,
        subject="Verify your KoreShield email address",
        html=html
    )


async def send_password_reset_email(email: str, token: str, name: Optional[str] = None) -> bool:
    """Send password reset link."""
    display_name = name or email.split("@")[0]
    reset_url = _build_public_url("/reset-password", token=token)

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #0f766e 0%, #0f172a 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }}
            .button {{ display: inline-block; padding: 14px 40px; background: #0f766e; color: white; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: 600; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
            .code {{ background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px; word-break: break-all; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
            </div>
            <div class="content">
                <p>Hi {display_name},</p>

                <p>We received a request to reset the password for your KoreShield account.</p>

                <p style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Password</a>
                </p>

                <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <div class="code">{reset_url}</div>

                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                    This link will expire in 15 minutes. If you didn't request a password reset, you can safely ignore this email.
                </p>
            </div>
            <div class="footer">
                <p>KoreShield - AI Security Made Simple</p>
            </div>
        </div>
    </body>
    </html>
    """

    return await send_email(
        to=email,
        subject="Reset your KoreShield password",
        html=html,
    )


async def send_admin_mfa_email(email: str, code: str, name: Optional[str] = None) -> bool:
    """Send a one-time MFA code for privileged dashboard access."""
    display_name = name or email.split("@")[0]

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #111827 0%, #0f766e 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }}
            .code {{ background: #f3f4f6; padding: 18px; border-radius: 8px; font-family: monospace; font-size: 28px; text-align: center; letter-spacing: 8px; font-weight: 700; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Admin verification required</h1>
            </div>
            <div class="content">
                <p>Hi {display_name},</p>
                <p>Use this verification code to complete your privileged KoreShield sign-in:</p>
                <div class="code">{code}</div>
                <p style="margin-top: 24px;">This code expires in 10 minutes and can only be used once.</p>
                <p>If you did not attempt to sign in to a privileged KoreShield session, ignore this email and rotate your password if needed.</p>
            </div>
            <div class="footer">
                <p>KoreShield privileged access verification</p>
            </div>
        </div>
    </body>
    </html>
    """

    return await send_email(
        to=email,
        subject="Your KoreShield admin verification code",
        html=html,
    )
