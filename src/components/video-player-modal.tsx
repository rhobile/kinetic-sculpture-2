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
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden border-none shadow-2xl">
        <div className="w-full">
          <div className="w-full aspect-video bg-black">
            {videoPath ? (
              <FirebaseStorageVideo
                path={videoPath}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
                Could not determine video path.
              </div>
            )}
          </div>
          <div className="p-4 bg-background">
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-normal text-sm tracking-wide text-foreground uppercase">
                {image.alt}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground font-normal leading-relaxed">
                This video shows the kinetic sculpture&apos;s mesmerizing movement.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
