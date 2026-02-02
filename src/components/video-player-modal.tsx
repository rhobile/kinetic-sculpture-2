'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { FirebaseImage } from '@/lib/firebase-images';
import { FirebaseStorageVideo } from '@/components/firebase/storage-video';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';

interface VideoPlayerModalProps {
  image: FirebaseImage;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ image, isOpen, onClose }: VideoPlayerModalProps) {
  const videoPath = useMemo(() => {
    // Replaces 'menu-images' with 'menu-videos' and the file extension with '.mp4'
    // e.g. 'menu-images/arclinedot.jpg' -> 'menu-videos/arclinedot.mp4'
    const filename = image.path.split('/').pop()?.split('.').slice(0, -1).join('.');
    if (!filename) return '';
    return `menu-videos/${filename}.mp4`;
  }, [image.path]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] p-0">
        <div className="md:grid md:grid-cols-2">
          <div className="relative aspect-[4/5] h-[60vh] md:h-auto md:aspect-auto bg-muted">
            {videoPath ? (
              <FirebaseStorageVideo
                path={videoPath}
                className="md:rounded-l-lg rounded-t-lg md:rounded-t-none"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4 text-center">
                Could not determine video path.
              </div>
            )}
          </div>
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <DialogHeader>
              <DialogTitle className="font-headline text-3xl mb-2">{image.alt}</DialogTitle>
              <DialogDescription className="text-base">
                The video on the left shows the kinetic sculpture's mesmerizing movement.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-lg overflow-hidden border aspect-video flex items-center justify-center">
              <FirebaseStorageImage
                path={image.path}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="w-full h-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Image: {image.path}<br/>
              Video: {videoPath}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
