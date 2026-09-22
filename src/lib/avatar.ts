/**
 * Avatar images are stored as base64 data URLs directly on the Firestore
 * user document (`users/{uid}.photoURL`) instead of Firebase Storage, since
 * Storage is billed and the user base is small enough that a capped, resized
 * base64 string comfortably fits inside a Firestore document (1 MiB limit).
 */

// Keep the final data URL well under Firestore's 1 MiB document limit.
export const MAX_AVATAR_BYTES = 700 * 1024; // ~700 KB encoded

// Images are downscaled to this square size before encoding, which keeps
// the resulting base64 payload small regardless of the source file size.
const TARGET_SIZE = 256;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the selected image."));
    img.src = src;
  });
}

/**
 * Reads an image file, downscales/crops it to a square avatar, and returns
 * a compressed JPEG data URL suitable for storing on a Firestore document.
 */
export async function fileToBase64(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(rawDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images.");

  // Center-crop to a square, then draw scaled down to TARGET_SIZE.
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);

  // Step down quality until it fits comfortably inside the size cap.
  let quality = 0.9;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_AVATAR_BYTES && quality > 0.3) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  if (dataUrl.length > MAX_AVATAR_BYTES) {
    throw new Error("That image is too large — try a smaller photo.");
  }

  return dataUrl;
}
