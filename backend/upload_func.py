import json
import hashlib
from astrapy.constants import VectorMetric
from astrapy.info import CollectionVectorServiceOptions
from connect_to_database import database
from PyPDF2 import PdfReader
from fastapi import HTTPException

def generate_collection_name(file_path):
    """Generates a SHA-256 hash of the PDF content to use as a unique collection name."""
    hasher = hashlib.sha256()
    
    with open(file_path, "rb") as f:
        while chunk := f.read(4096):  # Read in chunks to handle large files efficiently
            hasher.update(chunk)

    return hasher.hexdigest()[:16]

def get_or_create_collection(collection_name: str):
    """
    Checks if a collection exists; if not, creates it with vector search enabled.
    """
    try:
        
        collections = database.list_collection_names()
        if collection_name in collections:
            print(f"✅ Collection '{collection_name}' already exists.")
            return database.get_collection(collection_name)

        print(f"⚙️ Creating new collection: {collection_name}...")
        collection = database.create_collection(
            collection_name,
            metric=VectorMetric.COSINE,
            service=CollectionVectorServiceOptions(
                provider="nvidia",
                model_name="NV-Embed-QA",
            ),
        )
        print(f"✅ Collection '{collection.full_name}' created successfully.")
        return collection

    except Exception as e:
        print(f"❌ Error creating collection: {e}")

def upload_json_data(collection, data_file_path: str):
    """
    Uploads JSON data to AstraDB collection with vector embeddings.
    """
    try:
        with open(data_file_path, "r", encoding="utf8") as file:
            json_data = json.load(file)

        documents = [
            {**data, "$vectorize": f"text: {data['text']}"}  
            for data in json_data
        ]

        inserted = collection.insert_many(documents)
        print(f"✅ Inserted {len(inserted.inserted_ids)} items successfully.")

    except Exception as e:
        print(f"❌ Error inserting data: {e}")

def extract_text_from_pdf(file_path):
    """
    Extracts text from a PDF and splits it into paragraphs with a max length of 700 characters.
    """
    extracted_paragraphs = []

    try:
        with open(file_path, "rb") as pdf_file:
            reader = PdfReader(pdf_file)

            for i, page in enumerate(reader.pages, 1):
                text = page.extract_text() or ""  # Extract text, avoid None values

                # Splitting into paragraphs when text length exceeds 700 chars
                words = text.split()
                current_paragraph = []
                current_length = 0
                paragraph_count = 1

                for word in words:
                    current_paragraph.append(word)
                    current_length += len(word) + 1  # +1 for spaces

                    if current_length >= 700:
                        extracted_paragraphs.append({
                            "page": i,
                            "paragraph": paragraph_count,
                            "text": " ".join(current_paragraph)
                        })
                        paragraph_count += 1
                        current_paragraph = []
                        current_length = 0

                # Add the last paragraph if it exists
                if current_paragraph:
                    extracted_paragraphs.append({
                        "page": i,
                        "paragraph": paragraph_count,
                        "text": " ".join(current_paragraph)
                    })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading PDF: {e}")

    return extracted_paragraphs