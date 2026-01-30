'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

interface VideoPlayerModalProps {
  image: ImagePlaceholder;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ image, isOpen, onClose }: VideoPlayerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] p-0">
        <div className="md:grid md:grid-cols-2">
          <div className="relative aspect-[4/5] h-[60vh] md:h-auto md:aspect-auto">
            <Image
              src={image.imageUrl}
              alt={image.description}
              fill
              className="object-cover md:rounded-l-lg rounded-t-lg md:rounded-t-none"
              data-ai-hint={image.imageHint}
            />
          </div>
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <DialogHeader>
              <DialogTitle className="font-headline text-3xl mb-2">{image.description}</DialogTitle>
              <DialogDescription className="text-base">
                This is where a video player would be, showing the kinetic sculpture in motion. For now, enjoy this beautiful placeholder image. Imagine the gentle, mesmerizing movement and the subtle sounds it might make.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-4">
              Category: <span className="text-foreground font-medium">{image.imageHint}</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
