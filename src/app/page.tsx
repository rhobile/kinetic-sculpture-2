'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { collection, query } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { Skeleton } from '@/components/ui/skeleton';
import type { FirebaseImage } from '@/lib/firebase-images';
import { EXCLUDED_IMAGES } from '@/lib/constants';

export default function Home() {
  const { firebaseApp, firestore } = useFirebase();
  const [storageItems, setStorageItems] = useState<{ images: any[], videos: Set<string> } | null>(null);
  const [selectedImage, setSelectedImage] = useState<FirebaseImage | null>(null);
  const [isStorageLoading, setIsStorageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firestore Data: The curation source
  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'videos');
  }, [firestore]);
  const { data: firestoreVideos, isLoading: isFsLoading } = useCollection(videosQuery);

  const fetchStorageData = useCallback(async () => {
    if (!firebaseApp) {
      setIsStorageLoading(false);
      return;
    }
    
    setIsStorageLoading(true);
    setError(null);
    try {
      const storage = getStorage(firebaseApp);
      
      const [imgRes, vidRes] = await Promise.all([
        listAll(storageRef(storage, 'ks-images')),
        listAll(storageRef(storage, 'ks-videos'))
      ]);

      const availableVideoNames = new Set(
        vidRes.items.map(item => item.name.split('.').slice(0, -1).join('.').toLowerCase())
      );
      
      const filteredImages = imgRes.items.filter(item => {
        const lowerName = item.name.toLowerCase();
        const isJpg = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
        const fileNameLower = item.name.split('.').slice(0, -1).join('.').toLowerCase();
        return isJpg && !EXCLUDED_IMAGES.includes(fileNameLower);
      });

      setStorageItems({
        images: filteredImages,
        videos: availableVideoNames
      });

    } catch (err: any) {
      console.error("Gallery initialization error:", err);
      setError('Failed to connect to gallery storage.');
    } finally {
      setIsStorageLoading(false);
    }
  }, [firebaseApp]);

  useEffect(() => {
    fetchStorageData();
  }, [fetchStorageData]);

  // Only show images that exist in Firestore (Curated List)
  const galleryImages = useMemo(() => {
    if (!storageItems || !firestoreVideos) return [];

    const mapped = storageItems.images
      .map((item, index) => {
        const fileName = item.name.split('.').slice(0, -1).join('.');
        const normalizedKey = fileName.toLowerCase();
        
        // Find metadata
        const fsData = firestoreVideos.find(v => v.id === normalizedKey);
        if (!fsData) return null;

        return {
          id: normalizedKey,
          path: item.fullPath,
          alt: fsData.title || fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: fsData.description || "A balance of form and articulated movement.",
          order: fsData.order !== undefined ? Number(fsData.order) : 999,
          width: 500,
          height: index % 2 === 0 ? 600 : 750,
        } as FirebaseImage & { order: number };
      })
      .filter((img): img is (FirebaseImage & { order: number }) => img !== null);

    return [...mapped].sort((a, b) => a.order - b.order);
  }, [storageItems, firestoreVideos]);

  const handleImageClick = (image: any) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="w-full">
        {(isStorageLoading || isFsLoading) ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-0 p-0">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[2/3] rounded-none border-0" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-md mx-auto">
            <h2 className="text-[14pt] font-normal uppercase tracking-widest mb-4 text-destructive">Gallery Error</h2>
            <p className="text-muted-foreground text-[11pt] font-normal">{error}</p>
          </div>
        ) : galleryImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <p className="text-muted-foreground text-[11pt] italic">The gallery is currently being curated. Please check back soon.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-0 p-0">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="break-inside-avoid cursor-pointer group relative"
                onClick={() => handleImageClick(image)}
              >
                <Card className="overflow-hidden border-0 rounded-none shadow-none">
                  <CardContent className="p-0">
                    <div className="relative">
                      <FirebaseStorageImage
                        path={image.path}
                        alt={image.alt}
                        width={image.width}
                        height={image.height}
                        className="w-full h-auto block transition-opacity group-hover:opacity-90 rounded-none"
                      />
                    </div>
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
