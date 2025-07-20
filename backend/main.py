import os
import shutil
import uuid
import zipfile
import requests
import boto3
import time
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configs
MONGO_URL = os.getenv("MONGO_DB_URL")
THEME_DIR = os.getenv("THEME_DIR", "./themes")
TEMP_DIR = os.getenv("TEMP_DIR", "./temp")
CLAUDE_API_URL = os.getenv("CLAUDE_API_URL")  # Optional for AI processing

SHOPIFY_UPLOAD_URL = "/admin/api/2024-04/themes.json"

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "shopilot-themes")
R2_DOWNLOAD_DOMAIN = os.getenv("R2_DOWNLOAD_DOMAIN")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

# MongoDB collections
client = MongoClient(MONGO_URL)
db = client[os.getenv("MONGODB_DB", "shoppilot")]
temp_results = db["temp_results"]
users = db["users"]
themes = db["themes"]
orders = db["orders"]

def unzip_theme(source_zip, dest_dir):
    with zipfile.ZipFile(source_zip, 'r') as zip_ref:
        zip_ref.extractall(dest_dir)

def zip_theme(source_dir, zip_path):
    shutil.make_archive(zip_path.replace(".zip", ""), 'zip', source_dir)

def upload_to_r2(local_file_path, dest_file_name):
    endpoint = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    session = boto3.session.Session()
    client = session.client(
        's3',
        region_name='auto',
        endpoint_url=endpoint,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
    )

    try:
        client.upload_file(
            local_file_path,
            R2_BUCKET_NAME,
            dest_file_name,
            ExtraArgs={"ACL": "public-read", "ContentType": "application/zip"}
        )
        return f"{R2_DOWNLOAD_DOMAIN}/{dest_file_name}"
    except Exception as e:
        print("❌ R2 Upload Failed:", e)
        return None

def upload_shopify_theme(session_id, zip_url, access_token, shop_domain):
    shop_url = f"https://{shop_domain}{SHOPIFY_UPLOAD_URL}"
    headers = {
        "X-Shopify-Access-Token": access_token
    }
    files = {
        'theme[role]': (None, 'unpublished'),
        'theme[name]': (None, f"ShopPilot-{session_id[:6]}"),
        'theme[src]': (None, zip_url)
    }

    response = requests.post(shop_url, headers=headers, files=files)

    if response.status_code == 201:
        theme_id = response.json().get("theme", {}).get("id")
        return {
            "success": True,
            "themeId": theme_id,
            "previewUrl": f"https://{shop_domain}/?preview_theme_id={theme_id}"
        }
    else:
        return {
            "success": False,
            "error": "上传 Shopify 主题失败",
            "detail": response.text
        }

def process_theme_for_session(session_id, theme_id, shop, access_token):
    theme_info = themes.find_one({"_id": ObjectId(theme_id)}) if theme_id else None

    if not theme_info or not os.path.exists(theme_info["path"]):
        return {"success": False, "error": f"❌ Theme {theme_id} not found."}

    theme_path = theme_info["path"]

    # Create working directory
    theme_work_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(theme_work_dir, exist_ok=True)
    unzip_theme(theme_path, theme_work_dir)

    # (Optional) Modify liquid files
    # process_liquid_files(theme_work_dir, prompt)

    # Zip and upload to R2
    zip_output_path = os.path.join(TEMP_DIR, f"{session_id}.zip")
    zip_theme(theme_work_dir, zip_output_path)
    zip_url = upload_to_r2(zip_output_path, f"{session_id}.zip")

    if not zip_url:
        return {"success": False, "error": "❌ Upload to R2 failed."}

    # Upload to Shopify
    return upload_shopify_theme(session_id, zip_url, access_token, shop)

def run_theme_processor():
    # print(f"🔄 Checking for new Shopify theme tasks... at {datetime.now()}", flush=True)
    new_tasks = orders.find({"status": "paid"})

    for task in new_tasks:
        session_id = task.get("sessionId")
        theme_id = task.get("themeId")
        user_id = task.get("userId")

        userRecord = users.find_one({"_id": ObjectId(user_id)})
        shop = userRecord.get("shop")
        access_token = userRecord.get("accessToken")
        email = userRecord.get("email")

        print(f"🛠️ Processing theme for: {shop}, session: {session_id}")

        try:
            result = process_theme_for_session(session_id, theme_id, shop, access_token)

            if result.get("success"):
                task.update_one(
                    {"_id": task["_id"]},
                    {"$set": {
                        "status": "done",
                        "previewUrl": result.get("previewUrl"),
                        "shopifythemeId": result.get("themeId"),
                        "updatedAt": datetime.utcnow()
                    }}
                )
                print(f"✅ Theme uploaded for {shop}: {result.get('previewUrl')}")

                if email:
                    send_resend_email(email, result.get('previewUrl'))
            else:
                task.update_one(
                    {"_id": task["_id"]},
                    {"$set": {
                        "status": "failed",
                        "error": result.get("error"),
                        "updatedAt": datetime.utcnow()
                    }}
                )
                print(f"❌ Failed to upload for {shop}: {result.get('error')}")

        except Exception as e:
            task.update_one(
                {"_id": task["_id"]},
                {"$set": {
                    "status": "failed",
                    "error": str(e),
                    "updatedAt": datetime.utcnow()
                }}
            )
            print(f"❌ Exception for {shop}: {e}")

def send_resend_email(to_email, preview_url):

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
            "from": "ShopPilot <noreply@shoppilot.app>",
            "to": [to_email],
            "subject": "✅ Your Shopify Theme Has Been Deployed",
            "html": f"""
                <p>Hi there,</p>

                <p>Your Shopify theme has been successfully uploaded!</p>

                <p>
                    <strong>🔍 Preview your theme:</strong><br>
                    <a href="{preview_url}" target="_blank">{preview_url}</a><br>
                </p>

                <p><strong>📢 How to activate your new theme:</strong></p>
                <ol>
                    <li>Log in to your Shopify Admin.</li>
                    <li>Go to <strong>Online Store &gt; Themes</strong>.</li>
                    <li>Scroll to the <em>Theme Library</em> section and find your new theme.</li>
                    <li>Click the <strong>Actions</strong> button next to the theme and select <strong>Publish</strong>.</li>
                </ol>

                <p><strong>⚠️ Not seeing this email in your inbox?</strong></p>
                <p>
                    If this message went to your spam folder, it's likely because our domain is still warming up or not fully trusted by your email provider yet.
                    Please mark this email as <strong>"Not Spam"</strong> and add <code>noreply@shoppilot.app</code> to your contacts to ensure future delivery.
                </p>

                <br>
                <p>Thanks for using <strong>ShopPilot</strong>! 🚀</p>
            """
        }

    try:
        response = requests.post("https://api.resend.com/emails", headers=headers, json=data)
        if response.status_code == 200:
            print(f"📧 Email sent to {to_email}")
        else:
            print(f"❌ Failed to send email: {response.text}")
    except Exception as e:
        print(f"❌ Email sending exception: {e}")

if __name__ == "__main__":
    time.sleep(5)
    run_theme_processor()
    exit()
