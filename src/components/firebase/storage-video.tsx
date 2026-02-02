'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUrl = useCallback(async () => {
    if (!app || !path) {
      setError('Firebase app or video path is not available.');
      setIsLoading(false);
      return;
    }
    if (!app.options.storageBucket) {
      setError('Firebase Storage is not configured.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      setVideoUrl(url);
    } catch (e: any) {
      console.error(`Failed to get download URL for ${path}`, e);
      if (e.code === 'storage/object-not-found') {
        setError(`Video not found at path: "${path}". Please ensure a video file with the correct name exists in your 'menu-videos' folder.`);
      } else if (e.code === 'storage/unauthorized') {
        setError(`Permission denied. Please check your Firebase Storage security rules to ensure public read access is allowed for the path: "${path}".`);
      } else {
        setError(`An error occurred while loading the video (Code: ${e.code || 'unknown'}).`);
      }
    } finally {
        setIsLoading(false);
    }
  }, [app, path]);

  useEffect(() => {
    getUrl();
  }, [getUrl]);

  if (isLoading) {
    return <Skeleton className={cn('w-full h-full', className)} />;
  }

  if (error) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-destructive p-4 text-center">
            <p className="font-semibold mb-2">Error Loading Video</p>
            <p className="mb-4 text-sm text-left whitespace-pre-wrap">{error}</p>
            <Button onClick={getUrl} disabled={isLoading}>
              {isLoading ? 'Retrying...' : 'Retry'}
            </Button>
        </div>
    );
  }

  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        controls
        autoPlay
        loop
        muted
        className={cn("w-full h-full object-cover", className)}
      />
    );
  }

  return <Skeleton className={cn("w-full h-full", className)} />;
}
