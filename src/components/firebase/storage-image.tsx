'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface FirebaseStorageImageProps {
  path: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function FirebaseStorageImage({ path, alt, width, height, className }: FirebaseStorageImageProps) {
  const app = useFirebaseApp();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getUrl() {
      if (!app) return;
      if (!app.options.storageBucket) {
        setError('Firebase Storage is not configured. Please check your firebase/config.ts file.');
        return;
      }
      try {
        const storage = getStorage(app);
        const storageRef = ref(storage, path);
        const url = await getDownloadURL(storageRef);
        setImageUrl(url);
      } catch (e: any) {
        console.error(`Failed to get download URL for ${path}`, e);
        if (e.code === 'storage/object-not-found') {
          setError(`Image not found in Firebase Storage at path: ${path}`);
        } else if (e.code === 'storage/unauthorized') {
          setError(`You don't have permission to access this image. Please check your Firebase Storage security rules to allow public read access.`);
        } else {
          setError('Failed to load image from Firebase Storage. Check the browser console for more details.');
        }
      }
    }

    if(path) {
        getUrl();
    }
  }, [path, app]);

  if (error) {
    return (
        <div style={{width, height}} className="w-full h-full flex items-center justify-center bg-muted text-destructive">
            <p className="p-4 text-center">{error}</p>
        </div>
    );
  }

  if (!imageUrl) {
    return <Skeleton style={{width, height}} className={className} />;
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
