/**
 * Compress an image file using Canvas API.
 * Returns a compressed Blob (JPEG) if the file is an image, otherwise returns the original file.
 */
export const compressImage = (
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.82
): Promise<{ blob: Blob; wasCompressed: boolean }> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve({ blob: file, wasCompressed: false });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Skip compression for small images
      if (width <= maxWidth && height <= maxHeight && file.size < 200 * 1024) {
        resolve({ blob: file, wasCompressed: false });
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
        resolve({ blob: file, wasCompressed: false });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve({ blob, wasCompressed: true });
          } else {
            // Compressed is larger — use original
            resolve({ blob: file, wasCompressed: false });
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob: file, wasCompressed: false });
    };

    img.src = url;
  });
};
