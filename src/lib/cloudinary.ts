import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

/**
 * Server-side upload of a base64 data URL or remote URL. Returns secure URL + metadata.
 * Folder defaults to `cutline-ai/<kind>`.
 */
export async function uploadImage(
  source: string,
  opts: { folder: string; publicId?: string; transformation?: string } = { folder: "cutline-ai" }
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(source, {
    folder: opts.folder,
    public_id: opts.publicId,
    overwrite: true,
    resource_type: "image",
    transformation: opts.transformation
      ? [{ raw_transformation: opts.transformation }]
      : undefined,
  });
  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/** Returns true if the server has Cloudinary credentials configured. */
export function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
