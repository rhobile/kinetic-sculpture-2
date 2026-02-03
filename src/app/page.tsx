'use client';

import { useState, useEffect } from 'react';
import { getStorage, ref, listAll } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { Skeleton } from '@/components/ui/skeleton';

// Descriptions for specific sculptures
const SCULPTURE_DESCRIPTIONS: Record<string, string> = {
  'bikeshedtrio': "Three rectangular section polished aluminium elements on larch battened out-building. The elements reflect the larch verticals as they turn.",
  'arclinedot': "A delicate balance of form and movement, catching the subtlest breeze.",
};

const EXCLUDED_IMAGES = ['helix', 'polished-rhobile_on', 'limetree', 'chopsticksmurfitts2', 'chopstxsap12_on', 'dashcube', 'bubbles_on'];

export type FirebaseImage = {
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
        
        // Filter to only include .jpg and .jpeg files, and exclude specific names
        const filteredItems = res.items.filter(item => {
          const lowerName = item.name.toLowerCase();
          const isJpg = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
          const fileNameWithoutExt = lowerName.split('.').slice(0, -1).join('.');
          const isExcluded = EXCLUDED_IMAGES.some(excluded => fileNameWithoutExt === excluded.toLowerCase());
          return isJpg && !isExcluded;
        });

        const storageImages: FirebaseImage[] = filteredItems.map((item, index) => {
          const fileName = item.name.split('.').slice(0, -1).join('.');
          const normalizedKey = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          const displayTitle = fileName
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());

          return {
            id: item.fullPath,
            path: item.fullPath,
            alt: displayTitle,
            description: SCULPTURE_DESCRIPTIONS[normalizedKey],
            width: 500,
            height: index % 2 === 0 ? 600 : 750,
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
      <div className="bg-background min-h-screen p-0">
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-0">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[2/3] rounded-none" />
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
                className="break-inside-avoid cursor-pointer group"
                onClick={() => handleImageClick(image)}
              >
                <Card className="overflow-hidden border-0 rounded-none shadow-none">
                  <CardContent className="p-0">
                    <FirebaseStorageImage
                      path={image.path}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      className="w-full h-auto block transition-opacity group-hover:opacity-90"
                    />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <p className="text-muted-foreground text-[12pt] font-normal">
              No .jpg images found in your 'menu-images/' folder.
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
