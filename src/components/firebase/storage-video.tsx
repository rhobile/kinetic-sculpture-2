'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FirebaseStorageVideoProps {
  path: string;
  className?: string;
}

export function FirebaseStorageVideo({ path, className }: FirebaseStorageVideoProps) {
  const app = useFirebaseApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
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
      // Force use of the absolute gs:// bucket path for reliability
      const storage = getStorage(app, 'gs://ks-bucket-nl');
      const vRef = ref(storage, path);
      const url = await getDownloadURL(vRef);
      setVideoUrl(url);
    } catch (e: any) {
      console.error(`Video Load Error [${path}]:`, e);
      setError('Video load failed. Check CORS.');
    } finally {
      setIsLoading(false);
    }
  }, [app, path]);

  useEffect(() => {
    getUrls();
  }, [getUrls]);

  if (isLoading && !videoUrl) {
    return <Skeleton className={cn('w-full h-full aspect-video', className)} />;
  }

  if (error && !videoUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-destructive p-4 text-center border">
        <p className="text-[10px] uppercase font-bold tracking-widest mb-1">Video Error</p>
        <Button variant="outline" size="sm" onClick={getUrls} className="h-6 text-[9px] uppercase">Retry</Button>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      key={path}
      controls
      autoPlay
      loop
      muted
      playsInline
      className={cn("w-full h-full object-contain bg-black", className)}
    >
      {videoUrl && <source src={videoUrl} type="video/mp4" />}
    </video>
  );
}
