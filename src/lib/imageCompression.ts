/**
 * Compress an image file using Canvas API.
 * Reads performance settings for max dimensions, quality, and format preferences.
 * Outputs WebP when supported and enabled, falls back to JPEG.
 */

const supportsWebP = (() => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
})();

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  enableWebp?: boolean;
  enableCompression?: boolean;
}

export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<{ blob: Blob; wasCompressed: boolean; extension: string; contentType: string }> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 82,
    enableWebp = true,
    enableCompression = true,
  } = options;

  const qualityNormalized = quality > 1 ? quality / 100 : quality;
  const useWebp = enableWebp && supportsWebP;
  const outputType = useWebp ? "image/webp" : "image/jpeg";
  const outputExt = useWebp ? "webp" : "jpg";

  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve({ blob: file, wasCompressed: false, extension: file.name.split(".").pop() || "bin", contentType: file.type });
      return;
    }

    // If compression is disabled, only enforce max resolution
    if (!enableCompression && !enableWebp) {
      resolve({ blob: file, wasCompressed: false, extension: file.name.split(".").pop() || "jpg", contentType: file.type });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Skip compression for small images when compression is enabled
      if (enableCompression && width <= maxWidth && height <= maxHeight && file.size < 200 * 1024) {
        resolve({ blob: file, wasCompressed: false, extension: file.name.split(".").pop() || "jpg", contentType: file.type });
        return;
      }

      // Always enforce max resolution
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ blob: file, wasCompressed: false, extension: file.name.split(".").pop() || "jpg", contentType: file.type });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve({ blob, wasCompressed: true, extension: outputExt, contentType: outputType });
          } else {
            resolve({ blob: file, wasCompressed: false, extension: file.name.split(".").pop() || "jpg", contentType: file.type });
          }
        },
        outputType,
        qualityNormalized
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob: file, wasCompressed: false, extension: file.name.split(".").pop() || "jpg", contentType: file.type });
    };

    img.src = url;
  });
};
