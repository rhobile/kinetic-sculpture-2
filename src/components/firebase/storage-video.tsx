'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FirebaseStorageVideoProps {
  path: string;
  posterPath?: string;
  className?: string;
}

export function FirebaseStorageVideo({ path, posterPath, className }: FirebaseStorageVideoProps) {
  const app = useFirebaseApp();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUrls = useCallback(async () => {
    if (!app || !path) {
      setError('Firebase app or video path is not available.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const storage = getStorage(app);
      
      // Load poster URL first if provided for instant visual feedback
      if (posterPath) {
        const pRef = ref(storage, posterPath);
        getDownloadURL(pRef).then(url => setPosterUrl(url)).catch(() => {});
      }

      const vRef = ref(storage, path);
      const url = await getDownloadURL(vRef);
      setVideoUrl(url);
    } catch (e: any) {
      console.error(`Failed to get download URL for ${path}`, e);
      setError(e.code === 'storage/object-not-found' ? 'Video not found.' : 'Error loading video.');
    } finally {
      setIsLoading(false);
    }
  }, [app, path, posterPath]);

  useEffect(() => {
    getUrls();
  }, [getUrls]);

  if (isLoading && !posterUrl) {
    return <Skeleton className={cn('w-full h-full aspect-video', className)} />;
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-destructive p-4 text-center">
        <p className="text-xs mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={getUrls}>Retry</Button>
      </div>
    );
  }

  return (
    <video
      src={videoUrl || undefined}
      poster={posterUrl || undefined}
      controls
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className={cn("w-full h-full object-contain", className)}
    />
  );
}
