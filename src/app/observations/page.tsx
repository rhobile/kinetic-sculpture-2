'use client';

import { useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { cn } from '@/lib/utils';

/**
 * Observations Page for Rhobile.
 * Consistent dark theme and mobile portrait title wrapping.
 */
export default function ObservationsPage() {
  const { firestore } = useFirebase();
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const obsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'observations'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: observations, isLoading } = useCollection(obsQuery);

  const resolveImagePath = (path: string) => {
    if (!path) return '';
    return path.startsWith('ks-images/') ? path : `ks-images/${path}`;
  };

  const handleVideoSelect = (item: any) => {
    const fullImagePath = resolveImagePath(item.imagePath);
    setSelectedVideo({
      id: item.videoId,
      title: item.title,
      path: fullImagePath || `ks-images/${item.videoId}.jpg`,
      description: item.content
    });
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-normal mb-8 tracking-widest border-b border-white/10 pb-6 uppercase">Flow observations of wind and water</h1>
          
          <div className="space-y-16">
            {isLoading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                  <Skeleton className="aspect-square md:col-span-1 bg-white/5" />
                  <div className="md:col-span-3 space-y-4">
                    <Skeleton className="h-4 w-20 bg-white/5" />
                    <Skeleton className="h-6 w-3/4 bg-white/5" />
                    <Skeleton className="h-20 w-full bg-white/5" />
                  </div>
                </div>
              ))
            ) : observations && observations.length > 0 ? (
              observations.map((item) => {
                const fullImagePath = resolveImagePath(item.imagePath);
                return (
                  <article key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                    <div className="md:col-span-1">
                      <div 
                        className={cn(
                          "aspect-square relative overflow-hidden rounded-none border border-white/10 bg-neutral-900",
                          item.videoId && "cursor-pointer hover:opacity-90 transition-opacity"
                        )}
                        onClick={() => item.videoId && handleVideoSelect(item)}
                      >
                        {item.imagePath ? (
                          <FirebaseStorageImage
                            path={fullImagePath}
                            alt={item.title}
                            width={400}
                            height={400}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 p-4 text-center text-[10px] uppercase tracking-widest">
                            No Image
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-3">
                      <div className="space-y-1">
                        <p className="text-[12px] tracking-widest text-white/40 uppercase">{item.date}</p>
                        <h2 className="text-[14pt] font-normal tracking-wide leading-tight break-words whitespace-normal uppercase">
                          {item.title}
                        </h2>
                      </div>
                      <p className="text-[12pt] text-white/70 leading-relaxed font-light whitespace-pre-wrap max-w-none">
                        {item.content}
                      </p>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-[12px] text-white/30 italic font-normal">No flow observations at this time.</p>
            )}
          </div>
        </div>
      </main>

      {selectedVideo && (
        <VideoPlayerModal
          image={{
            id: selectedVideo.id,
            path: selectedVideo.path,
            alt: selectedVideo.title,
            description: selectedVideo.description,
            width: 800,
            height: 600,
          }}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
