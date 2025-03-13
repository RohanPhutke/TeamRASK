import os
import glob
from google.cloud import storage
from dotenv import load_dotenv

# Load .env file
load_dotenv()

SERVICE_ACCOUNT_JSON = "sincere-song-448114-h6-f3e0278e3b00.json"

if os.path.exists(SERVICE_ACCOUNT_JSON):
    print("✅ Service account JSON found!")
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = SERVICE_ACCOUNT_JSON
else:
    print("❌ Service account JSON not found! Check the file path.")
    exit()

storage_client = storage.Client()

#
BUCKET_NAME = "test-bucket-rohan-2025"

def file_exists(bucket_name, file_path):
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_path)
    return blob.exists()

def upload_image_to_gcs(image_path, book_name):
    try:
        file_name = os.path.basename(image_path)
        folder_name = book_name.replace(" ", "-").lower()  
        gcs_path = f"{folder_name}/{file_name}"  

        if file_exists(BUCKET_NAME, gcs_path):
            print(f"✅ {gcs_path} already exists in GCS. Skipping upload.")
            return f"https://storage.googleapis.com/{BUCKET_NAME}/{gcs_path}"

        print(f"🔄 Uploading {gcs_path} to GCS...")

        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(gcs_path)
        blob.upload_from_filename(image_path)
        blob.make_public()

        return blob.public_url

    except Exception as e:
        print(f"❌ Error uploading {image_path}: {e}")
        return None

def upload_images(book_name, image_folder):
    image_files = glob.glob(os.path.join(image_folder, "*"))

    if not image_files:
        print(f"❌ No images found in '{image_folder}'!")
        return []

    print(f"✅ Found {len(image_files)} images to upload for book '{book_name}'.")

    image_urls = [upload_image_to_gcs(img, book_name) for img in image_files if img]
    return [url for url in image_urls if url]  # Filter out failed uploads

