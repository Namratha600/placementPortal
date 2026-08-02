import logging

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

from app.config import settings

logger = logging.getLogger(__name__)

# Built once from our settings and reused for every email sent.
# SUPPRESS_SEND is driven entirely by EMAIL_ENABLED: when False (dev mode),
# FastAPI-Mail builds the message but skips the actual SMTP call.
conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USERNAME,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.SMTP_FROM,
    MAIL_FROM_NAME="Campus Placement Portal",
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_STARTTLS=settings.SMTP_TLS,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=settings.EMAIL_ENABLED,
    VALIDATE_CERTS=True,
    SUPPRESS_SEND=0 if settings.EMAIL_ENABLED else 1,
)

fm = FastMail(conf)

OTP_EMAIL_SUBJECT = "Campus Placement Portal - Email Verification"


def _build_otp_email_body(otp: str) -> str:
    """
    Professional OTP email template. Kept as a single function (rather than
    inlined in send_otp_email) so the wording can be updated in one place
    without touching the sending logic.
    """
    return (
        "Hello Student,\n\n"
        "Your One-Time Password (OTP) for verifying your Campus Placement "
        f"Portal account is:\n\n{otp}\n\n"
        "This OTP is valid for 10 minutes.\n"
        "Do not share this OTP with anyone.\n\n"
        "Regards,\n"
        "Campus Placement Portal\n"
        "SVECW"
    )


async def send_otp_email(to_email: str, otp: str) -> None:
    """
    Sends the OTP to the student's generated college email.

    Development mode (EMAIL_ENABLED=false, the default): no real email is
    sent — the OTP is printed to the console instead, so the flow stays
    fully testable without SMTP credentials.

    Production mode (EMAIL_ENABLED=true): sends a real email via SMTP,
    using whichever provider's credentials are set in .env.
    """
    if not settings.EMAIL_ENABLED:
        logger.info("EMAIL_ENABLED=false — printing OTP to console instead of sending email.")
        print(f"[DEV MODE] OTP for {to_email}: {otp}")

    message = MessageSchema(
        subject=OTP_EMAIL_SUBJECT,
        recipients=[to_email],
        body=_build_otp_email_body(otp),
        subtype=MessageType.plain,
    )

    try:
        await fm.send_message(message)
        if settings.EMAIL_ENABLED:
            logger.info(f"OTP email sent to {to_email}.")
    except Exception:
        logger.exception(f"Failed to send OTP email to {to_email}.")
        raise


ADMIN_INVITATION_SUBJECT = "You've been invited to the Campus Placement Portal"


def _build_admin_invitation_body(full_name: str, set_password_link: str) -> str:
    return (
        f"Hello {full_name},\n\n"
        "You've been invited to join the Campus Placement Portal as an "
        "administrator.\n\n"
        "To set up your account, please set your password using the link "
        f"below:\n\n{set_password_link}\n\n"
        "This link is valid for 24 hours and can only be used once.\n"
        "If you weren't expecting this invitation, you can safely ignore "
        "this email.\n\n"
        "Regards,\n"
        "Campus Placement Portal\n"
        "SVECW"
    )


async def send_admin_invitation_email(to_email: str, full_name: str, set_password_link: str) -> None:
    """
    Sends the invitation email to a newly-invited admin, containing their
    one-time "Set Password" link. Same dev/prod switch as OTP emails —
    reuses the same FastAPI-Mail connection config (conf/fm above).
    """
    if not settings.EMAIL_ENABLED:
        logger.info("EMAIL_ENABLED=false — printing invitation link to console instead of sending email.")
        print(f"[DEV MODE] Admin invitation link for {to_email}: {set_password_link}")

    message = MessageSchema(
        subject=ADMIN_INVITATION_SUBJECT,
        recipients=[to_email],
        body=_build_admin_invitation_body(full_name, set_password_link),
        subtype=MessageType.plain,
    )

    try:
        await fm.send_message(message)
        if settings.EMAIL_ENABLED:
            logger.info(f"Admin invitation email sent to {to_email}.")
    except Exception:
        logger.exception(f"Failed to send admin invitation email to {to_email}.")
        raise
RESUME_REMINDER_SUBJECT = "Reminder: Please update your resume"


def _build_resume_reminder_body() -> str:
    return (
        "Hello Student,\n\n"
        "This is a friendly reminder from the Campus Placement Portal to keep "
        "your resume up to date.\n\n"
        "Please log in to the portal and upload your latest resume so you stay "
        "eligible for upcoming placement drives.\n\n"
        "Regards,\n"
        "Campus Placement Portal\n"
        "SVECW"
    )


async def send_resume_update_reminder(recipients: list[str]) -> None:
    """
    Sends ONE reminder email with all students BCC'd (privacy-safe + efficient).
    Same dev/prod switch as the other emails: with EMAIL_ENABLED=false it just
    logs; with EMAIL_ENABLED=true it sends via SMTP.
    """
    if not recipients:
        logger.info("No student recipients for resume reminder.")
        return

    if not settings.EMAIL_ENABLED:
        logger.info("EMAIL_ENABLED=false — resume reminder not actually sent.")
        print(f"[DEV MODE] Resume reminder would go to {len(recipients)} students.")

    message = MessageSchema(
        subject=RESUME_REMINDER_SUBJECT,
        recipients=[settings.SMTP_FROM],   # visible To = the portal itself
        bcc=recipients,                    # students BCC'd for privacy
        body=_build_resume_reminder_body(),
        subtype=MessageType.plain,
    )
    try:
        await fm.send_message(message)
        if settings.EMAIL_ENABLED:
            logger.info(f"Resume reminder sent to {len(recipients)} students.")
    except Exception:
        logger.exception("Failed to send resume reminder email.")
        raise