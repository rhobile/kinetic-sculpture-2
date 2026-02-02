'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<ImagePlaceholder | null>(null);

  return (
    <div className="bg-background">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="columns-4 gap-0 space-y-0">
          <div className="break-inside-avoid">
            <Card className="overflow-hidden transition-shadow duration-300 rounded-none border-0 shadow-none">
              <CardContent className="p-0">
                <FirebaseStorageImage
                  path="menu-images/arclinedot.jpg"
                  alt="Arc Line Dot sculpture from Firebase Storage"
                  width={500}
                  height={600}
                  className="w-full h-auto"
                />
              </CardContent>
            </Card>
          </div>
          {PlaceHolderImages.map((image, index) => (
            <div key={image.id} className="break-inside-avoid">
              <Button
                variant="ghost"
                className="p-0 h-auto w-full block overflow-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-none"
                onClick={() => setSelectedImage(image)}
                aria-label={`View ${image.description}`}
              >
                <Card className="overflow-hidden transition-shadow duration-300 rounded-none border-0 shadow-none">
                  <CardContent className="p-0">
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      width={500}
                      height={600}
                      className="w-full h-auto"
                      data-ai-hint={image.imageHint}
                      priority={index < 8}
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
