import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// 1. Read .env file manually
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      const val = valueParts.join("=").replace(/^["']|["']$/g, "");
      process.env[key.trim()] = val.trim();
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials in .env");
  process.exit(1);
}

import ws from "ws";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "https://318f643782ac4e3db906ac2eb3e3317c.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "bdb1f944b8e909f60a647a72bc07abcf",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "c01a2d1de08b6a808ec4dfc6033d24db8133017a7c078382ddfb893d572d7ccd",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "yas-media";
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || "https://cdn.yastudio.org";

async function uploadUrlToR2(url, folder) {
  if (!url || url.startsWith(PUBLIC_DOMAIN)) {
    return url; // Already migrated or empty
  }

  try {
    console.log(`⏳ Downloading: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  ⚠️ Failed to fetch file HTTP ${res.status}: ${url}`);
      return url;
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract filename from URL
    const urlObj = new URL(url);
    const rawFilename = path.basename(urlObj.pathname) || `file-${Date.now()}`;
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9.-]/g, "-");
    const key = `${folder}/${Date.now()}-${cleanFilename}`;

    console.log(`  ⬆️ Uploading to R2: ${key}`);
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    const newUrl = `${PUBLIC_DOMAIN}/${key}`;
    console.log(`  ✅ Migrated -> ${newUrl}`);
    return newUrl;
  } catch (err) {
    console.error(`  ❌ Error migrating ${url}:`, err.message);
    return url;
  }
}

async function migrateBarbers() {
  console.log("\n💈 --- Migrating Barbers Photos ---");
  const { data: barbers, error } = await supabase.from("barbers").select("id, photo_url, name_en");
  if (error) {
    console.error("Failed to fetch barbers:", error);
    return;
  }

  let count = 0;
  for (const barber of barbers || []) {
    if (barber.photo_url && !barber.photo_url.startsWith(PUBLIC_DOMAIN)) {
      console.log(`Barber: ${barber.name_en}`);
      const newUrl = await uploadUrlToR2(barber.photo_url, "barbers");
      if (newUrl !== barber.photo_url) {
        await supabase.from("barbers").update({ photo_url: newUrl }).eq("id", barber.id);
        count++;
      }
    }
  }
  console.log(`✨ Barbers photos migrated: ${count}`);
}

async function migrateProducts() {
  console.log("\n🧴 --- Migrating Products Images ---");
  const { data: products, error } = await supabase.from("products").select("id, image_url, name_en");
  if (error) {
    console.error("Failed to fetch products:", error);
    return;
  }

  let count = 0;
  for (const product of products || []) {
    if (product.image_url && !product.image_url.startsWith(PUBLIC_DOMAIN)) {
      console.log(`Product: ${product.name_en}`);
      const newUrl = await uploadUrlToR2(product.image_url, "products");
      if (newUrl !== product.image_url) {
        await supabase.from("products").update({ image_url: newUrl }).eq("id", product.id);
        count++;
      }
    }
  }
  console.log(`✨ Products images migrated: ${count}`);
}

async function migratePortfolio() {
  console.log("\n📸 --- Migrating Portfolio Items ---");
  const { data: items, error } = await supabase.from("portfolio_items").select("id, url, title_en, type");
  if (error) {
    console.error("Failed to fetch portfolio items:", error);
    return;
  }

  let count = 0;
  for (const item of items || []) {
    if (item.url && !item.url.startsWith(PUBLIC_DOMAIN)) {
      console.log(`Portfolio item: ${item.title_en || item.id} (${item.type})`);
      const newUrl = await uploadUrlToR2(item.url, "portfolio");
      if (newUrl !== item.url) {
        await supabase.from("portfolio_items").update({ url: newUrl }).eq("id", item.id);
        count++;
      }
    }
  }
  console.log(`✨ Portfolio items migrated: ${count}`);
}

async function run() {
  console.log("🚀 Starting Cloudflare R2 Migration...");
  await migrateBarbers();
  await migrateProducts();
  await migratePortfolio();
  console.log("\n🎉 All media migrated successfully to Cloudflare R2!");
}

run();
