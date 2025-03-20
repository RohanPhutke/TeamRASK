import fitz  # PyMuPDF
import os
output_dir = 'extracted_images'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def extract_images_from_pdf(pdf_path):
    pdf = fitz.open(pdf_path)
    
    for page_num in range(len(pdf)):
        page = pdf.load_page(page_num)
        images = page.get_images(full=True)
        
        for img_index, img in enumerate(images):
            xref = img[0]
            base_image = pdf.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"] 
            image_filename = os.path.join(output_dir, f"page_{page_num + 1}_img_{img_index + 1}.{image_ext}")
            with open(image_filename, "wb") as image_file:
                image_file.write(image_bytes)
            
            print(f"Saved {image_filename}")
    
    pdf.close()

# Path to the PDF file
pdf_path = '42-180-2-PB.pdf'
extract_images_from_pdf(pdf_path)
print("✅ Image extraction complete!")
