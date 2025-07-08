# backend/api/process_theme.py
import os
import shutil
import uuid
import zipfile
import requests
from pymongo import MongoClient
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from bson import ObjectId  

# Load env vars
load_dotenv()
MONGO_URL = os.getenv("MONGO_DB_URL")
THEME_DIR = os.getenv("THEME_DIR", "./themes")  # themes source directory
TEMP_DIR = os.getenv("TEMP_DIR", "./temp")       # working temp directory
CLAUDE_API_URL = os.getenv("CLAUDE_API_URL")      # your Claude processing API endpoint

SHOPIFY_UPLOAD_URL = "/admin/api/2024-04/themes.json"

client = MongoClient(MONGO_URL)
db = client[os.getenv("MONGODB_DB", "shoppilot")]
temp_results = db["temp_results"]
tokens = db["tokens"]
themes = db["themes"]  # optional if you use theme db

def unzip_theme(source_zip, dest_dir):
    with zipfile.ZipFile(source_zip, 'r') as zip_ref:
        zip_ref.extractall(dest_dir)

def zip_theme(source_dir, zip_path):
    shutil.make_archive(zip_path.replace(".zip", ""), 'zip', source_dir)

def process_liquid_files(folder, prompt):
    for root, dirs, files in os.walk(folder):
        for file in files:
            if file.endswith(".liquid"):
                full_path = os.path.join(root, file)
                with open(full_path, 'r', encoding='utf-8') as f:
                    original = f.read()
                # Call Claude API to modify
                response = requests.post(CLAUDE_API_URL, json={
                    "prompt": prompt,
                    "content": original
                })
                if response.status_code == 200:
                    updated = response.json().get("modified")
                    if updated:
                        with open(full_path, 'w', encoding='utf-8') as f:
                            f.write(updated)

def upload_shopify_theme(session_id, zip_output_path):
    # Get token
    token_data = tokens.find_one({"sessionId": session_id})
    if not token_data:
        return {"success": False, "error": "未找到 Access Token"}

    access_token = token_data["accessToken"]
    shop_domain = "https://"+token_data["shop"]

    # # Upload to Shopify
    headers = {
        "X-Shopify-Access-Token": access_token
    }
    files = {
        'theme[role]': (None, 'unpublished'),
        'theme[name]': (None, f"ShopPilot-{session_id[:6]}"), 
        'theme[zip]': (f"{session_id}.zip", open(zip_output_path, 'rb'), 'application/zip')
    }

    print(shop_domain+SHOPIFY_UPLOAD_URL)
    print(access_token)
    response = requests.post(shop_domain+SHOPIFY_UPLOAD_URL.format(shop=shop_domain), headers=headers, files=files)

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

def process_theme(session_id, shop):
    # Get prompt + theme_id
    temp_doc = temp_results.find_one({"id": session_id})
    if not temp_doc:
        return {"success": False, "error": "Session 未找到"}

    prompt = temp_doc.get("prompt")
    theme_id = temp_doc.get("themeId")

    theme_info = themes.find_one({"_id": ObjectId(theme_id)}) if theme_id else None
    theme_path = theme_info["path"] if theme_info else os.path.join(THEME_DIR, "default.zip")

    # Create working folder
    theme_work_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(theme_work_dir, exist_ok=True)
    unzip_theme(theme_path, theme_work_dir)
    
    # process_liquid_files(theme_work_dir, prompt)
    zip_output_path = os.path.join(TEMP_DIR, f"{session_id}.zip")
    zip_theme(theme_work_dir, zip_output_path)

    # upload theme to Shopify
    return upload_shopify_theme(session_id, zip_output_path)


# Example Flask or FastAPI endpoint (choose one)

# For FastAPI:
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "✅ FastAPI is running!"}

@app.post("/api/theme/process")
async def api_process(req: Request):
    data = await req.json()
    session_id = data.get("sessionId")
    shop = data.get("shop")
    # return process_theme(session_id, shop)
    zip_output_path = './temp/d10e80f5-7ec5-48f2-82ae-1c056a9ca397.zip'
    return upload_shopify_theme(session_id, zip_output_path)
