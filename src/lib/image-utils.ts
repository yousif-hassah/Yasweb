/**
 * image-utils.ts
 * Converts an image File to WebP format in-browser using a canvas.
 * The converted file is smaller, faster to upload, and served efficiently.
 *
 * @param file    - The original image file chosen by the user
 * @param quality - WebP quality from 0 (lowest) to 1 (highest). Default: 0.82
 * @param maxWidth - Maximum width in pixels; image is downscaled if larger. Default: 1600
 * @returns A Promise that resolves to a new File in image/webp format
 */
export function convertToWebP(
  file: File,
  quality = 0.75,
  maxWidth = 1600,
): Promise<File> {
  return new Promise((resolve) => {
    // If already WebP or not an image, skip conversion and return as-is
    if (file.type === "image/webp" || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => resolve(file); // fallback: return original

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => resolve(file); // fallback: return original

      img.onload = () => {
        // Optionally downscale very large images
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Helper to get blob with a specific quality
        const getBlobForQuality = (q: number): Promise<Blob | null> => {
          return new Promise((resBlob) => {
            canvas.toBlob((blob) => resBlob(blob), "image/webp", q);
          });
        };

        const processBlob = async () => {
          try {
            let blob = await getBlobForQuality(quality);
            if (!blob) {
              resolve(file);
              return;
            }

            // If the WebP is larger than the original file, try a lower quality (0.60)
            if (blob.size >= file.size && quality > 0.60) {
              const lowerQualityBlob = await getBlobForQuality(0.60);
              if (lowerQualityBlob && lowerQualityBlob.size < blob.size) {
                blob = lowerQualityBlob;
              }
            }

            // If it's still larger than the original file, fall back to the original file
            if (blob.size >= file.size) {
              resolve(file);
              return;
            }

            // Rename file extension to .webp
            const baseName =
              file.name.includes(".")
                ? file.name.substring(0, file.name.lastIndexOf("."))
                : file.name;
            const webpFile = new File([blob], `${baseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(webpFile);
          } catch (err) {
            resolve(file);
          }
        };

        processBlob();
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Helper to proxy Supabase Storage URLs through our server-side caching CDN endpoint
 * to completely eliminate Supabase Cached Storage Egress quota consumption.
 */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  // If it's an R2 CDN URL or any external absolute URL, serve directly
  if (url.startsWith("https://cdn.yastudio.org") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // If it's a relative path starting with /, prefix with our R2 CDN
  if (url.startsWith("/")) {
    return `https://cdn.yastudio.org${url}`;
  }
  // Check if it's a Supabase storage URL (public access path)
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    return `/api/media?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Helper to upload a file directly to Cloudflare R2 via our /api/upload endpoint.
 * Automatically converts images to WebP if applicable.
 */
export async function uploadToR2(file: File, folder: string = "general"): Promise<string> {
  const isImage = file.type.startsWith("image/");
  const fileToUpload = isImage ? await convertToWebP(file) : file;

  const formData = new FormData();
  formData.append("file", fileToUpload);
  formData.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Upload failed");
  }

  const data = await res.json();
  return data.url;
}

