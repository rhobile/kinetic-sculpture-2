'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [isLoading, setIsLoading] = useState(true);

  const getUrl = useCallback(async () => {
    if (!app || !path) {
      setError('Firebase app or image path is not available.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Force use of the absolute gs:// bucket path to avoid CORS 404s on the default bucket
      const storage = getStorage(app, 'gs://ks-bucket-nl');
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
    } catch (e: any) {
      console.error(`Storage Image Error [${path}]:`, e);
      setError(e.message || 'Failed to load image');
    } finally {
        setIsLoading(false);
    }
  }, [app, path]);

  useEffect(() => {
    getUrl();
  }, [getUrl]);

  if (isLoading) {
    return <Skeleton style={{ width, height }} className={cn('w-full h-full', className)} />;
  }

  if (error) {
    return (
        <div style={{width, height}} className="w-full h-full flex flex-col items-center justify-center bg-muted text-destructive p-2 text-center border">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1">Load Error</p>
            <Button variant="ghost" size="sm" onClick={getUrl} className="h-5 text-[8px] uppercase border">Retry</Button>
        </div>
    );
  }

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className={className}
        unoptimized
      />
    );
  }

  return <Skeleton style={{width, height}} className={cn("w-full h-full", className)} />;
}
