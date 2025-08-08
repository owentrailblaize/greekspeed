import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

export default function ImageWithFallback({ src, alt, className, ...rest }: ImageProps) {
  const fallback = "/logo.jpeg";
  return (
    <Image
      src={src || fallback}
      alt={alt}
      width={64}
      height={64}
      className={cn(className)}
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        target.src = fallback;
      }}
      {...rest}
    />
  );
} 