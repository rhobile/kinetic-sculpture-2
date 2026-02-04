'use client';

import { useState, useEffect } from 'react';
import { getStorage, ref, listAll } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { Skeleton } from '@/components/ui/skeleton';
import type { FirebaseImage } from '@/lib/firebase-images';
import { EXCLUDED_IMAGES, SCULPTURE_DESCRIPTIONS } from '@/lib/constants';

export default function Home() {
  const app = useFirebaseApp();
  const [images, setImages] = useState<FirebaseImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<FirebaseImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<{ images: number, videos: number, matches: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGalleryData() {
      if (!app) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const storage = getStorage(app);
        
        // 1. Fetch available videos
        const videoListRef = ref(storage, 'menu-videos/');
        const videoRes = await listAll(videoListRef);
        const availableVideoNames = new Set(
          videoRes.items.map(item => item.name.split('.').slice(0, -1).join('.').toLowerCase())
        );

        // 2. Fetch available images
        const listRef = ref(storage, 'menu-images/');
        const res = await listAll(listRef);
        
        // 3. Filter and map images
        const filteredItems = res.items.filter(item => {
          const lowerName = item.name.toLowerCase();
          const isJpg = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
          const fileNameWithoutExt = item.name.split('.').slice(0, -1).join('.');
          const fileNameLower = fileNameWithoutExt.toLowerCase();
          
          const isExcluded = EXCLUDED_IMAGES.some(excluded => fileNameLower === excluded.toLowerCase());
          const videoExists = availableVideoNames.has(fileNameLower);
          
          return isJpg && !isExcluded && videoExists;
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
        setStatus({
          images: res.items.length,
          videos: videoRes.items.length,
          matches: storageImages.length
        });

        if (storageImages.length === 0) {
          if (res.items.length === 0) {
            setError("No images found in 'menu-images/' folder.");
          } else if (videoRes.items.length === 0) {
            setError(`Found ${res.items.length} images, but no videos found in 'menu-videos/'. Images require a matching .mp4 video to be displayed.`);
          } else {
            setError(`Found ${res.items.length} images and ${videoRes.items.length} videos, but no matching pairs (same filename) were found. Check your file naming.`);
          }
        }
      } catch (err: any) {
        console.error("Error fetching gallery data:", err);
        setError(`Failed to connect to storage: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGalleryData();
  }, [app]);

  const handleImageClick = (image: FirebaseImage) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="w-full">
        {isLoading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-0 p-0">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[2/3] rounded-none border-0" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-md mx-auto">
            <h2 className="text-[14pt] font-normal uppercase tracking-widest mb-4">Gallery Status</h2>
            <p className="text-muted-foreground text-[12pt] font-normal leading-relaxed">
              {error}
            </p>
            <div className="mt-8 pt-8 border-t border-border/50 w-full text-left space-y-2">
              <p className="text-[10pt] uppercase tracking-wider text-muted-foreground">Storage Statistics:</p>
              <div className="flex justify-between text-[11pt]">
                <span>Total Images:</span>
                <span className="font-mono">{status?.images || 0}</span>
              </div>
              <div className="flex justify-between text-[11pt]">
                <span>Total Videos:</span>
                <span className="font-mono">{status?.videos || 0}</span>
              </div>
              <div className="flex justify-between text-[11pt] font-semibold">
                <span>Displayable Matches:</span>
                <span className="font-mono">{status?.matches || 0}</span>
              </div>
            </div>
            <p className="text-muted-foreground/60 text-[10pt] mt-8 font-normal italic">
              Use the <span className="underline italic">Manage Gallery</span> page to verify and synchronize your uploads.
            </p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-0 p-0">
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
                      className="w-full h-auto block transition-opacity group-hover:opacity-90 rounded-none"
                    />
                  </CardContent>
                </Card>
              </div>
            ))}
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
