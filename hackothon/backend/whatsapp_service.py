"""
ICCIP - WhatsApp Service (Twilio)
Sends health assessment reports via WhatsApp
"""

import os

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.environ.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")  # Twilio sandbox


def send_whatsapp_report(phone_number: str, patient_name: str, report_path: str = None) -> dict:
    """Send health assessment report via WhatsApp using Twilio"""
    if not phone_number.startswith("+"):
        phone_number = "+91" + phone_number  # Default to India

    whatsapp_to = f"whatsapp:{phone_number}"
    
    message_body = (
        f"Hello {patient_name}! 🏥\n\n"
        f"Your ICCIP health assessment report is ready.\n\n"
        f"📋 Please review your comprehensive health risk analysis, "
        f"personalized diet plan, and doctor recommendations.\n\n"
        f"⚠️ For any serious symptoms or high-risk conditions identified, "
        f"please consult a doctor immediately.\n\n"
        f"— ICCIP Health Platform"
    )

    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        # Send text message
        msg = client.messages.create(
            body=message_body,
            from_=TWILIO_WHATSAPP_FROM,
            to=whatsapp_to
        )

        result = {
            "status": "sent",
            "message_sid": msg.sid,
            "to": whatsapp_to,
            "patient_name": patient_name,
            "timestamp": msg.date_created.isoformat() if msg.date_created else None,
        }

        # Send PDF if available
        if report_path and os.path.exists(report_path):
            media_msg = client.messages.create(
                body="📄 Your detailed PDF report:",
                from_=TWILIO_WHATSAPP_FROM,
                to=whatsapp_to,
                media_url=[f"file://{report_path}"]  # Note: In production, use a public URL
            )
            result["pdf_status"] = "sent"
            result["pdf_message_sid"] = media_msg.sid

        return result

    except ImportError:
        print("⚠️ twilio not installed")
        return {
            "status": "unavailable",
            "message": "Twilio library not installed. Install with: pip install twilio",
            "to": whatsapp_to,
            "patient_name": patient_name
        }
    except Exception as e:
        print(f"WhatsApp send error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "to": whatsapp_to,
            "patient_name": patient_name,
            "message": "Check Twilio credentials and phone number format"
        }
