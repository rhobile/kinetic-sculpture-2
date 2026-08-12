
'use client';

import { use, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { FirebaseStorageVideo } from '@/components/firebase/storage-video';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Sculpture detail page with optimized mobile wrapping and tight spacing.
 * Titles now wrap to a second line if they are long on mobile portrait.
 */
export default function SculptureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firestore } = useFirebase();

  const videoQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'videos', id.toLowerCase().trim());
  }, [firestore, id]);

  const { data: videoData, isLoading } = useDoc(videoQuery);

  const videoPath = useMemo(() => {
    if (!id) return '';
    return `ks-videos/${id.toLowerCase().trim()}.mp4`;
  }, [id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="aspect-video w-full bg-white/5" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3 bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  const title = videoData?.title || id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const description = videoData?.description || "A balance of form and articulated movement.";

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-2">
        <div className="flex justify-between items-center mb-2">
          <Link href="/" className="text-white/30 hover:text-white transition-colors flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] hover:no-underline">
            <ArrowLeft className="size-3" /> Return to Gallery
          </Link>
        </div>

        <div className="space-y-1">
          <div className="aspect-video bg-neutral-900 border border-white/5 relative overflow-hidden">
            <FirebaseStorageVideo path={videoPath} className="w-full h-full object-contain" />
          </div>
          
          <div className="max-w-2xl space-y-0 pt-0.5">
            <h1 className="text-[11pt] font-normal tracking-[0.2em] uppercase leading-tight break-words whitespace-normal">
              {title}
            </h1>
            <p className="text-[12pt] text-white/60 font-light leading-tight whitespace-pre-wrap pt-1">
              {description}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
