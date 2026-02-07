
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { VideoPlayerModal } from '@/components/video-player-modal';

export default function FlowObservationsPage() {
  const { firestore } = useFirebase();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const observationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'videos'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: observations, isLoading } = useCollection(observationsQuery);

  return (
    <div className="bg-background min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-normal mb-10 tracking-widest uppercase border-b border-border/50 pb-6">
            Flow Observations
          </h1>
          
          <div className="space-y-16">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                  <Skeleton className="aspect-square md:col-span-1" />
                  <div className="md:col-span-3 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))
            ) : observations && observations.length > 0 ? (
              observations.map((item) => (
                <article 
                  key={item.id} 
                  className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start group cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="md:col-span-1">
                    <div className="aspect-square relative overflow-hidden rounded-none border border-border/50 bg-muted">
                      {item.imagePath ? (
                        <FirebaseStorageImage
                          path={item.imagePath}
                          alt={item.title}
                          width={400}
                          height={400}
                          className="object-cover w-full h-full transition-opacity group-hover:opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground p-4 text-center text-[10px] uppercase tracking-widest">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-3 pt-2">
                    <h2 className="text-[14pt] font-normal tracking-[0.1em]">{item.title}</h2>
                    <p className="text-[12px] text-foreground/80 leading-relaxed font-normal whitespace-pre-wrap">
                      {item.description || "A balance of form and articulated movement."}
                    </p>
                    <p className="text-[10pt] uppercase tracking-widest text-accent font-medium pt-2 group-hover:underline underline-offset-4">
                      View Observation &rarr;
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-[12px] text-muted-foreground italic font-normal">No flow observations found. Use the Management Dashboard to add titles and descriptions.</p>
            )}
          </div>
        </div>
      </main>

      {selectedItem && (
        <VideoPlayerModal
          image={{
            path: selectedItem.imagePath || `ks-images/${selectedItem.id}.jpg`,
            alt: selectedItem.title,
            description: selectedItem.description,
            width: 800,
            height: 800
          } as any}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
