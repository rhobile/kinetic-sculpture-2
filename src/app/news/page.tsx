'use client';

import { useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { VideoPlayerModal } from '@/components/video-player-modal';

export default function NewsPage() {
  const { firestore } = useFirebase();
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: newsItems, isLoading } = useCollection(newsQuery);

  const resolveImagePath = (path: string) => {
    if (!path) return '';
    return path.startsWith('ks-images/') ? path : `ks-images/${path}`;
  };

  const resolveVideoPath = (videoId: string, imagePath?: string) => {
    if (!videoId) return '';
    // If videoId is a path, return it, otherwise build it
    const cleanId = videoId.split('/').pop()?.split('.')[0] || videoId;
    return `ks-videos/${cleanId}.mp4`;
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-normal mb-10 tracking-widest uppercase border-b border-border/50 pb-6">News</h1>
          
          <div className="space-y-20">
            {isLoading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                  <Skeleton className="aspect-square md:col-span-1" />
                  <div className="md:col-span-3 space-y-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))
            ) : newsItems && newsItems.length > 0 ? (
              newsItems.map((item) => {
                const fullImagePath = resolveImagePath(item.imagePath);
                return (
                  <article key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                    <div className="md:col-span-1">
                      <div className="aspect-square relative overflow-hidden rounded-none border border-border/50 bg-muted">
                        {item.imagePath ? (
                          <FirebaseStorageImage
                            path={fullImagePath}
                            alt={item.title}
                            width={400}
                            height={400}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground p-4 text-center text-[10px] uppercase tracking-widest">
                            No Image
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-4">
                      <div className="space-y-1">
                        <p className="text-[12px] uppercase tracking-widest text-muted-foreground">{item.date}</p>
                        <h2 className="text-[14pt] font-normal tracking-wide">{item.title}</h2>
                      </div>
                      <p className="text-[12pt] text-foreground/80 leading-relaxed font-normal whitespace-pre-wrap">
                        {item.content}
                      </p>
                      {item.videoId && (
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-none border-accent text-accent hover:bg-accent hover:text-white transition-colors uppercase tracking-[0.2em] text-[10px] h-9 px-6"
                            onClick={() => setSelectedVideo({
                              id: item.videoId,
                              title: item.title,
                              path: fullImagePath || `ks-images/${item.videoId}.jpg`,
                              description: item.content
                            })}
                          >
                            <Play className="size-3 mr-2 fill-current" /> Watch Video
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-[12px] text-muted-foreground italic font-normal">No news updates at this time.</p>
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
