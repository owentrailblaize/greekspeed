import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

export default function ImageWithFallback({ src, alt, className, loading, fill, priority, ...rest }: ImageProps) {
  const fallback = "/logo.png";
  return (
    <Image
      src={src || fallback}
      alt={alt}
      {...(fill ? { fill: true } : { width: 64, height: 64 })}
      className={cn(className)}
      {...(priority ? { priority: true } : { loading: loading || "lazy" })}
      sizes={rest.sizes || fill ? "100vw" : undefined}
      quality={rest.quality || fill ? 90 : 75}
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        target.src = fallback;
      }}
      {...rest}
    />
  );
}