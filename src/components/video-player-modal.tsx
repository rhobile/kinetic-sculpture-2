'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { FirebaseImage } from '@/app/page';
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
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden border-none shadow-2xl rounded-none sm:rounded-none bg-background">
        <div className="w-full">
          <div className="w-full aspect-video bg-black">
            {videoPath ? (
              <FirebaseStorageVideo
                path={videoPath}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground text-[12pt] font-normal">
                Could not determine video path.
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-background">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-normal text-[12pt] tracking-widest text-foreground uppercase m-0 p-0">
                {image.alt}
              </DialogTitle>
              <DialogDescription className="text-[12pt] text-muted-foreground font-normal leading-relaxed m-0 p-0">
                {image.description || "This video shows the kinetic sculpture's mesmerizing movement."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
