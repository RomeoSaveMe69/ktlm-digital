import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfig() {
  if (configured) return;

  const cloud_name =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dz8qwj3qe";
  const api_key =
    process.env.CLOUDINARY_API_KEY || "399551884748644";
  const api_secret =
    process.env.CLOUDINARY_API_SECRET || "rGVN3uurQDupB6ut_eyxXNdpAJA";

  cloudinary.config({ cloud_name, api_key, api_secret });
  configured = true;
}

export type CloudinaryFolder =
  | "deposits"
  | "kyc"
  | "profiles"
  | "games"
  | "categories";

/**
 * Upload a base64 data-URL image to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadImage(
  base64DataUrl: string,
  folder: CloudinaryFolder,
): Promise<string> {
  ensureConfig();
  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder: `ktlm/${folder}`,
    resource_type: "image",
  });
  return result.secure_url;
}

/**
 * Delete an image from Cloudinary by its URL.
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  ensureConfig();
  const publicId = extractPublicId(imageUrl);
  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }
}

/**
 * Delete multiple images from Cloudinary.
 */
export async function deleteImages(imageUrls: string[]): Promise<void> {
  ensureConfig();
  const ids = imageUrls.map(extractPublicId).filter(Boolean) as string[];
  if (ids.length === 0) return;
  const batchSize = 100;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await cloudinary.api.delete_resources(batch);
  }
}

function extractPublicId(url: string): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match?.[1] ?? null;
}

export { cloudinary };
