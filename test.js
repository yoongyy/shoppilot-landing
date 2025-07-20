const crypto = require("crypto");
require('dotenv').config();

const secret = process.env.SHOPIFY_API_SECRET;


// const secret = "your_app_secret_key"; // from Shopify Admin > Apps > App setup
const body = '{"shop_id":954889,"shop_domain":"shoppilot-test.myshopify.com"}';

const hmac = crypto
  .createHmac("sha256", secret)
  .update(body, "utf8")
  .digest("base64");

console.log("X-Shopify-Hmac-Sha256:", hmac);

