import zipfile
import re
import os

docx_path = "legacy-php/Afaf_Final_Report.docx"

if not os.path.exists(docx_path):
    print(f"Error: {docx_path} not found.")
    import sys
    sys.exit(1)

with zipfile.ZipFile(docx_path) as z:
    try:
        doc_xml = z.read("word/document.xml").decode("utf-8")
        # Remove XML tags to get plain text
        text = re.sub(r'<[^>]+>', ' ', doc_xml)
        
        # Search for email addresses
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        # Search for phone numbers (approx 10 digits)
        phones = re.findall(r'\b\d{10}\b|\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b', text)
        
        print("=== DOCX EMAILS ===")
        print(set(emails))
        print("=== DOCX PHONES ===")
        print(set(phones))
    except Exception as e:
        print("Error reading document.xml:", e)
