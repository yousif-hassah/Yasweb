import { createFileRoute } from "@tanstack/react-router";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const formData = await request.formData();
          const file = formData.get("file") as File | null;
          const folder = (formData.get("folder") as string) || "general";

          if (!file) {
            return new Response(JSON.stringify({ error: "No file provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const sanitizeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
          const key = `${folder}/${Date.now()}-${sanitizeFilename}`;

          const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type || "application/octet-stream",
          });

          await r2Client.send(command);

          const publicUrl = `${PUBLIC_DOMAIN}/${key}`;

          return new Response(
            JSON.stringify({
              success: true,
              url: publicUrl,
              key: key,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error: any) {
          console.error("R2 Upload Error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to upload file to R2" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
