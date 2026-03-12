import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  alt: string;
  /** Width hints for responsive srcset via Supabase transform */
  widths?: number[];
  /** Show blur-up placeholder */
  blurPlaceholder?: boolean;
  /** Force eager loading (bypass lazy setting) */
  eager?: boolean;
}

/**
 * Generates Supabase Storage transform URLs for responsive images.
 * Only works for URLs from our Supabase storage bucket.
 */
const isSupabaseStorageUrl = (url: string) =>
  url.includes("supabase.co/storage/v1/object/public/");

const getTransformUrl = (url: string, width: number, quality = 80) => {
  if (!isSupabaseStorageUrl(url)) return null;
  const transformed = url.replace(
    "/storage/v1/object/public/",
    `/storage/v1/render/image/public/`
  );
  return `${transformed}?width=${width}&quality=${quality}`;
};

const OptimizedImage = ({
  src,
  alt,
  widths = [400, 800, 1200],
  blurPlaceholder = true,
  eager = false,
  className,
  ...rest
}: OptimizedImageProps) => {
  const { get } = useSiteSettings();
  const lazyEnabled = get("performance", "lazy_loading", "true") !== "false";
  const shouldLazy = lazyEnabled && !eager;

  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(!shouldLazy);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!shouldLazy) {
      setInView(true);
      return;
    }
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLazy]);

  // Build srcSet for Supabase storage images
  const srcSet = isSupabaseStorageUrl(src)
    ? widths
        .map((w) => {
          const url = getTransformUrl(src, w);
          return url ? `${url} ${w}w` : null;
        })
        .filter(Boolean)
        .join(", ")
    : undefined;

  const sizes = srcSet
    ? widths.map((w, i) =>
        i === widths.length - 1
          ? `${w}px`
          : `(max-width: ${w}px) ${w}px`
      ).join(", ")
    : undefined;

  return (
    <div ref={imgRef} className={cn("overflow-hidden relative", className)}>
      {/* Blur placeholder */}
      {blurPlaceholder && !loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {inView && (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={shouldLazy ? "lazy" : "eager"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0"
          )}
          {...rest}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
