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
    const filename = image.path.split('/').pop()?.split('.').slice(0, -1).join('.');
    if (!filename) return '';
    return `menu-videos/${filename}.mp4`;
  }, [image.path]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full p-0 overflow-hidden border-none shadow-2xl rounded-none bg-background focus:outline-none">
        <div className="w-full">
          <div className="w-full aspect-video bg-black flex items-center justify-center">
            {videoPath ? (
              <FirebaseStorageVideo
                path={videoPath}
                className="w-full h-full max-h-[70vh]"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground text-[12pt] font-normal">
                Could not determine video path.
              </div>
            )}
          </div>
          <div className="px-4 sm:px-6 py-4 bg-background border-t border-border/10">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-normal text-[12pt] tracking-widest text-foreground uppercase m-0 p-0 leading-tight">
                {image.alt}
              </DialogTitle>
              <DialogDescription className="text-[11pt] sm:text-[12pt] text-muted-foreground font-normal leading-relaxed m-0 p-0">
                {image.description || "This video shows the kinetic sculpture's mesmerizing movement."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
