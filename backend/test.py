import requests

access_token = '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'
shop = 'testshoppilot.myshopify.com'
zip_path = './themes/theme0521.zip'

url = f'https://{shop}/admin/api/2024-04/themes.json'
headers = {
    'X-Shopify-Access-Token': access_token
}

# fff = open(zip_path, 'rb')
# print(fff)

with open(zip_path, "rb") as f:
    files = {
        'theme[role]': (None, 'unpublished'),
        'theme[name]': (None, 'AI Upload Theme'),
        'theme[zip]': ('theme.zip', f, 'application/zip'),
    }

    headers = {
        'X-Shopify-Access-Token': access_token
    }

    response = requests.post(
        f"https://{shop}/admin/api/2025-07/themes.json",
        headers=headers,
        files=files
    )

print(response.status_code)
print(response.json())
