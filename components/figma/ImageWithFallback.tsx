import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

export default function ImageWithFallback({ src, alt, className, loading, ...rest }: ImageProps) {
  const fallback = "/logo.png";
  return (
    <Image
      src={src || fallback}
      alt={alt}
      width={64}
      height={64}
      className={cn(className)}
      loading={loading || "lazy"} // Enable lazy loading by default for better performance
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        target.src = fallback;
      }}
      {...rest}
    />
  );
} 