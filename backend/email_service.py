"""
AfroVending Email Service
Handles all transactional emails using SendGrid
"""
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import os
import logging

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@afrovending.com')

class EmailService:
    def __init__(self):
        self.api_key = SENDGRID_API_KEY
        self.sender = SENDER_EMAIL
        
    def _send(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send an email via SendGrid"""
        if not self.api_key:
            logger.warning("SendGrid API key not configured, skipping email")
            return False
            
        try:
            message = Mail(
                from_email=Email(self.sender, "AfroVending"),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"Email send failed with status {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_order_confirmation(self, to_email: str, order_data: dict) -> bool:
        """Send order confirmation email"""
        items_html = ""
        for item in order_data.get("items", []):
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.get('product_name', 'Product')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.get('price', 0):.2f}</td>
            </tr>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .footer {{ background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }}
                .order-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                .order-table th {{ background: #f5f5f5; padding: 12px; text-align: left; }}
                .total {{ font-size: 24px; color: #dc2626; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Order Confirmed!</h1>
                    <p style="margin: 10px 0 0 0;">Order #{order_data.get('id', '')[:8]}</p>
                </div>
                <div class="content">
                    <p>Thank you for your order! We're preparing your items for shipment.</p>
                    
                    <h3>Order Details</h3>
                    <table class="order-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                    
                    <div style="text-align: right; margin-top: 20px;">
                        <p class="total">Total: ${order_data.get('total', 0):.2f}</p>
                    </div>
                    
                    <h3>Shipping Address</h3>
                    <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
                        {order_data.get('shipping_address', '')}<br>
                        {order_data.get('shipping_city', '')}, {order_data.get('shipping_country', '')}
                    </p>
                    
                    <p style="margin-top: 30px;">You'll receive another email when your order ships.</p>
                </div>
                <div class="footer">
                    <p>AfroVending - Authentic African Products & Services</p>
                    <p>Questions? Contact support@afrovending.com</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send(to_email, f"Order Confirmed - #{order_data.get('id', '')[:8]}", html_content)
    
    def send_order_shipped(self, to_email: str, order_data: dict, tracking_number: str = None) -> bool:
        """Send shipping notification email"""
        tracking_html = ""
        if tracking_number:
            tracking_html = f"""
            <div style="background: #f0fdf4; border: 1px solid #22c55e; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #16a34a; margin: 0 0 10px 0;">Tracking Number</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 0;">{tracking_number}</p>
            </div>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .footer {{ background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Your Order Has Shipped!</h1>
                    <p style="margin: 10px 0 0 0;">Order #{order_data.get('id', '')[:8]}</p>
                </div>
                <div class="content">
                    <p>Great news! Your order is on its way to you.</p>
                    
                    {tracking_html}
                    
                    <h3>Shipping To</h3>
                    <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
                        {order_data.get('shipping_address', '')}<br>
                        {order_data.get('shipping_city', '')}, {order_data.get('shipping_country', '')}
                    </p>
                    
                    <p style="margin-top: 30px;">Thank you for shopping with AfroVending!</p>
                </div>
                <div class="footer">
                    <p>AfroVending - Authentic African Products & Services</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send(to_email, f"Your Order Has Shipped - #{order_data.get('id', '')[:8]}", html_content)
    
    def send_booking_confirmation(self, to_email: str, booking_data: dict) -> bool:
        """Send booking confirmation email"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .footer {{ background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }}
                .booking-card {{ background: #f5f3ff; border: 1px solid #c4b5fd; padding: 20px; border-radius: 10px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Booking Confirmed!</h1>
                </div>
                <div class="content">
                    <p>Your service booking has been confirmed.</p>
                    
                    <div class="booking-card">
                        <h3 style="color: #7c3aed; margin: 0 0 15px 0;">{booking_data.get('service_name', 'Service')}</h3>
                        <p style="margin: 5px 0;"><strong>Date:</strong> {booking_data.get('booking_date', '')}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> {booking_data.get('booking_time', '')}</p>
                        <p style="margin: 5px 0;"><strong>Price:</strong> ${booking_data.get('price', 0):.2f}</p>
                    </div>
                    
                    {f'<p><strong>Notes:</strong> {booking_data.get("notes", "")}</p>' if booking_data.get('notes') else ''}
                    
                    <p style="margin-top: 30px;">The vendor will contact you to confirm the details.</p>
                </div>
                <div class="footer">
                    <p>AfroVending - Authentic African Products & Services</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send(to_email, f"Booking Confirmed - {booking_data.get('service_name', 'Service')}", html_content)
    
    def send_vendor_deactivation(self, to_email: str, vendor_name: str, reason: str) -> bool:
        """Send vendor deactivation notification"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .footer {{ background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }}
                .reason-box {{ background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 10px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Account Deactivated</h1>
                </div>
                <div class="content">
                    <p>Dear {vendor_name},</p>
                    
                    <p>We regret to inform you that your vendor account on AfroVending has been deactivated.</p>
                    
                    <div class="reason-box">
                        <h3 style="color: #dc2626; margin: 0 0 10px 0;">Reason for Deactivation</h3>
                        <p style="margin: 0;">{reason}</p>
                    </div>
                    
                    <h3>What This Means</h3>
                    <ul>
                        <li>Your products and services are no longer visible on the marketplace</li>
                        <li>Customers cannot place new orders with your store</li>
                        <li>Existing orders will still be fulfilled</li>
                    </ul>
                    
                    <h3>How to Appeal</h3>
                    <p>If you believe this was a mistake or you've addressed the issues, you can appeal this decision by contacting us at <a href="mailto:appeals@afrovending.com">appeals@afrovending.com</a>.</p>
                    
                    <p>Please include:</p>
                    <ul>
                        <li>Your store name: {vendor_name}</li>
                        <li>Explanation of corrective actions taken</li>
                        <li>Any supporting documentation</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>AfroVending Vendor Support</p>
                    <p>support@afrovending.com</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send(to_email, f"AfroVending: Your Vendor Account Has Been Deactivated", html_content)
    
    def send_vendor_reactivation(self, to_email: str, vendor_name: str) -> bool:
        """Send vendor reactivation notification"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .footer {{ background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Account Reactivated!</h1>
                </div>
                <div class="content">
                    <p>Dear {vendor_name},</p>
                    
                    <p>Great news! Your vendor account on AfroVending has been reactivated.</p>
                    
                    <div style="background: #f0fdf4; border: 1px solid #22c55e; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                        <h2 style="color: #16a34a; margin: 0;">You're Back in Business!</h2>
                    </div>
                    
                    <h3>What's Next</h3>
                    <ul>
                        <li>Your products and services are now visible again</li>
                        <li>Customers can place orders with your store</li>
                        <li>Review and update your listings if needed</li>
                    </ul>
                    
                    <p style="margin-top: 30px;">Thank you for being part of the AfroVending community!</p>
                </div>
                <div class="footer">
                    <p>AfroVending - Authentic African Products & Services</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send(to_email, f"AfroVending: Your Vendor Account Has Been Reactivated!", html_content)
    
    def send_password_reset(self, to_email: str, reset_token: str, reset_url: str) -> bool:
        """Send password reset email"""
        full_reset_url = f"{reset_url}?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .footer {{ background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }}
                .btn {{ display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Password Reset</h1>
                </div>
                <div class="content">
                    <p>You requested a password reset for your AfroVending account.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{full_reset_url}" class="btn" style="color: white;">Reset Your Password</a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                    
                    <p style="color: #666; font-size: 14px;">If you didn't request this reset, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>AfroVending - Authentic African Products & Services</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send(to_email, "Reset Your AfroVending Password", html_content)
    
    def send_vendor_approval(self, to_email: str, vendor_name: str) -> bool:
        """Send vendor approval notification"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .footer {{ background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Congratulations!</h1>
                    <p style="margin: 10px 0 0 0;">Your vendor application has been approved</p>
                </div>
                <div class="content">
                    <p>Dear {vendor_name},</p>
                    
                    <p>Welcome to AfroVending! Your vendor application has been approved and your store is now live on our marketplace.</p>
                    
                    <h3>Next Steps</h3>
                    <ul>
                        <li>Log in to your vendor dashboard</li>
                        <li>Add your products and services</li>
                        <li>Set up your store profile</li>
                        <li>Start selling to customers worldwide!</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://afrovending.com/vendor" style="display: inline-block; background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Your Dashboard</a>
                    </div>
                </div>
                <div class="footer">
                    <p>AfroVending - Authentic African Products & Services</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send(to_email, "Your AfroVending Vendor Application is Approved!", html_content)

# Singleton instance
email_service = EmailService()
