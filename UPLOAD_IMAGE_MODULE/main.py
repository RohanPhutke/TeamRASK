import google.auth.transport.requests
import openai
from upload import upload_images

# Provide book name and image folder dynamically
# <-----------PROVIDE A UNIQUE BOOKNAME HERE, FOR EVERY DIFFERENT BOOK------------------>
book_name = "book1"
# Books corresponding images
image_folder = "C:/Users/Hp/Desktop/GSC/UPLOAD_IMAGE_MODULE/images"

# Get image URLs from upload.py
image_urls = upload_images(book_name, image_folder)

if not image_urls:
    print("❌ No images found to process!")
    exit()

project_id = "sincere-song-448114-h6" 
location = "us-central1"

# Get an access token
credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
credentials.refresh(google.auth.transport.requests.Request())

# OpenAI Client
client = openai.OpenAI(
    base_url=f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/endpoints/openapi",
    api_key=credentials.token,
)

# Loop through images and send each to the model
for image_url in image_urls:
    print(f"🔄 Sending {image_url} to Gemini for processing...")

    response = client.chat.completions.create(
        model="google/gemini-2.0-flash-001",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Describe the following image:"},
                    {"type": "image_url", "image_url": image_url},  
                ],
            }
        ],
    )

    print(f"✅ Gemini Response for {image_url}: {response}")
