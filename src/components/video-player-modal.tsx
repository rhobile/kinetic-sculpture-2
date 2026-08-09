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
 * Gallery Modal with tightened vertical spacing for mobile.
 * Optimized title font size (9pt) to ensure single-line display.
 */
export const VideoPlayerModal = memo(function VideoPlayerModal({ image, isOpen, onClose }: VideoPlayerModalProps) {
  const videoPath = useMemo(() => {
    // Resolve path to ks-videos/ folder
    const filename = image.id.toLowerCase().trim();
    if (!filename) return '';
    return `ks-videos/${filename}.mp4`;
  }, [image.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full p-0 overflow-hidden border-none shadow-2xl rounded-none bg-black focus:outline-none flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden min-h-[200px]">
            {videoPath ? (
              <FirebaseStorageVideo
                path={videoPath}
                className="w-full h-full max-h-[70vh] object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground text-[12pt] font-normal">
                Could not load video from ks-videos/.
              </div>
            )}
          </div>
          <div className="px-6 py-2 sm:py-2 bg-black border-t border-white/10 shrink-0">
            <DialogHeader className="text-left space-y-0.5">
              <DialogTitle className="font-normal text-[9pt] tracking-[0.2em] uppercase text-white whitespace-nowrap truncate leading-tight">
                {image.alt}
              </DialogTitle>
              <DialogDescription className="text-[11pt] text-white/60 font-normal leading-tight sm:leading-relaxed m-0 p-0 max-w-3xl">
                {image.description || "A balance of form and articulated movement."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
