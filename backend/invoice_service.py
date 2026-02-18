"""
AfroVending PDF Invoice Generator
Creates professional invoices/receipts for orders
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import datetime
import os

# AfroVending brand colors
BRAND_RED = colors.HexColor('#DC2626')
BRAND_DARK = colors.HexColor('#1F2937')
BRAND_GRAY = colors.HexColor('#6B7280')

class InvoiceGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_styles()
    
    def _setup_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='InvoiceTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=BRAND_RED,
            alignment=TA_CENTER,
            spaceAfter=20
        ))
        self.styles.add(ParagraphStyle(
            name='InvoiceSubtitle',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=BRAND_GRAY,
            alignment=TA_CENTER,
            spaceAfter=30
        ))
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=12,
            textColor=BRAND_DARK,
            spaceBefore=15,
            spaceAfter=10
        ))
        self.styles.add(ParagraphStyle(
            name='InfoText',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=BRAND_DARK
        ))
        self.styles.add(ParagraphStyle(
            name='FooterText',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=BRAND_GRAY,
            alignment=TA_CENTER
        ))
    
    def generate_invoice(self, order_data: dict, include_tax: bool = True) -> BytesIO:
        """Generate a PDF invoice for an order"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        elements = []
        
        # Header with logo placeholder
        elements.append(Paragraph("🛒 AfroVending", self.styles['InvoiceTitle']))
        elements.append(Paragraph(
            "Authentic African Products & Services | www.afrovending.com",
            self.styles['InvoiceSubtitle']
        ))
        
        # Invoice Info
        invoice_date = datetime.now().strftime("%B %d, %Y")
        order_date = order_data.get('created_at', '')
        if order_date:
            try:
                order_date = datetime.fromisoformat(order_date.replace('Z', '+00:00')).strftime("%B %d, %Y")
            except:
                order_date = invoice_date
        
        order_id = order_data.get('id', 'N/A')[:8].upper()
        
        # Two column layout for invoice details
        invoice_info = [
            ['INVOICE', ''],
            ['Invoice Number:', f'INV-{order_id}'],
            ['Invoice Date:', invoice_date],
            ['Order Date:', order_date],
            ['Order ID:', order_data.get('id', 'N/A')[:16]],
            ['Status:', order_data.get('status', 'N/A').upper()],
        ]
        
        info_table = Table(invoice_info, colWidths=[1.5*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 14),
            ('TEXTCOLOR', (0, 0), (1, 0), BRAND_RED),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 1), (0, -1), BRAND_GRAY),
            ('TEXTCOLOR', (1, 1), (1, -1), BRAND_DARK),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))
        
        # Shipping Address Section
        elements.append(Paragraph("SHIP TO", self.styles['SectionHeader']))
        shipping_address = f"""
        {order_data.get('shipping_address', 'N/A')}<br/>
        {order_data.get('shipping_city', '')}, {order_data.get('shipping_country', '')}<br/>
        """
        elements.append(Paragraph(shipping_address, self.styles['InfoText']))
        elements.append(Spacer(1, 20))
        
        # Order Items Table
        elements.append(Paragraph("ORDER ITEMS", self.styles['SectionHeader']))
        
        # Table header
        items_data = [['Product', 'Vendor', 'Qty', 'Unit Price', 'Total']]
        
        subtotal = 0
        for item in order_data.get('items', []):
            product_name = item.get('product_name', 'Product')
            vendor_name = item.get('vendor_name', 'AfroVending Store')
            quantity = item.get('quantity', 1)
            price = item.get('price', 0)
            item_total = price * quantity
            subtotal += item_total
            
            items_data.append([
                product_name[:30] + ('...' if len(product_name) > 30 else ''),
                vendor_name[:20] + ('...' if len(vendor_name) > 20 else ''),
                str(quantity),
                f'${price:.2f}',
                f'${item_total:.2f}'
            ])
        
        items_table = Table(items_data, colWidths=[2.5*inch, 1.5*inch, 0.5*inch, 1*inch, 1*inch])
        items_table.setStyle(TableStyle([
            # Header style
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_RED),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            # Body style
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('TEXTCOLOR', (0, 1), (-1, -1), BRAND_DARK),
            # Alignment
            ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, BRAND_GRAY),
            ('LINEBELOW', (0, 0), (-1, 0), 2, BRAND_RED),
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 20))
        
        # Totals Section
        tax_rate = 0.0  # Can be made dynamic based on location
        tax_amount = subtotal * tax_rate
        shipping = 0.0  # Free shipping
        total = order_data.get('total', subtotal + tax_amount + shipping)
        
        totals_data = [
            ['', 'Subtotal:', f'${subtotal:.2f}'],
            ['', 'Shipping:', 'FREE' if shipping == 0 else f'${shipping:.2f}'],
        ]
        
        if include_tax and tax_rate > 0:
            totals_data.append(['', f'Tax ({tax_rate*100:.0f}%):', f'${tax_amount:.2f}'])
        
        totals_data.append(['', 'TOTAL:', f'${total:.2f}'])
        
        totals_table = Table(totals_data, colWidths=[4*inch, 1.5*inch, 1*inch])
        totals_table.setStyle(TableStyle([
            ('FONTNAME', (1, 0), (1, -2), 'Helvetica'),
            ('FONTNAME', (1, -1), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (1, 0), (-1, -1), 10),
            ('FONTSIZE', (1, -1), (-1, -1), 12),
            ('TEXTCOLOR', (1, 0), (1, -2), BRAND_GRAY),
            ('TEXTCOLOR', (2, 0), (2, -2), BRAND_DARK),
            ('TEXTCOLOR', (1, -1), (-1, -1), BRAND_RED),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('LINEABOVE', (1, -1), (-1, -1), 1, BRAND_RED),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 30))
        
        # Payment Status
        payment_status = order_data.get('payment_status', 'pending').upper()
        payment_color = colors.green if payment_status == 'PAID' else BRAND_RED
        
        payment_data = [['Payment Status:', payment_status]]
        payment_table = Table(payment_data, colWidths=[1.5*inch, 1.5*inch])
        payment_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, 0), BRAND_GRAY),
            ('TEXTCOLOR', (1, 0), (1, 0), payment_color),
            ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#F0FDF4') if payment_status == 'PAID' else colors.HexColor('#FEF2F2')),
            ('ALIGN', (1, 0), (1, 0), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(payment_table)
        elements.append(Spacer(1, 40))
        
        # Fulfillment Info
        fulfillment_type = order_data.get('fulfillment_type', 'FBV')
        if fulfillment_type == 'FBA':
            elements.append(Paragraph(
                "This order is Fulfilled by AfroVending (FBA). Items are shipped from our US warehouse for faster delivery.",
                self.styles['InfoText']
            ))
        else:
            elements.append(Paragraph(
                "This order is Fulfilled by Vendor (FBV). Items ship directly from the vendor.",
                self.styles['InfoText']
            ))
        elements.append(Spacer(1, 20))
        
        # Footer
        elements.append(Paragraph(
            "Thank you for shopping with AfroVending!",
            self.styles['SectionHeader']
        ))
        elements.append(Paragraph(
            "Questions? Contact support@afrovending.com | Returns within 30 days",
            self.styles['FooterText']
        ))
        elements.append(Paragraph(
            "AfroVending - Connecting the World to African Excellence",
            self.styles['FooterText']
        ))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    def generate_receipt(self, order_data: dict) -> BytesIO:
        """Generate a simpler receipt PDF"""
        return self.generate_invoice(order_data, include_tax=False)

# Singleton instance
invoice_generator = InvoiceGenerator()
