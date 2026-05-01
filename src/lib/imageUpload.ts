/**
 * Client-side image resize + direct upload to Cloudinary.
 * Skips the round-trip through our server for selfies, dropping upload time
 * from 10-15s to 1-3s on typical mobile connections.
 *
 * Falls back to the server endpoint when the unsigned preset isn't configured.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export function isDirectUploadConfigured() {
  return !!CLOUD_NAME && !!UPLOAD_PRESET;
}

/** Resize a File/Blob to max `maxEdge` px on the longest side, re-encode as JPEG. */
export async function resizeImage(
  source: Blob,
  maxEdge = 1024,
  quality = 0.85
): Promise<Blob> {
  const img = await loadImage(source);
  const longest = Math.max(img.width, img.height);
  const ratio = Math.min(1, maxEdge / longest);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Image encoding failed");
  return blob;
}

function loadImage(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}

/** Direct unsigned upload to Cloudinary. Reports progress 0..1. */
export function uploadDirectToCloudinary(
  blob: Blob,
  opts: { folder?: string; onProgress?: (p: number) => void } = {}
): Promise<{ url: string; width: number; height: number }> {
  if (!isDirectUploadConfigured()) {
    return Promise.reject(new Error("Direct upload not configured"));
  }

  const fd = new FormData();
  fd.append("file", blob);
  fd.append("upload_preset", UPLOAD_PRESET);
  if (opts.folder) fd.append("folder", opts.folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(e.loaded / e.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const j = JSON.parse(xhr.responseText);
          resolve({ url: j.secure_url, width: j.width, height: j.height });
        } catch (e) {
          reject(new Error("Bad Cloudinary response"));
        }
      } else {
        reject(new Error(`Cloudinary ${xhr.status}: ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.timeout = 30_000;
    xhr.send(fd);
  });
}

/** Fallback: send the file as base64 to our /api/upload route. Slower but always works. */
export async function uploadViaServer(
  blob: Blob,
  kind: "selfie" | "preview"
): Promise<{ url: string }> {
  const dataUrl = await blobToDataUrl(blob);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: dataUrl, kind }),
  });
  if (!res.ok) throw new Error(`Server upload failed: ${res.status}`);
  const j = await res.json();
  return { url: j.url };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Best-path upload for selfies: resize, then prefer direct → fall back to server.
 * Returns the public URL plus a progress callback that fires 0..1.
 */
export async function uploadSelfie(
  file: File | Blob,
  onProgress?: (p: number) => void
): Promise<string> {
  const resized = await resizeImage(file, 1024, 0.85);

  if (isDirectUploadConfigured()) {
    try {
      const { url } = await uploadDirectToCloudinary(resized, {
        folder: "cutline-ai/selfie",
        onProgress,
      });
      onProgress?.(1);
      return url;
    } catch (e) {
      console.warn("[upload] direct failed, falling back to server", e);
    }
  }

  // server fallback (no progress events available)
  onProgress?.(0.5);
  const { url } = await uploadViaServer(resized, "selfie");
  onProgress?.(1);
  return url;
}
