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
    if (!app.options.storageBucket) {
      setError('Firebase Storage is not configured. Please check your firebase/config.ts file and ensure the storageBucket property is correct.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
    } catch (e: any) {
      console.error(`Failed to get download URL for ${path}`, e);
      if (e.code === 'storage/object-not-found') {
        setError(`Image not found at path: "${path}". Please ensure the file exists in your Firebase Storage bucket.`);
      } else if (e.code === 'storage/unauthorized') {
        setError(`Permission denied. Please check your Firebase Storage security rules to ensure public read access is allowed for the path: "${path}".`);
      } else if (e.code === 'storage/retry-limit-exceeded') {
        const bucket = app.options.storageBucket || 'N/A';
        const projectId = app.options.projectId || 'N/A';
        setError(
`This is a timeout error. Please check the following:
1. In 'src/firebase/config.ts', is the 'storageBucket' ("${bucket}") correct for your project ("${projectId}")?
2. Is your device connected to the internet, and are there any firewalls blocking access to *.googleapis.com?
3. In the Firebase Console, is Cloud Storage for Firebase enabled and fully provisioned?`
        );
      }
      else {
        let errorMessage = `An error occurred while loading the image (Code: ${e.code || 'unknown'}). This might be a network timeout or a configuration issue.`;
        errorMessage += ` Please verify your internet connection, Firebase project configuration, and storage security rules. Check the browser console for more details.`
        setError(errorMessage);
      }
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
        <div style={{width, height}} className="w-full h-full flex flex-col items-center justify-center bg-muted text-destructive p-4 text-center">
            <p className="font-semibold mb-2">Error Loading Image</p>
            <p className="mb-4 text-sm text-left whitespace-pre-wrap">{error}</p>
            <Button onClick={getUrl} disabled={isLoading}>
              {isLoading ? 'Retrying...' : 'Retry'}
            </Button>
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
      />
    );
  }

  return <Skeleton style={{width, height}} className={cn("w-full h-full", className)} />;
}
