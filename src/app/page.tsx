'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<ImagePlaceholder | null>(null);

  return (
    <div className="bg-background">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {PlaceHolderImages.map((image, index) => (
            <div key={image.id} className="break-inside-avoid">
              <Button
                variant="ghost"
                className="p-0 h-auto w-full block rounded-lg overflow-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setSelectedImage(image)}
                aria-label={`View ${image.description}`}
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-0">
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      width={500}
                      height={parseInt(image.imageUrl.split('/').pop() || '600', 10)}
                      className="w-full h-auto"
                      data-ai-hint={image.imageHint}
                      priority={index < 4}
                    />
                  </CardContent>
                </Card>
              </Button>
            </div>
          ))}
        </div>
        {selectedImage && (
          <VideoPlayerModal
            image={selectedImage}
            isOpen={!!selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </main>
    </div>
  );
}
