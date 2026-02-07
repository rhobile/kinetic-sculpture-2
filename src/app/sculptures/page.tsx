
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { collection } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { Skeleton } from '@/components/ui/skeleton';
import type { FirebaseImage } from '@/lib/firebase-images';
import { EXCLUDED_IMAGES, SCULPTURE_DESCRIPTIONS } from '@/lib/constants';

export default function SculpturesListPage() {
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
          throw vidErr;
        }
        
        // List images
        const imageListRef = storageRef(storage, 'ks-images');
        const imageRes = await listAll(imageListRef);
        
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
      } catch (err: any) {
        console.error("Error fetching storage data:", err);
        setError(err.message || 'Failed to connect to storage.');
      } finally {
        setIsStorageLoading(false);
      }
    }

    fetchStorageData();
  }, [firebaseApp]);

  const galleryImages = useMemo(() => {
    if (!storageItems) return [];

    const mapped = storageItems.images.map((item, index) => {
      const fileName = item.name.split('.').slice(0, -1).join('.');
      const normalizedKey = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fsData = firestoreVideos?.find(v => v.id === normalizedKey);

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
        width: 600,
        height: 600,
      } as FirebaseImage & { order: number };
    });

    return [...mapped].sort((a, b) => a.order - b.order);
  }, [storageItems, firestoreVideos]);

  return (
    <div className="bg-background min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-normal mb-10 tracking-widest uppercase border-b border-border/50 pb-6">
            Sculptures
          </h1>
          
          <div className="space-y-20">
            {isStorageLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                  <Skeleton className="aspect-square rounded-none" />
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </div>
              ))
            ) : galleryImages.length > 0 ? (
              galleryImages.map((image) => (
                <article 
                  key={image.id} 
                  className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start group cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted border border-border/50">
                    <FirebaseStorageImage
                      path={image.path}
                      alt={image.alt}
                      width={800}
                      height={800}
                      className="object-cover w-full h-full transition-opacity group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </div>
                  <div className="space-y-4 pt-2">
                    <h2 className="text-[14pt] font-normal tracking-[0.1em] border-b border-border/20 pb-4">
                      {image.alt}
                    </h2>
                    <p className="text-[12pt] text-foreground/80 leading-relaxed font-normal whitespace-pre-wrap">
                      {image.description || "A balance of form and articulated movement, responding to the natural flow of the wind."}
                    </p>
                    <p className="text-[10pt] uppercase tracking-widest text-accent font-medium pt-4">
                      View Video &rarr;
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-[12pt] text-muted-foreground italic">No sculptures found.</p>
            )}
          </div>
        </div>
      </main>

      {selectedImage && (
        <VideoPlayerModal
          image={selectedImage}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
