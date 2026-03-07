'use client';

import { memo } from 'react';
import Image from 'next/image';

export interface PostImageGridProps {
  imageUrls: string[];
  onImageClick: (index: number) => void;
  /** sizes attribute for multi-image thumbnails */
  multiImageSizes?: string;
}

export const PostImageGrid = memo(function PostImageGrid({
  imageUrls,
  onImageClick,
  multiImageSizes = '(max-width: 640px) 128px, 160px',
}: PostImageGridProps) {
  if (imageUrls.length === 0) return null;

  if (imageUrls.length === 1) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-3xl aspect-[4/3] shadow-inner cursor-pointer hover:opacity-90 transition-opacity"
        style={{ maxHeight: '24rem' }}
        onClick={(e) => {
          e.stopPropagation();
          onImageClick(0);
        }}
      >
        <Image
          src={imageUrls[0]}
          alt="Post content"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 700px"
          priority={false}
        />
      </div>
    );
  }

  if (imageUrls.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden">
        {imageUrls.map((url, index) => (
          <div
            key={index}
            className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer hover:opacity-95 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(index);
            }}
          >
            <Image
              src={url}
              alt={`Post image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 350px"
              priority={false}
            />
          </div>
        ))}
      </div>
    );
  }

  if (imageUrls.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden">
        <div
          className="relative row-span-2 aspect-square overflow-hidden bg-slate-100 cursor-pointer hover:opacity-95 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(0);
          }}
        >
          <Image
            src={imageUrls[0]}
            alt="Post image 1"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 350px"
            priority={false}
          />
        </div>
        <div
          className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer hover:opacity-95 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(1);
          }}
        >
          <Image
            src={imageUrls[1]}
            alt="Post image 2"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 350px"
            priority={false}
          />
        </div>
        <div
          className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer hover:opacity-95 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(2);
          }}
        >
          <Image
            src={imageUrls[2]}
            alt="Post image 3"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 350px"
            priority={false}
          />
        </div>
      </div>
    );
  }

  const displayUrls = imageUrls.slice(0, 4);
  const extraCount = imageUrls.length - 4;

  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden">
      {displayUrls.map((url, index) => (
        <div
          key={index}
          className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer hover:opacity-95 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(index);
          }}
        >
          <Image
            src={url}
            alt={`Post image ${index + 1}`}
            fill
            className="object-cover"
            sizes={multiImageSizes}
            priority={false}
          />
          {index === 3 && extraCount > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xl font-semibold">
              +{extraCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
