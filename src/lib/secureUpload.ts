import { supabase } from "@/integrations/supabase/client";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const BLOCKED_EXTENSIONS = new Set([
  "php", "js", "exe", "sh", "html", "htm", "bat", "cmd", "msi",
  "ps1", "vbs", "wsf", "jar", "py", "rb", "pl", "cgi", "asp", "aspx",
  "jsp", "svg", // SVG can contain scripts
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Generate a random hash filename, preserving only the safe extension.
 */
const randomFileName = (safeExt: string): string => {
  const hash = crypto.randomUUID().replace(/-/g, "");
  return `${hash}.${safeExt}`;
};

/**
 * Map an allowed MIME type to a safe extension.
 */
const mimeToExtension = (mime: string): string => {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  return map[mime] || "bin";
};

export interface SecureUploadOptions {
  /** Sub-directory inside the "uploads" folder, e.g. "gallery", "blog-featured" */
  directory?: string;
  /** Override allowed MIME types (defaults to images + PDF) */
  allowedMimeTypes?: Set<string>;
}

export interface SecureUploadResult {
  publicUrl: string;
  storagePath: string;
}

/**
 * Validate and upload a file (or Blob with a contentType) to Supabase storage
 * with security checks for MIME type, extension, and file size.
 *
 * @param fileOrBlob - The File or Blob to upload.
 * @param contentType - The MIME type. For File objects this is auto-detected; pass explicitly for compressed blobs.
 * @param originalName - Original filename (used only for extension validation).
 * @param options - Optional directory and allowed MIME overrides.
 * @returns The public URL and storage path.
 * @throws Error if validation fails.
 */
export const secureUpload = async (
  fileOrBlob: File | Blob,
  contentType: string,
  originalName: string,
  options: SecureUploadOptions = {}
): Promise<SecureUploadResult> => {
  const { directory = "", allowedMimeTypes = ALLOWED_MIME_TYPES } = options;

  // 1. Size check
  if (fileOrBlob.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds the 5 MB limit (${(fileOrBlob.size / 1024 / 1024).toFixed(1)} MB).`);
  }

  // 2. MIME type check
  const normalizedMime = contentType.toLowerCase().trim();
  if (!allowedMimeTypes.has(normalizedMime)) {
    throw new Error(`File type "${normalizedMime}" is not allowed. Accepted: ${[...allowedMimeTypes].join(", ")}.`);
  }

  // 3. Extension check (block dangerous extensions from original name)
  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new Error(`File extension ".${ext}" is blocked for security reasons.`);
  }

  // 4. Generate safe random filename using MIME-derived extension
  const safeExt = mimeToExtension(normalizedMime);
  const fileName = randomFileName(safeExt);
  const dirPrefix = directory ? `uploads/${directory}` : "uploads";
  const storagePath = `${dirPrefix}/${fileName}`;

  // 5. Upload
  const { error } = await supabase.storage
    .from("media")
    .upload(storagePath, fileOrBlob, { contentType: normalizedMime });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from("media").getPublicUrl(storagePath);

  return { publicUrl: urlData.publicUrl, storagePath };
};
