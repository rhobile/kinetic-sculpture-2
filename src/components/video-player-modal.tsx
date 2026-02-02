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
      <DialogContent className="max-w-4xl w-full p-0">
        <div className="w-full">
          <div className="w-full aspect-video bg-muted">
            {videoPath ? (
              <FirebaseStorageVideo
                path={videoPath}
                className="w-full h-full rounded-t-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4 text-center">
                Could not determine video path.
              </div>
            )}
          </div>
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl mb-2">{image.alt}</DialogTitle>
              <DialogDescription className="text-base text-foreground/80">
                This video shows the kinetic sculpture's mesmerizing movement. You can see the original image in the main gallery.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
