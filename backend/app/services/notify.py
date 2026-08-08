from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> bool:
    if not settings.smtp_host:
        logger.info("SMTP not configured; falling back to log for notification to %s", to)
        logger.info("Notification to %s: %s - %s", to, subject, body)
        return False

    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = settings.smtp_from or settings.smtp_user or 'noreply@example.com'
        msg['To'] = to
        msg.set_content(body)

        port = settings.smtp_port or 587
        with smtplib.SMTP(settings.smtp_host, port, timeout=10) as smtp:
            smtp.starttls()
            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(msg)
        logger.info("Sent notification email to %s", to)
        return True
    except Exception as exc:  # pragma: no cover - best-effort notification
        logger.exception("Failed to send notification to %s: %s", to, exc)
        logger.info("Falling back to logging notification to %s", to)
        logger.info("Notification to %s: %s - %s", to, subject, body)
        return False


def notify_department_by_email(department_email: Optional[str], report_id: str, summary: str) -> None:
    if not department_email:
        logger.info("No department email configured; skipping notification for report %s", report_id)
        return
    subject = f"New report received: {report_id}"
    link = f"{settings.public_base_url}/reports/{report_id}"
    body = f"A new citizen report was received.\n\nReport ID: {report_id}\nSummary: {summary}\nLink: {link}\n"
    send_email(department_email, subject, body)
