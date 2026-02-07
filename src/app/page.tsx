
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { collection } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { Skeleton } from '@/components/ui/skeleton';
import type { FirebaseImage } from '@/lib/firebase-images';
import { EXCLUDED_IMAGES, SCULPTURE_DESCRIPTIONS } from '@/lib/constants';

export default function Home() {
  const { firebaseApp, firestore } = useFirebase();
  const [storageItems, setStorageItems] = useState<{ images: any[], videos: Set<string> } | null>(null);
  const [selectedImage, setSelectedImage] = useState<FirebaseImage | null>(null);
  const [isStorageLoading, setIsStorageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firestore Descriptions and Ordering
  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'videos');
  }, [firestore]);
  const { data: firestoreVideos } = useCollection(videosQuery);

  // Fetch Storage items once or when firebaseApp changes
  useEffect(() => {
    async function fetchStorageData() {
      if (!firebaseApp) {
        setIsStorageLoading(false);
        return;
      }
      
      setIsStorageLoading(true);
      setError(null);
      try {
        const storage = getStorage(firebaseApp);
        
        // List videos to find matches
        const videoListRef = storageRef(storage, 'ks-videos');
        let availableVideoNames = new Set<string>();
        try {
          const videoRes = await listAll(videoListRef);
          availableVideoNames = new Set(
            videoRes.items.map(item => item.name.split('.').slice(0, -1).join('.').toLowerCase())
          );
        } catch (vidErr: any) {
          console.error("Error listing ks-videos:", vidErr);
          if (vidErr.code === 'storage/unauthorized') {
            throw new Error("Permission denied for 'ks-videos'. Check your Storage rules.");
          }
          throw vidErr;
        }
        
        // List images
        const imageListRef = storageRef(storage, 'ks-images');
        let imageRes;
        try {
          imageRes = await listAll(imageListRef);
        } catch (imgErr: any) {
          console.error("Error listing ks-images:", imgErr);
          throw imgErr;
        }
        
        const filteredItems = imageRes.items.filter(item => {
          const lowerName = item.name.toLowerCase();
          const isJpg = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
          const fileNameLower = item.name.split('.').slice(0, -1).join('.').toLowerCase();
          
          const isExcluded = EXCLUDED_IMAGES.some(excluded => fileNameLower === excluded.toLowerCase());
          const videoExists = availableVideoNames.has(fileNameLower);
          
          return isJpg && !isExcluded && videoExists;
        });

        setStorageItems({
          images: filteredItems,
          videos: availableVideoNames
        });

        if (filteredItems.length === 0) {
          if (imageRes.items.length === 0) {
            setError("No images found in 'ks-images/'.");
          } else if (availableVideoNames.size === 0) {
            setError(`Found ${imageRes.items.length} images, but no videos found in 'ks-videos/'.`);
          } else {
            setError(`No matching filenames found between 'ks-images' and 'ks-videos'.`);
          }
        }
      } catch (err: any) {
        console.error("Error fetching storage data:", err);
        setError(err.message || 'Failed to connect to storage.');
      } finally {
        setIsStorageLoading(false);
      }
    }

    fetchStorageData();
  }, [firebaseApp]);

  // Combine Storage and Firestore data reactively
  const galleryImages = useMemo(() => {
    if (!storageItems) return [];

    const mapped = storageItems.images.map((item, index) => {
      const fileName = item.name.split('.').slice(0, -1).join('.');
      const normalizedKey = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Match with Firestore data for titles, descriptions, custom ordering, and visibility
      const fsData = firestoreVideos?.find(v => v.id === normalizedKey);

      // If marked as hidden in Firestore, exclude it from the gallery
      if (fsData?.hidden) return null;

      const displayTitle = fsData?.title || fileName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      const description = fsData?.description || SCULPTURE_DESCRIPTIONS[normalizedKey];
      const order = fsData?.order !== undefined ? Number(fsData.order) : 999;

      return {
        id: item.fullPath,
        path: item.fullPath,
        alt: displayTitle,
        description: description,
        order: order,
        width: 500,
        height: index % 2 === 0 ? 600 : 750,
      } as FirebaseImage & { order: number };
    }).filter(img => img !== null);

    // Sort images based on the 'order' property set in Manage dashboard
    return [...mapped].sort((a, b) => a.order - b.order);
  }, [storageItems, firestoreVideos]);

  const handleImageClick = (image: FirebaseImage) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="w-full">
        {isStorageLoading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-0 p-0">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[2/3] rounded-none border-0" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-md mx-auto">
            <h2 className="text-[14pt] font-normal uppercase tracking-widest mb-4 text-destructive">Gallery Status</h2>
            <p className="text-muted-foreground text-[11pt] font-normal leading-relaxed">
              {error}
            </p>
            <div className="mt-8 pt-8 border-t border-border/50 w-full text-left space-y-3">
              <p className="text-[10pt] uppercase tracking-wider text-muted-foreground font-semibold">Troubleshooting:</p>
              <ul className="text-[10pt] text-muted-foreground space-y-2 list-disc pl-4 font-normal">
                <li>Ensure matching filenames (e.g. 'art.jpg' and 'art.mp4').</li>
                <li>Check the <a href="/manage" className="text-accent underline">Manage Gallery</a> dashboard to set ordering.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-0 p-0">
            {galleryImages.map((image) => (
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
