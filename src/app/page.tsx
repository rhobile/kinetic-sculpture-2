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
      <main>
        <div className="columns-2 min-[600px]:columns-3 lg:columns-4 gap-0">
          {FirebaseImages.map((image) => (
            <div
              key={image.id}
              className="break-inside-avoid cursor-pointer"
              onClick={() => handleImageClick(image)}
            >
              <Card className="overflow-hidden border-0 rounded-none shadow-none">
                <CardContent className="p-0">
                  <FirebaseStorageImage
                    path={image.path}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    className="w-full h-auto block"
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
