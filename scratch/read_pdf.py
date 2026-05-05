from pypdf import PdfReader
import re

pdf_path = "legacy-php/afaf_resume.pdf"
reader = PdfReader(pdf_path)

full_text = ""
for page in reader.pages:
    full_text += page.extract_text() + "\n"

# Search for email addresses
emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', full_text)
# Search for phone numbers
phones = re.findall(r'\b\d{10}\b|\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b|\+91\s??\d{10}', full_text)

print("=== PDF EMAILS ===")
print(set(emails))
print("=== PDF PHONES ===")
print(set(phones))
print("=== FULL TEXT PREVIEW ===")
print(full_text[:1000])
