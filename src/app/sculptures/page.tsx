
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { collection } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { Skeleton } from '@/components/ui/skeleton';
import type { FirebaseImage } from '@/lib/firebase-images';

export default function SculpturesListPage() {
  const { firebaseApp, firestore } = useFirebase();
  const [storageItems, setStorageItems] = useState<{ images: any[], videos: Set<string> } | null>(null);
  const [selectedImage, setSelectedImage] = useState<FirebaseImage | null>(null);
  const [isStorageLoading, setIsStorageLoading] = useState(true);

  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'videos');
  }, [firestore]);
  const { data: firestoreVideos } = useCollection(videosQuery);

  useEffect(() => {
    async function fetchStorageData() {
      if (!firebaseApp) return;
      setIsStorageLoading(true);
      try {
        const storage = getStorage(firebaseApp);
        const vidRes = await listAll(storageRef(storage, 'ks-videos'));
        const availableVideoNames = new Set(vidRes.items.map(item => item.name.split('.').slice(0, -1).join('.').toLowerCase()));
        const imgRes = await listAll(storageRef(storage, 'ks-images'));
        setStorageItems({ images: imgRes.items, videos: availableVideoNames });
      } catch (err) {
        console.error("Storage fetch failed", err);
      } finally {
        setIsStorageLoading(false);
      }
    }
    fetchStorageData();
  }, [firebaseApp]);

  const listItems = useMemo(() => {
    if (!storageItems) return [];
    return storageItems.images
      .filter(item => {
        const name = item.name.split('.').slice(0, -1).join('.').toLowerCase();
        return storageItems.videos.has(name);
      })
      .map(item => {
        const name = item.name.split('.').slice(0, -1).join('.').toLowerCase();
        const normalizedKey = name.replace(/[^a-z0-9]/g, '');
        const fsData = firestoreVideos?.find(v => v.id === normalizedKey);
        
        return {
          id: item.fullPath,
          path: item.fullPath,
          alt: fsData?.title || name.replace(/[-_]/g, ' '),
          description: fsData?.description || '',
          order: fsData?.order ?? 999,
          width: 800,
          height: 800
        };
      })
      .sort((a, b) => a.order - b.order);
  }, [storageItems, firestoreVideos]);

  return (
    <div className="bg-background min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-normal mb-10 tracking-widest uppercase border-b border-border/50 pb-6">
            Index of Sculptures
          </h1>
          
          <div className="space-y-20">
            {isStorageLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <Skeleton className="aspect-square rounded-none" />
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </div>
              ))
            ) : listItems.length > 0 ? (
              listItems.map((image) => (
                <article 
                  key={image.id} 
                  className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start group cursor-pointer"
                  onClick={() => setSelectedImage(image as any)}
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
              <p className="text-[12pt] text-muted-foreground italic">No matched sculptures found.</p>
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
