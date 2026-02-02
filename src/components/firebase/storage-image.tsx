'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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
  const [isLoading, setIsLoading] = useState(false);

  const getUrl = useCallback(async () => {
    if (!app || !path) return;
    if (!app.options.storageBucket) {
      setError('Firebase Storage is not configured. Please check your firebase/config.ts file.');
      return;
    }
    
    setIsLoading(true);
    setError(null);

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
      setImageUrl(null);
    } finally {
        setIsLoading(false);
    }
  }, [app, path]);

  useEffect(() => {
    if(path) {
        getUrl();
    }
  }, [path, getUrl]);

  if (error) {
    return (
        <div style={{width, height}} className="w-full h-full flex flex-col items-center justify-center bg-muted text-destructive p-4">
            <p className="text-center mb-4">{error}</p>
            <Button onClick={getUrl} disabled={isLoading}>
              {isLoading ? 'Retrying...' : 'Retry'}
            </Button>
        </div>
    );
  }

  if (isLoading || !imageUrl) {
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
