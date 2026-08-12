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

/**
 * Gallery Modal with light theme (white background, black text).
 * Titles wrap to a second line instead of being cut off.
 * Vertical spacing tightened for a sleek look.
 */
export const VideoPlayerModal = memo(function VideoPlayerModal({ image, isOpen, onClose }: VideoPlayerModalProps) {
  const videoPath = useMemo(() => {
    const filename = image.id.toLowerCase().trim();
    if (!filename) return '';
    return `ks-videos/${filename}.mp4`;
  }, [image.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full p-0 overflow-hidden border-none shadow-2xl rounded-none bg-background text-foreground focus:outline-none flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden min-h-[200px]">
            {videoPath ? (
              <FirebaseStorageVideo
                path={videoPath}
                className="w-full h-full max-h-[70vh] object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4 text-center text-foreground/50 text-[12pt] font-normal">
                Could not load video.
              </div>
            )}
          </div>
          <div className="px-6 py-2 bg-background border-t border-border shrink-0">
            <DialogHeader className="text-left space-y-0 text-foreground">
              <DialogTitle className="font-normal text-[9pt] tracking-[0.2em] uppercase leading-tight break-words whitespace-normal">
                {image.alt}
              </DialogTitle>
              <DialogDescription className="text-[11pt] text-foreground/60 font-normal leading-tight mt-0.5 max-w-3xl">
                {image.description || "A balance of form and articulated movement."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
