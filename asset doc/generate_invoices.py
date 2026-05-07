import os
import random
from datetime import datetime, timedelta
import requests
from faker import Faker
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from PIL import Image
import io

fake = Faker('en_GB')

def draw_invoice(c, invoice_number, service_no, serial_no, order_no, customer_details, date_issued):
    width, height = letter
    
    # Fonts
    c.setFont("Helvetica", 10)
    
    # 1. Logo
    try:
        # Verify it's a valid image before drawing
        if os.path.exists("rolex_logo_valid.png"):
            c.drawImage("rolex_logo_valid.png", 40, height - 120, width=150, preserveAspectRatio=True, mask='auto')
        else:
            # Fallback text if logo fails
            c.setFont("Helvetica-Bold", 30)
            c.setFillColor(colors.HexColor("#006039"))
            c.drawString(40, height - 100, "♛")
    except Exception as e:
        print("Logo draw failed", e)
        pass
    
    # Top Left Rolex details
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#006039")) # Rolex green
    c.drawString(40, height - 110, "ROLEX")
    
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, height - 130, "Rolex Watch Company")
    c.setFont("Helvetica", 9)
    y = height - 145
    c.drawString(40, y, "Prieur (Fr)")
    c.drawString(40, y-12, "1, Rue d'Orléans")
    c.drawString(40, y-24, "44000 Nantes, France")
    c.drawString(40, y-36, "Phone: +33 240 49 68 95")

    # Top Right Invoice Header
    c.setFont("Helvetica", 24)
    c.setFillColor(colors.HexColor("#333333"))
    c.drawRightString(width - 40, height - 60, "INVOICE")
    
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawRightString(width - 40, height - 80, f"# {invoice_number}")

    # Right side table blocks
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#888888"))
    
    r_x1 = width - 180
    r_x2 = width - 40
    y_r = height - 120
    
    c.drawRightString(r_x1, y_r, "Date:")
    c.setFillColor(colors.black)
    c.drawRightString(r_x2, y_r, date_issued.strftime("%b %d, %Y"))
    
    c.setFillColor(colors.HexColor("#888888"))
    c.drawRightString(r_x1, y_r - 20, "Payment Terms:")
    c.setFillColor(colors.black)
    c.drawRightString(r_x2, y_r - 20, "60 days")
    
    c.setFillColor(colors.HexColor("#888888"))
    c.drawRightString(r_x1, y_r - 40, "Due Date:")
    c.setFillColor(colors.black)
    c.drawRightString(r_x2, y_r - 40, (date_issued + timedelta(days=60)).strftime("%b %d, %Y"))
    
    # Gray box
    c.setFillColor(colors.HexColor("#F0F0F0"))
    c.rect(r_x1 - 60, y_r - 70, 200, 24, fill=1, stroke=0)
    
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(r_x1, y_r - 63, "Balance Due:")
    
    # Calculate prices
    subtotal = float(customer_details['price'])
    tax = subtotal * 0.035
    shipping = 15.00
    total = subtotal + tax + shipping
    
    # Format currency helpers
    def fmt_cur(val):
        # Format like 2.085,00
        s = f"{val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        return f"{s} USD"

    c.drawRightString(r_x2, y_r - 63, fmt_cur(total))

    # Bill To
    y_b = height - 200
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#888888"))
    c.drawString(40, y_b, "Bill To:")
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(40, y_b - 15, customer_details['name'])
    c.setFont("Helvetica", 9)
    c.drawString(40, y_b - 27, customer_details['address'])
    c.drawString(40, y_b - 39, customer_details['city_zip'])
    c.drawString(40, y_b - 51, customer_details['phone'])

    # Table Header
    y_t = height - 320
    c.setFillColor(colors.HexColor("#333333"))
    c.rect(40, y_t, width - 80, 20, fill=1, stroke=0)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(50, y_t + 6, "Item")
    c.drawString(380, y_t + 6, "Quantity")
    c.drawRightString(480, y_t + 6, "Rate")
    c.drawRightString(width - 50, y_t + 6, "Amount")

    # Table Row
    y_row = y_t - 20
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("Helvetica-Bold", 9)
    c.drawString(50, y_row, customer_details['watch_model'])
    c.setFont("Helvetica", 9)
    c.drawString(380, y_row, "1")
    c.drawRightString(480, y_row, fmt_cur(subtotal))
    c.drawRightString(width - 50, y_row, fmt_cur(subtotal))
    
    # Subtotals
    y_sub = y_row - 60
    c.setFillColor(colors.HexColor("#666666"))
    c.drawRightString(r_x1, y_sub, "Subtotal:")
    c.setFillColor(colors.black)
    c.drawRightString(r_x2, y_sub, fmt_cur(subtotal))
    
    c.setFillColor(colors.HexColor("#666666"))
    c.drawRightString(r_x1, y_sub - 20, "Tax (3.5%):")
    c.setFillColor(colors.black)
    c.drawRightString(r_x2, y_sub - 20, fmt_cur(tax))
    
    c.setFillColor(colors.HexColor("#666666"))
    c.drawRightString(r_x1, y_sub - 40, "Shipping:")
    c.setFillColor(colors.black)
    c.drawRightString(r_x2, y_sub - 40, fmt_cur(shipping))
    
    c.setFillColor(colors.HexColor("#666666"))
    c.drawRightString(r_x1, y_sub - 60, "Total:")
    c.setFillColor(colors.black)
    c.drawRightString(r_x2, y_sub - 60, fmt_cur(total))

    # Bottom Details (Italics)
    y_d = 200
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.black)
    
    # To mimic the exact spacing and format
    def draw_detail(c, y, label, value):
        c.setFont("Helvetica-BoldOblique", 9)
        c.drawString(40, y, label)
        c.setFont("Helvetica-Oblique", 9)
        # Using fixed widths for labels to align the value cleanly
        c.drawString(100, y, value)

    draw_detail(c, y_d, "Service No.", str(service_no))
    draw_detail(c, y_d - 15, "Serial No.", str(serial_no))
    draw_detail(c, y_d - 30, "Your Order", str(order_no))
    draw_detail(c, y_d - 45, "Watch:", customer_details['watch_model'].upper())
    draw_detail(c, y_d - 60, "Dial:", customer_details['dial'])
    draw_detail(c, y_d - 75, "Bezel:", customer_details['bezel'])
    draw_detail(c, y_d - 90, "Bracelet:", customer_details['bracelet'])

    c.save()

