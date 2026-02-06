
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function NewsPage() {
  const { firestore } = useFirebase();

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: newsItems, isLoading } = useCollection(newsQuery);

  return (
    <div className="bg-background min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-normal mb-10 tracking-widest uppercase">News</h1>
          
          <div className="space-y-16">
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
              newsItems.map((item) => (
                <article key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                  <div className="md:col-span-1">
                    <div className="aspect-square relative overflow-hidden rounded-none border border-border/50 bg-muted">
                      {item.imagePath ? (
                        <FirebaseStorageImage
                          path={item.imagePath}
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
                  <div className="md:col-span-3 space-y-3">
                    <p className="text-[12px] uppercase tracking-widest text-muted-foreground">{item.date}</p>
                    <h2 className="text-[14px] font-normal uppercase tracking-wide">{item.title}</h2>
                    <p className="text-[12px] text-foreground/80 leading-relaxed font-normal whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-[12px] text-muted-foreground italic font-normal">No news updates at this time.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
