'use client';

import { use, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { FirebaseStorageVideo } from '@/components/firebase/storage-video';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Dedicated sculpture detail page designed for professional client inspection.
 * Uses 11pt uppercase titles for a clean, single-line appearance.
 */
export default function SculptureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firestore } = useFirebase();

  const videoQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'videos', id);
  }, [firestore, id]);

  const { data: videoData, isLoading } = useDoc(videoQuery);

  const videoPath = useMemo(() => {
    if (!id) return '';
    return `ks-videos/${id}.mp4`;
  }, [id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-8">
          <Skeleton className="aspect-video w-full bg-white/5" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3 bg-white/5" />
            <Skeleton className="h-20 w-full bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  const title = videoData?.title || id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const description = videoData?.description || "A balance of form and articulated movement.";

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-white/30 hover:text-white transition-colors flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] hover:no-underline">
            <ArrowLeft className="size-3" /> Return to Gallery
          </Link>
        </div>

        <div className="space-y-12">
          <div className="aspect-video bg-neutral-900 border border-white/5 relative overflow-hidden">
            <FirebaseStorageVideo path={videoPath} className="w-full h-full object-contain" />
          </div>
          
          <div className="max-w-2xl space-y-6">
            <h1 className="text-[11pt] font-normal tracking-[0.2em] uppercase leading-tight">
              {title}
            </h1>
            <p className="text-lg text-white/60 font-light leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}