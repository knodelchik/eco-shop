/**
 * Cloudinary Upload — клієнтський helper для unsigned upload.
 *
 * Налаштування:
 *  1. Створіть акаунт на cloudinary.com (безкоштовний tier — 25 GB / 25k transforms).
 *  2. Settings → Upload → Add upload preset:
 *     - Signing Mode: Unsigned
 *     - Folder: ecoshop/products
 *     - Allowed formats: jpg, png, webp
 *     - Max file size: 5 MB
 *     - Save preset name (наприклад "ecoshop_unsigned")
 *  3. Додайте у .env.local:
 *     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
 *     NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ecoshop_unsigned
 *  4. У next.config.mjs у remotePatterns вже є res.cloudinary.com
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const cloudinaryConfigured = !!CLOUD_NAME && !!UPLOAD_PRESET;

/**
 * Завантажити файл на Cloudinary через unsigned upload.
 * Повертає secure URL картинки.
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'ecoshop/products'
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary не налаштований. Додайте NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME та NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET у .env.local'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }

  return await res.json();
}

/**
 * Завантажити кілька файлів паралельно.
 */
export async function uploadMany(files: FileList | File[]): Promise<string[]> {
  const arr = Array.from(files);
  const results = await Promise.all(arr.map((f) => uploadToCloudinary(f)));
  return results.map((r) => r.secure_url);
}
