"""
AfroVending - Payout Email Notifications
Handles all payout-related email notifications
"""
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import os
import logging
from datetime import datetime, timezone

from database import get_db

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@afrovending.com')


def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email via SendGrid"""
    if not SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured, skipping email")
        return False
        
    try:
        message = Mail(
            from_email=Email(SENDER_EMAIL, "AfroVending"),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html_content)
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        if response.status_code in [200, 201, 202]:
            logger.info(f"Payout email sent successfully to {to_email}")
            return True
        else:
            logger.error(f"Payout email send failed with status {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send payout email to {to_email}: {str(e)}")
        return False


async def send_payout_initiated_email(vendor: dict, amount: float, payout_id: str, payout_type: str = "manual") -> bool:
    """Send email when a payout is initiated"""
    db = get_db()
    
    # Get vendor's user email
    user = await db.users.find_one({"id": vendor.get("user_id")}, {"_id": 0})
    if not user:
        logger.error(f"User not found for vendor {vendor.get('id')}")
        return False
    
    to_email = vendor.get("email") or user.get("email")
    store_name = vendor.get("store_name", "Your Store")
    
    subject = f"💸 Payout Initiated - ${amount:.2f}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">💸 Payout Initiated</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
                <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                    Hi <strong>{store_name}</strong>,
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Great news! Your {"automatic" if payout_type == "automatic" else "requested"} payout has been initiated and is on its way to your bank account.
                </p>
                
                <!-- Payout Details Card -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #22c55e;">
                    <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Payout Details</h3>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #666; font-size: 14px;">Amount:</td>
                            <td style="padding: 10px 0; color: #22c55e; font-size: 20px; font-weight: bold; text-align: right;">${amount:.2f}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666; font-size: 14px;">Type:</td>
                            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right;">{"Automatic Payout" if payout_type == "automatic" else "Manual Request"}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666; font-size: 14px;">Payout ID:</td>
                            <td style="padding: 10px 0; color: #333; font-size: 12px; text-align: right; font-family: monospace;">{payout_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666; font-size: 14px;">Status:</td>
                            <td style="padding: 10px 0; text-align: right;">
                                <span style="background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Processing</span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    <strong>Estimated Arrival:</strong> 2-3 business days, depending on your bank.
                </p>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    You can track all your payouts in your <a href="https://afrovending.com/vendor/payouts" style="color: #22c55e; text-decoration: none; font-weight: 600;">Vendor Dashboard</a>.
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://afrovending.com/vendor/payouts" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        View Payout History
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Questions about your payout? Reply to this email or contact <a href="mailto:support@afrovending.com" style="color: #22c55e;">support@afrovending.com</a>
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                    © {datetime.now().year} AfroVending. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return _send_email(to_email, subject, html_content)


async def send_payout_completed_email(vendor: dict, amount: float, payout_id: str) -> bool:
    """Send email when a payout has been completed/paid"""
    db = get_db()
    
    user = await db.users.find_one({"id": vendor.get("user_id")}, {"_id": 0})
    if not user:
        logger.error(f"User not found for vendor {vendor.get('id')}")
        return False
    
    to_email = vendor.get("email") or user.get("email")
    store_name = vendor.get("store_name", "Your Store")
    
    subject = f"✅ Payout Completed - ${amount:.2f} Deposited"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">✅ Payout Completed!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
                <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                    Hi <strong>{store_name}</strong>,
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Your payout has been successfully deposited to your bank account! 🎉
                </p>
                
                <!-- Success Card -->
                <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                    <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0;">Amount Deposited</p>
                    <p style="color: #166534; font-size: 36px; font-weight: bold; margin: 0;">${amount:.2f}</p>
                    <p style="color: #22c55e; font-size: 12px; margin: 10px 0 0 0;">
                        <span style="background: white; padding: 4px 12px; border-radius: 20px;">Paid</span>
                    </p>
                </div>
                
                <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                        <strong>Payout ID:</strong> <span style="font-family: monospace;">{payout_id}</span>
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    Keep up the great work! Your sales are making a difference in bringing African products to the world. 🌍
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://afrovending.com/vendor/payouts" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        View Earnings Dashboard
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Thank you for being a valued AfroVending vendor!
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                    © {datetime.now().year} AfroVending. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return _send_email(to_email, subject, html_content)


async def send_payout_failed_email(vendor: dict, amount: float, payout_id: str, error_message: str) -> bool:
    """Send email when a payout fails"""
    db = get_db()
    
    user = await db.users.find_one({"id": vendor.get("user_id")}, {"_id": 0})
    if not user:
        logger.error(f"User not found for vendor {vendor.get('id')}")
        return False
    
    to_email = vendor.get("email") or user.get("email")
    store_name = vendor.get("store_name", "Your Store")
    
    subject = f"⚠️ Payout Issue - Action Required"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Payout Issue</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
                <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                    Hi <strong>{store_name}</strong>,
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Unfortunately, there was an issue processing your payout. Don't worry - your funds are safe and we'll help you resolve this.
                </p>
                
                <!-- Error Card -->
                <div style="background: #fef3c7; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                    <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">Payout Details</h3>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #92400e; font-size: 14px;">Amount:</td>
                            <td style="padding: 10px 0; color: #92400e; font-size: 18px; font-weight: bold; text-align: right;">${amount:.2f}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #92400e; font-size: 14px;">Status:</td>
                            <td style="padding: 10px 0; text-align: right;">
                                <span style="background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Failed</span>
                            </td>
                        </tr>
                    </table>
                    
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fbbf24;">
                        <p style="color: #92400e; font-size: 12px; margin: 0;">
                            <strong>Issue:</strong> {error_message}
                        </p>
                    </div>
                </div>
                
                <h3 style="color: #333; font-size: 16px;">What to do next:</h3>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                    <li>Check your bank account details in Store Settings</li>
                    <li>Verify your identity verification is complete</li>
                    <li>Ensure your account is in good standing</li>
                    <li>Contact our support team if the issue persists</li>
                </ul>
                
                <!-- CTA Buttons -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://afrovending.com/vendor/store-settings" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                        Check Settings
                    </a>
                    <a href="mailto:support@afrovending.com" style="display: inline-block; background: white; color: #f59e0b; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #f59e0b;">
                        Contact Support
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Need help? Reply to this email or contact <a href="mailto:support@afrovending.com" style="color: #f59e0b;">support@afrovending.com</a>
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                    © {datetime.now().year} AfroVending. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return _send_email(to_email, subject, html_content)


async def send_auto_payout_enabled_email(vendor: dict, threshold: float, frequency: str) -> bool:
    """Send email when vendor enables automatic payouts"""
    db = get_db()
    
    user = await db.users.find_one({"id": vendor.get("user_id")}, {"_id": 0})
    if not user:
        return False
    
    to_email = vendor.get("email") or user.get("email")
    store_name = vendor.get("store_name", "Your Store")
    
    frequency_text = {
        "weekly": "Weekly",
        "biweekly": "Bi-weekly",
        "monthly": "Monthly"
    }.get(frequency, frequency.capitalize())
    
    subject = "🔄 Automatic Payouts Enabled"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔄 Auto-Payouts Enabled</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
                <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                    Hi <strong>{store_name}</strong>,
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    You've successfully enabled automatic payouts for your store! Here's your configuration:
                </p>
                
                <!-- Settings Card -->
                <div style="background: #eff6ff; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                    <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Your Payout Settings</h3>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #1e40af; font-size: 14px;">Threshold:</td>
                            <td style="padding: 10px 0; color: #1e40af; font-size: 18px; font-weight: bold; text-align: right;">${threshold:.2f}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #1e40af; font-size: 14px;">Frequency:</td>
                            <td style="padding: 10px 0; color: #1e40af; font-size: 14px; text-align: right;">{frequency_text}</td>
                        </tr>
                    </table>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    <strong>How it works:</strong> When your available balance reaches ${threshold:.2f} or more, we'll automatically initiate a payout to your bank account on your scheduled payout day.
                </p>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    You can change these settings or disable automatic payouts at any time from your dashboard.
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://afrovending.com/vendor/payouts" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        View Payout Settings
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                    © {datetime.now().year} AfroVending. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return _send_email(to_email, subject, html_content)
