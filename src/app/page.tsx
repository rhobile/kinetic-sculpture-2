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
      if (!app) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const storage = getStorage(app);
        
        // 1. Fetch available videos in the ks-videos folder
        // Use no trailing slash for the list reference to be safer with rules
        const videoListRef = ref(storage, 'ks-videos');
        let videoItems: string[] = [];
        try {
          const videoRes = await listAll(videoListRef);
          videoItems = videoRes.items.map(item => item.name.split('.').slice(0, -1).join('.').toLowerCase());
        } catch (vidErr: any) {
          console.error("Error listing ks-videos:", vidErr);
          if (vidErr.code === 'storage/unauthorized') {
            throw new Error("Permission denied for 'ks-videos'. Security Rules are blocking public listing. Please wait a moment (up to 60s) for the new rules to deploy.");
          }
          throw vidErr;
        }
        
        const availableVideoNames = new Set(videoItems);

        // 2. Fetch available images in the ks-images folder
        const imageListRef = ref(storage, 'ks-images');
        let imageRes;
        try {
          imageRes = await listAll(imageListRef);
        } catch (imgErr: any) {
          console.error("Error listing ks-images:", imgErr);
          if (imgErr.code === 'storage/unauthorized') {
            throw new Error("Permission denied for 'ks-images'. Security Rules are blocking public listing.");
          }
          throw imgErr;
        }
        
        // 3. Filter and map images that have matching videos
        const filteredItems = imageRes.items.filter(item => {
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
          images: imageRes.items.length,
          videos: availableVideoNames.size,
          matches: storageImages.length
        });

        if (storageImages.length === 0) {
          if (imageRes.items.length === 0) {
            setError("No images found in 'ks-images/'. Please upload images (.jpg) to your Cloud Storage bucket.");
          } else if (availableVideoNames.size === 0) {
            setError(`Found ${imageRes.items.length} images, but no videos found in 'ks-videos/'. Each sculpture requires a matching .mp4 file.`);
          } else {
            setError(`Found ${imageRes.items.length} images and ${availableVideoNames.size} videos, but no matching filenames (e.g. 'sculpture1.jpg' and 'sculpture1.mp4') were found.`);
          }
        }
      } catch (err: any) {
        console.error("Error fetching gallery data:", err);
        setError(err.message || 'Failed to connect to storage.');
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
            <p className="text-muted-foreground text-[11pt] font-normal leading-relaxed">
              {error}
            </p>
            <div className="mt-8 pt-8 border-t border-border/50 w-full text-left space-y-3">
              <p className="text-[10pt] uppercase tracking-wider text-muted-foreground font-semibold">Troubleshooting:</p>
              <ul className="text-[10pt] text-muted-foreground space-y-2 list-disc pl-4 font-normal">
                <li>Wait 60 seconds for Storage Rules to deploy globally.</li>
                <li>Refresh this page to re-attempt the connection.</li>
                <li>Check your 'Manage Gallery' dashboard for folder synchronization.</li>
              </ul>
              <div className="pt-4 border-t border-border/20">
                <p className="text-[10pt] uppercase tracking-wider text-muted-foreground font-semibold">Statistics:</p>
                <div className="flex justify-between text-[11pt] mt-1 font-normal">
                  <span>Images (/ks-images):</span>
                  <span className="font-mono">{status?.images || 0}</span>
                </div>
                <div className="flex justify-between text-[11pt] font-normal">
                  <span>Videos (/ks-videos):</span>
                  <span className="font-mono">{status?.videos || 0}</span>
                </div>
                <div className="flex justify-between text-[11pt] font-semibold border-t border-border/10 mt-1 pt-1">
                  <span>Matched Sculptures:</span>
                  <span className="font-mono">{status?.matches || 0}</span>
                </div>
              </div>
            </div>
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