def main():
    # Attempt to download the Rolex Crown Logo safely
    try:
        if not os.path.exists('rolex_logo_valid.png'):
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'}
            # High-res Wikipedia Commons transparent PNG
            url = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rolex_logo.svg/512px-Rolex_logo.svg.png"
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code == 200:
                # Strictly validate that it is a working image before saving
                img = Image.open(io.BytesIO(r.content))
                img.verify() # Verify integrity
                with open("rolex_logo_valid.png", "wb") as f:
                    f.write(r.content)
                print("Successfully downloaded and verified Rolex logo.")
    except Exception as e:
        print("Failed to download or verify logo (using fallback text)", e)

    watch_catalog = [
        {"model": "Rolex Oyster Submariner Date 41mm", "price": 10250.00, "dial": "DIA 126610 BLACK Luminous", "bezel": "BZL 126610 CERACHROM BLK", "bracelet": "OYSTER 97JB00 20"},
        {"model": "Rolex Cosmograph Daytona 40mm", "price": 15100.00, "dial": "DIA 116500 WHITE PANDA", "bezel": "BZL 116500 CERACHROM BLK", "bracelet": "OYSTER 78590 20"},
        {"model": "Rolex GMT-Master II 'Pepsi' 40mm", "price": 10700.00, "dial": "DIA 126710 BLACK Luminous", "bezel": "BZL 126710 CERACHROM BLRO", "bracelet": "JUBILEE 69200 20"},
        {"model": "Rolex Datejust 36mm Fluted", "price": 8950.00, "dial": "DIA 126234 BLUE ROMAN", "bezel": "BZL 126234 FLUTED WG", "bracelet": "JUBILEE 62800 20"},
        {"model": "Rolex Day-Date 40mm President", "price": 38500.00, "dial": "DIA 228238 CHAMPAGNE Luminous", "bezel": "BZL 228238 FLUTED YG", "bracelet": "PRESIDENT 83418 20"},
        {"model": "Rolex Explorer 36mm", "price": 7250.00, "dial": "DIA 124270 BLACK 3-6-9", "bezel": "BZL 124270 SMOOTH SS", "bracelet": "OYSTER 78B00 19"},
        {"model": "Rolex Sea-Dweller Deepsea 44mm", "price": 14150.00, "dial": "DIA 136660 D-BLUE Luminous", "bezel": "BZL 136660 CERACHROM BLK", "bracelet": "OYSTER 98220 22"},
        {"model": "Rolex Sky-Dweller 42mm", "price": 15650.00, "dial": "DIA 326934 BLUE Luminous", "bezel": "BZL 326934 RING COMMAND WG", "bracelet": "OYSTER 72220 22"},
        # New 5 models added
        {"model": "Rolex Yacht-Master 42", "price": 14050.00, "dial": "DIA 226659 BLACK Luminous", "bezel": "BZL 226659 CERACHROM MATTE", "bracelet": "OYSTERFLEX 350501"},
        {"model": "Rolex Milgauss 40mm Z-Blue", "price": 9300.00, "dial": "DIA 116400GV Z-BLUE", "bezel": "BZL 116400 SMOOTH SS", "bracelet": "OYSTER 72400 20"},
        {"model": "Rolex Air-King 40mm", "price": 7450.00, "dial": "DIA 126900 BLACK BLOODHOUND", "bezel": "BZL 126900 SMOOTH SS", "bracelet": "OYSTER 78590 20"},
        {"model": "Rolex Oyster Perpetual 36", "price": 6100.00, "dial": "DIA 126000 TIFFANY BLUE", "bezel": "BZL 126000 SMOOTH SS", "bracelet": "OYSTER 70200 20"},
        {"model": "Rolex GMT-Master II 'Batman' 40mm", "price": 10700.00, "dial": "DIA 126710BLNR BLACK", "bezel": "BZL 126710 CERACHROM BLNR", "bracelet": "OYSTER 79200 20"}
    ]

    # Generate 5 new invoices
    for i in range(11, 16):
        invoice_number = random.randint(40000, 49999)
        service_no = f"290{random.randint(100000, 999999)}"
        
        letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        serial_no = f"{random.choice(letters)}{random.choice(letters)}{random.randint(100000, 999999)}"
        order_no = f"A{random.randint(10000, 99999)}"
        
        watch_choice = random.choice(watch_catalog)
        
        customer = {
            'name': fake.name() + " (UK)",
            'address': fake.street_address(),
            'city_zip': f"{fake.postcode()} {fake.city()}, United Kingdom",
            'phone': f"Phone: {fake.phone_number()}",
            'watch_model': watch_choice['model'],
            'price': watch_choice['price'],
            'dial': watch_choice['dial'],
            'bezel': watch_choice['bezel'],
            'bracelet': watch_choice['bracelet']
        }
        
        date_issued = fake.date_between(start_date='-2y', end_date='today')
        
        filename = f"Rolex_Invoice_Generated_{i}_{serial_no}.pdf"
        draw_invoice(canvas.Canvas(filename, pagesize=letter), invoice_number, service_no, serial_no, order_no, customer, date_issued)
        print(f"Generated {filename}")

if __name__ == '__main__':
    main()
