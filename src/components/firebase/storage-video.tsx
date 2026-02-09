'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUrls = useCallback(async () => {
    if (!app || !path) {
      setError('Video path not provided.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const storage = getStorage(app);
      
      // Load poster URL first for instant visual feedback
      if (posterPath) {
        const pRef = ref(storage, posterPath);
        getDownloadURL(pRef).then(url => setPosterUrl(url)).catch(() => {});
      }

      const vRef = ref(storage, path);
      const url = await getDownloadURL(vRef);
      setVideoUrl(url);
    } catch (e: any) {
      console.error(`Failed to get download URL for ${path}`, e);
      setError('Error loading video.');
    } finally {
      setIsLoading(false);
    }
  }, [app, path, posterPath]);

  useEffect(() => {
    getUrls();
  }, [getUrls]);

  // Ensure video engine respects the new source if it updates
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  if (isLoading && !posterUrl && !videoUrl) {
    return <Skeleton className={cn('w-full h-full aspect-video', className)} />;
  }

  if (error && !videoUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-destructive p-4 text-center">
        <p className="text-xs mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={getUrls}>Retry</Button>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      key={path} // Force clean initialization only when path changes
      poster={posterUrl || undefined}
      controls
      autoPlay
      loop
      muted
      playsInline
      webkit-playsinline="true"
      preload="auto"
      className={cn("w-full h-full object-contain bg-black", className)}
    >
      {videoUrl && <source src={videoUrl} type="video/mp4" />}
    </video>
  );
}
