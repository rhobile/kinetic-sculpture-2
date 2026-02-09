'use client';

import { useMemo, memo } from 'react';
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

export const VideoPlayerModal = memo(function VideoPlayerModal({ image, isOpen, onClose }: VideoPlayerModalProps) {
  const videoPath = useMemo(() => {
    const filename = image.path.split('/').pop()?.split('.').slice(0, -1).join('.');
    if (!filename) return '';
    return `ks-videos/${filename}.mp4`;
  }, [image.path]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full p-0 overflow-hidden border-none shadow-2xl rounded-none bg-black focus:outline-none flex flex-col max-h-[90vh]">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden min-h-[300px]">
            {videoPath ? (
              <FirebaseStorageVideo
                path={videoPath}
                posterPath={image.path}
                className="w-full h-full max-h-[65vh] object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground text-[12pt] font-normal">
                Could not determine video path.
              </div>
            )}
          </div>
          <div className="px-4 sm:px-6 py-8 bg-black border-t border-white/10 shrink-0">
            <DialogHeader className="space-y-4 text-left">
              <DialogTitle className="font-normal text-[14pt] tracking-[0.15em] text-white m-0 p-0 leading-tight">
                {image.alt}
              </DialogTitle>
              <DialogDescription className="text-[11pt] sm:text-[12pt] text-white/70 font-normal leading-relaxed m-0 p-0 max-w-2xl">
                {image.description || "A balance of form and articulated movement, responding to the natural flow of the wind."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
