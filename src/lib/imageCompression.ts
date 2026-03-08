/**
 * Compress an image file using Canvas API.
 * Outputs WebP when supported, falls back to JPEG.
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

export const compressImage = (
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.82
): Promise<{ blob: Blob; wasCompressed: boolean; extension: string; contentType: string }> => {
  const outputType = supportsWebP ? "image/webp" : "image/jpeg";
  const outputExt = supportsWebP ? "webp" : "jpg";

  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve({ blob: file, wasCompressed: false, extension: file.name.split(".").pop() || "bin", contentType: file.type });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Skip compression for small images
      if (width <= maxWidth && height <= maxHeight && file.size < 200 * 1024) {
        resolve({ blob: file, wasCompressed: false, extension: file.name.split(".").pop() || "jpg", contentType: file.type });
        return;
      }

      // Scale down proportionally
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
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob: file, wasCompressed: false, extension: file.name.split(".").pop() || "jpg", contentType: file.type });
    };

    img.src = url;
  });
};
