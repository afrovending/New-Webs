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

    def send_broken_images_notification(self, to_email: str, vendor_name: str, products: list) -> bool:
        """Send notification to vendor about products with broken images"""
        products_html = ""
        for product in products:
            products_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{product.get('product_name', 'Unknown')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #dc2626;">{product.get('issue', 'Image needs re-upload')}</td>
            </tr>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .footer {{ background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }}
                .alert-box {{ background: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 10px; margin: 20px 0; }}
                .btn {{ display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th {{ background: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Action Required: Product Images</h1>
                </div>
                <div class="content">
                    <p>Dear {vendor_name},</p>
                    
                    <div class="alert-box">
                        <h3 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Some of your product images need attention</h3>
                        <p style="margin: 0;">We noticed that {len(products)} of your products have missing or broken images. Products without images are less likely to sell!</p>
                    </div>
                    
                    <h3>Affected Products</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Issue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products_html}
                        </tbody>
                    </table>
                    
                    <h3>How to Fix</h3>
                    <ol>
                        <li>Log in to your AfroVending vendor dashboard</li>
                        <li>Go to "My Products"</li>
                        <li>Click on each affected product</li>
                        <li>Upload new images for your products</li>
                        <li>Save your changes</li>
                    </ol>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://afrovending.com/vendor/products" class="btn" style="color: white;">Go to My Products</a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        <strong>Why did this happen?</strong> We recently upgraded our image storage system. Images uploaded before this upgrade need to be re-uploaded to ensure they display correctly.
                    </p>
                </div>
                <div class="footer">
                    <p>Need help? Contact us at support@afrovending.com</p>
                    <p>AfroVending - Authentic African Products & Services</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send(to_email, f"Action Required: {len(products)} Product Images Need Attention", html_content)

    def send_purchase_complete(self, to_email: str, order_data: dict, frontend_url: str = "https://afrovending.com") -> bool:
        """Send purchase complete email after successful Stripe payment"""
        items_html = ""
        for item in order_data.get("items", []):
            image_url = item.get('image') or item.get('product_image', '')
            image_html = f'<img src="{image_url}" alt="" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">' if image_url else '<div style="width: 60px; height: 60px; background: #f3f4f6; border-radius: 8px;"></div>'
            items_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; width: 70px;">
                    {image_html}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <strong>{item.get('name', item.get('product_name', 'Product'))}</strong>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${float(item.get('price', 0)):.2f}</td>
            </tr>
            """
        
        order_id = order_data.get('id', '')
        order_short_id = order_id[:8] if order_id else 'N/A'
        tracking_url = f"{frontend_url}/track/{order_id}"
        orders_url = f"{frontend_url}/orders"
        
        # Calculate estimated delivery (7-14 business days)
        from datetime import datetime, timedelta
        estimated_delivery_start = (datetime.now() + timedelta(days=7)).strftime('%B %d')
        estimated_delivery_end = (datetime.now() + timedelta(days=14)).strftime('%B %d, %Y')
        estimated_delivery = f"{estimated_delivery_start} - {estimated_delivery_end}"
        
        subtotal = order_data.get('subtotal', order_data.get('total', 0))
        shipping_cost = order_data.get('shipping_cost', 0)
        total = order_data.get('total', subtotal + shipping_cost)
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }}
                .header h1 {{ margin: 0; font-size: 28px; }}
                .header .checkmark {{ font-size: 48px; margin-bottom: 15px; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; }}
                .footer {{ background: #1f2937; color: #9ca3af; padding: 25px; text-align: center; font-size: 12px; border-radius: 0 0 12px 12px; }}
                .footer a {{ color: #dc2626; text-decoration: none; }}
                .order-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                .order-table th {{ background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; }}
                .summary-box {{ background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 12px; margin: 25px 0; }}
                .delivery-box {{ background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 12px; margin: 25px 0; }}
                .address-box {{ background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0; }}
                .btn {{ display: inline-block; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }}
                .btn-primary {{ background: #dc2626; color: white; }}
                .btn-secondary {{ background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }}
                .total-row {{ font-size: 20px; color: #16a34a; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="checkmark">✓</div>
                    <h1>Payment Successful!</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #{order_short_id}</p>
                </div>
                <div class="content">
                    <p style="font-size: 16px;">Thank you for your purchase! Your payment has been processed successfully and your order is being prepared.</p>
                    
                    <div class="summary-box">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="color: #16a34a; margin: 0 0 5px 0;">Order Confirmed</h3>
                                <p style="margin: 0; color: #166534;">We'll email you when your order ships</p>
                            </div>
                            <div style="text-align: right;">
                                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #16a34a;">${float(total):.2f}</p>
                            </div>
                        </div>
                    </div>
                    
                    <h3 style="margin-bottom: 10px;">Order Items</h3>
                    <table class="order-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Product</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                    
                    <div style="text-align: right; border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 10px;">
                        <p style="margin: 5px 0; color: #6b7280;">Subtotal: <span style="color: #111827; font-weight: 500;">${float(subtotal):.2f}</span></p>
                        <p style="margin: 5px 0; color: #6b7280;">Shipping: <span style="color: #111827; font-weight: 500;">${float(shipping_cost):.2f}</span></p>
                        <p class="total-row" style="margin: 10px 0 0 0;">Total: ${float(total):.2f}</p>
                    </div>
                    
                    <div class="delivery-box">
                        <h3 style="color: #1d4ed8; margin: 0 0 10px 0;">📦 Estimated Delivery</h3>
                        <p style="font-size: 18px; font-weight: 600; margin: 0;">{estimated_delivery}</p>
                        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">You'll receive tracking information once your order ships.</p>
                    </div>
                    
                    <div class="address-box">
                        <h4 style="margin: 0 0 10px 0; color: #374151;">Shipping To</h4>
                        <p style="margin: 0; font-weight: 500;">{order_data.get('shipping_name', '')}</p>
                        <p style="margin: 5px 0 0 0; color: #6b7280;">
                            {order_data.get('shipping_address', '')}<br>
                            {order_data.get('shipping_city', '')}, {order_data.get('shipping_state', '')} {order_data.get('shipping_zip', '')}<br>
                            {order_data.get('shipping_country', '')}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{tracking_url}" class="btn btn-primary" style="color: white; margin-right: 10px;">Track Your Order</a>
                        <a href="{orders_url}" class="btn btn-secondary">View Order History</a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; text-align: center;">
                        Questions about your order? Contact us at <a href="mailto:support@afrovending.com" style="color: #dc2626;">support@afrovending.com</a>
                    </p>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 10px 0;"><strong style="color: white;">AfroVending</strong></p>
                    <p style="margin: 0;">Authentic African Products & Services</p>
                    <p style="margin: 15px 0 0 0;">
                        <a href="{frontend_url}/legal/privacy">Privacy Policy</a> · 
                        <a href="{frontend_url}/legal/terms">Terms of Service</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send(to_email, f"✓ Payment Complete - Order #{order_short_id}", html_content)

    def send_vendor_new_order(self, to_email: str, vendor_name: str, order_data: dict, vendor_items: list, frontend_url: str = "https://afrovending.com") -> bool:
        """Send notification to vendor about a new order for their products"""
        items_html = ""
        vendor_total = 0
        
        for item in vendor_items:
            item_total = float(item.get('price', 0)) * int(item.get('quantity', 1))
            vendor_total += item_total
            image_url = item.get('image') or item.get('product_image', '')
            image_html = f'<img src="{image_url}" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">' if image_url else '<div style="width: 50px; height: 50px; background: #f3f4f6; border-radius: 6px;"></div>'
            items_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; width: 60px;">
                    {image_html}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <strong>{item.get('name', item.get('product_name', 'Product'))}</strong>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${float(item.get('price', 0)):.2f}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${item_total:.2f}</td>
            </tr>
            """
        
        order_id = order_data.get('id', '')
        order_short_id = order_id[:8] if order_id else 'N/A'
        vendor_orders_url = f"{frontend_url}/vendor/orders"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 35px 30px; text-align: center; border-radius: 12px 12px 0 0; }}
                .header h1 {{ margin: 0; font-size: 26px; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; }}
                .footer {{ background: #1f2937; color: #9ca3af; padding: 25px; text-align: center; font-size: 12px; border-radius: 0 0 12px 12px; }}
                .footer a {{ color: #dc2626; text-decoration: none; }}
                .order-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                .order-table th {{ background: #fef2f2; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #991b1b; }}
                .alert-box {{ background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 12px; margin: 20px 0; }}
                .earnings-box {{ background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }}
                .customer-box {{ background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0; }}
                .btn {{ display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }}
                .urgent-badge {{ display: inline-block; background: #dc2626; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-left: 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛒 New Order Received!</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #{order_short_id}</p>
                </div>
                <div class="content">
                    <p>Hi {vendor_name},</p>
                    
                    <div class="alert-box">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <h3 style="color: #dc2626; margin: 0;">Action Required</h3>
                                <p style="margin: 5px 0 0 0; color: #7f1d1d;">Please process this order as soon as possible</p>
                            </div>
                            <span class="urgent-badge">New</span>
                        </div>
                    </div>
                    
                    <h3 style="margin-bottom: 10px;">Your Items in This Order</h3>
                    <table class="order-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Product</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Unit Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                    
                    <div class="earnings-box">
                        <p style="margin: 0; color: #166534; font-size: 14px;">Your Earnings from This Order</p>
                        <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: bold; color: #16a34a;">${vendor_total:.2f}</p>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">*Platform fees may apply</p>
                    </div>
                    
                    <div class="customer-box">
                        <h4 style="margin: 0 0 12px 0; color: #374151;">📍 Ship To</h4>
                        <p style="margin: 0; font-weight: 600; font-size: 16px;">{order_data.get('shipping_name', 'Customer')}</p>
                        <p style="margin: 8px 0 0 0; color: #6b7280;">
                            {order_data.get('shipping_address', '')}<br>
                            {f"{order_data.get('shipping_address2')}<br>" if order_data.get('shipping_address2') else ''}
                            {order_data.get('shipping_city', '')}, {order_data.get('shipping_state', '')} {order_data.get('shipping_zip', '')}<br>
                            <strong>{order_data.get('shipping_country', '')}</strong>
                        </p>
                        {f"<p style='margin: 10px 0 0 0;'><strong>Phone:</strong> {order_data.get('shipping_phone')}</p>" if order_data.get('shipping_phone') else ''}
                    </div>
                    
                    <h4 style="margin: 25px 0 15px 0;">Next Steps:</h4>
                    <ol style="color: #4b5563; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">Review the order in your vendor dashboard</li>
                        <li style="margin-bottom: 8px;">Prepare the item(s) for shipping</li>
                        <li style="margin-bottom: 8px;">Mark as shipped and add tracking number</li>
                        <li style="margin-bottom: 8px;">Customer will be notified automatically</li>
                    </ol>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{vendor_orders_url}" class="btn" style="color: white;">View Order Details</a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        Respond quickly to maintain your seller rating! Orders should be shipped within 2-3 business days.
                    </p>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 10px 0;"><strong style="color: white;">AfroVending Vendor Portal</strong></p>
                    <p style="margin: 0;">Need help? Contact <a href="mailto:vendors@afrovending.com">vendors@afrovending.com</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send(to_email, f"🛒 New Order #{order_short_id} - Action Required", html_content)

# Singleton instance
email_service = EmailService()
