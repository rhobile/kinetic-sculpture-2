'use client';

import { use, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { FirebaseStorageVideo } from '@/components/firebase/storage-video';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Sculpture detail page.
 * Supports *italics* in description.
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

  const renderTextWithFormatting = (text: string) => {
    if (!text) return null;
    const italicParts = text.split(/(\*.*?\*)/g);
    return italicParts.map((part, i) => {
      const match = part.match(/\*(.*?)\*/);
      if (match) {
        return <em key={i} className="italic">{match[1]}</em>;
      }
      return part;
    });
  };

  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <p key={i} className="min-h-[1.2em]">
        {renderTextWithFormatting(line)}
      </p>
    ));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="aspect-video w-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
          </div>
        </div>
      </main>
    );
  }

  const title = videoData?.title || id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const description = videoData?.description || "A balance of form and articulated movement.";

  return (
    <main className="min-h-screen bg-background text-foreground p-4 sm:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-1">
        <div className="flex justify-between items-center mb-1">
          <Link href="/" className="text-foreground/30 hover:text-foreground transition-colors flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] hover:no-underline">
            <ArrowLeft className="size-3" /> Return to Gallery
          </Link>
        </div>

        <div className="space-y-0.5">
          <div className="aspect-video bg-neutral-100 border border-border relative overflow-hidden">
            <FirebaseStorageVideo path={videoPath} className="w-full h-full object-contain" />
          </div>
          
          <div className="max-w-2xl space-y-0 pt-0.5">
            <h1 className="text-[11pt] font-normal tracking-[0.2em] uppercase leading-tight break-words whitespace-normal text-foreground">
              {title}
            </h1>
            <div className="text-[12pt] text-foreground/60 font-light leading-tight pt-0.5">
              {renderFormattedContent(description)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
