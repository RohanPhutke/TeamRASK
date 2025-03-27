from google.cloud import storage
import uuid
from datetime import datetime


# Google Cloud Storage setup
storage_client = storage.Client()
BUCKET_NAME = "test-bucket-rohan-2025"

# Check if a file already exists in the bucket
def file_exists(bucket_name, file_path):
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_path)
    return blob.exists()



def upload_image_to_gcs(file, book_name):
    try:
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'png'
        unique_filename = f"screenshot_{timestamp}_{unique_id}.{file_extension}"
        
        folder_name = book_name.replace(" ", "-").lower()
        gcs_path = f"{folder_name}/{unique_filename}"

        print(f"🔄 Uploading {gcs_path} to GCS...")

        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(gcs_path)
        blob.upload_from_file(file.file)
        blob.make_public()

        return blob.public_url

    except Exception as e:
        print(f"❌ Error uploading image: {e}")
        return None
