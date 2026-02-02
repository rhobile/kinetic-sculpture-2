'use client';

import { useState } from 'react';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Card, CardContent } from '@/components/ui/card';
import { FirebaseImages, type FirebaseImage } from '@/lib/firebase-images';
import { VideoPlayerModal } from '@/components/video-player-modal';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<FirebaseImage | null>(null);

  const handleImageClick = (image: FirebaseImage) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="bg-background">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {FirebaseImages.map((image) => (
            <div
              key={image.id}
              className="break-inside-avoid cursor-pointer"
              onClick={() => handleImageClick(image)}
            >
              <Card className="overflow-hidden transition-shadow duration-300 rounded-lg hover:shadow-xl">
                <CardContent className="p-0">
                  <FirebaseStorageImage
                    path={image.path}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    className="w-full h-auto"
                  />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </main>
      {selectedImage && (
        <VideoPlayerModal
          image={selectedImage}
          isOpen={!!selectedImage}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
