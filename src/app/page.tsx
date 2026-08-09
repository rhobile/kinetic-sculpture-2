
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
import { RefreshCw } from 'lucide-react';
import type { FirebaseImage } from '@/lib/firebase-images';
import { EXCLUDED_IMAGES } from '@/lib/constants';

/**
 * Main Gallery Page.
 * Pulls thumbnails from 'ks-images/'.
 */
export default function Home() {
  const { firebaseApp, firestore } = useFirebase();
  const [storageItems, setStorageItems] = useState<{ items: any[] } | null>(null);
  const [selectedImage, setSelectedImage] = useState<FirebaseImage | null>(null);
  const [isStorageLoading, setIsStorageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const storage = getStorage(firebaseApp, 'gs://ks-bucket-nl');
      // Fetch from ks-images/
      const res = await listAll(storageRef(storage, 'ks-images'));
      
      const filteredImages = res.items.filter(item => {
        const name = item.name.toLowerCase();
        const isImg = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png');
        const fileNameLower = item.name.split('.').slice(0, -1).join('.').toLowerCase();
        return isImg && !EXCLUDED_IMAGES.includes(fileNameLower);
      });

      setStorageItems({ items: filteredImages });
    } catch (err: any) {
      console.error("Gallery storage error:", err);
      setError('Failed to connect to storage. Check folder permissions.');
    } finally {
      setIsStorageLoading(false);
    }
  }, [firebaseApp]);

  useEffect(() => {
    fetchStorageData();
  }, [fetchStorageData]);

  const galleryImages = useMemo(() => {
    if (!storageItems) return [];

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
              No images found in ks-images/ folder.
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
