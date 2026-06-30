'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Info } from 'lucide-react';
import type { FirebaseImage } from '@/lib/firebase-images';
import { EXCLUDED_IMAGES } from '@/lib/constants';

export default function Home() {
  const { firebaseApp, firestore } = useFirebase();
  const [storageItems, setStorageItems] = useState<{ items: any[] } | null>(null);
  const [selectedImage, setSelectedImage] = useState<FirebaseImage | null>(null);
  const [isStorageLoading, setIsStorageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firestore Data: Curated items
  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'videos'), orderBy('order', 'asc'));
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
      // Force connection to the new bucket
      const storage = getStorage(firebaseApp, 'gs://ks-bucket-nl');
      const imgRes = await listAll(storageRef(storage, 'ks-images'));
      
      const filteredImages = imgRes.items.filter(item => {
        const lowerName = item.name.toLowerCase();
        const isJpg = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
        const fileNameLower = item.name.split('.').slice(0, -1).join('.').toLowerCase();
        return isJpg && !EXCLUDED_IMAGES.includes(fileNameLower);
      });

      setStorageItems({ items: filteredImages });
    } catch (err: any) {
      console.error("Gallery storage error:", err);
      setError('Failed to connect to storage. Please check your internet connection or bucket settings.');
    } finally {
      setIsStorageLoading(false);
    }
  }, [firebaseApp]);

  useEffect(() => {
    fetchStorageData();
  }, [fetchStorageData]);

  const galleryImages = useMemo(() => {
    if (!storageItems) return [];

    // Fallback: Show ALL storage items if Firestore is empty or still loading
    if (!firestoreVideos || firestoreVideos.length === 0) {
      return storageItems.items.map((item, index) => ({
        id: item.name.split('.').slice(0, -1).join('.').toLowerCase(),
        path: item.fullPath,
        alt: item.name.split('.').slice(0, -1).join('.').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: "A balance of form and articulated movement.",
        width: 500,
        height: index % 2 === 0 ? 600 : 750,
      } as FirebaseImage));
    }

    // Curated: Show items indexed in Firestore (that aren't hidden)
    const curated = firestoreVideos
      .filter(fs => !fs.hidden)
      .map((fsData, index) => {
        const storageMatch = storageItems.items.find(item => 
          item.name.split('.').slice(0, -1).join('.').toLowerCase().trim() === fsData.id.toLowerCase().trim()
        );

        if (!storageMatch) return null;

        return {
          id: fsData.id,
          path: storageMatch.fullPath,
          alt: fsData.title || fsData.id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: fsData.description || "A balance of form and articulated movement.",
          width: 500,
          height: index % 2 === 0 ? 600 : 750,
        } as FirebaseImage;
      }).filter((img): img is FirebaseImage => img !== null);

    // If curation resulted in 0 items (e.g. broken IDs), fallback to all images
    return curated.length > 0 ? curated : storageItems.items.map((item, index) => ({
        id: item.name.split('.').slice(0, -1).join('.').toLowerCase(),
        path: item.fullPath,
        alt: item.name.split('.').slice(0, -1).join('.').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: "A balance of form and articulated movement.",
        width: 500,
        height: index % 2 === 0 ? 600 : 750,
      } as FirebaseImage));
  }, [storageItems, firestoreVideos]);

  return (
    <div className="bg-background min-h-screen">
      <main className="w-full">
        {(isStorageLoading) ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-0 p-0">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[2/3] rounded-none border-[0.5px] border-white" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-md mx-auto">
            <h2 className="text-[14pt] font-normal uppercase tracking-widest mb-4 text-destructive">Connection Error</h2>
            <p className="text-muted-foreground text-[11pt] font-normal mb-6">{error}</p>
            <Button onClick={fetchStorageData} variant="outline" className="rounded-none">
              <RefreshCw className="size-4 mr-2" /> Retry Connection
            </Button>
          </div>
        ) : galleryImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <p className="text-muted-foreground text-[11pt] italic font-normal mb-6">
              No images found in ks-images/ folder of gs://ks-bucket-nl.
            </p>
            <Button onClick={fetchStorageData} variant="outline" className="rounded-none">
              <RefreshCw className="size-4 mr-2" /> Refresh Storage
            </Button>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-0 p-0">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="break-inside-avoid cursor-pointer group relative"
                onClick={() => setSelectedImage(image)}
              >
                <Card className="overflow-hidden border-[0.5px] border-white rounded-none shadow-none">
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
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
