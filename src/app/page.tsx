'use client';

import { useState, useEffect } from 'react';
import { getStorage, ref, listAll } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { Skeleton } from '@/components/ui/skeleton';

// Type for images found in storage
type FirebaseImage = {
  id: string;
  path: string;
  alt: string;
  description?: string;
  width: number;
  height: number;
};

export default function Home() {
  const app = useFirebaseApp();
  const [images, setImages] = useState<FirebaseImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<FirebaseImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      if (!app) return;
      
      setIsLoading(true);
      try {
        const storage = getStorage(app);
        const listRef = ref(storage, 'menu-images/');
        const res = await listAll(listRef);
        
        const storageImages: FirebaseImage[] = res.items.map((item, index) => {
          // Clean up the name for display (remove extension, replace dashes/underscores with spaces)
          const fileName = item.name.split('.').slice(0, -1).join('.');
          const displayTitle = fileName
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());

          return {
            id: item.fullPath,
            path: item.fullPath,
            alt: displayTitle,
            width: 500, // Default width for masonry
            height: index % 2 === 0 ? 600 : 750, // Staggered heights for masonry effect
          };
        });

        setImages(storageImages);
      } catch (error) {
        console.error("Error listing images from storage:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchImages();
  }, [app]);

  const handleImageClick = (image: FirebaseImage) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen p-4">
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-0">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[2/3] mb-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <main>
        {images.length > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-0">
            {images.map((image) => (
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
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <p className="text-muted-foreground text-[12pt]">
              No images found in your 'menu-images/' folder.
            </p>
            <p className="text-muted-foreground text-[10pt] mt-2">
              Upload .jpg files to this folder in the Firebase Console to see them here.
            </p>
          </div>
        )}
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
