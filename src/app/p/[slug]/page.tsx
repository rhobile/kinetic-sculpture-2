'use client';

import { use, ReactNode, Fragment } from 'react';
import { doc } from 'firebase/firestore';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import Link from 'next/link';

export default function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { firestore } = useFirebase();

  const pageQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return doc(firestore, 'pages', slug);
  }, [firestore, slug]);

  const { data: pageData, isLoading } = useDoc(pageQuery);

  const renderTextWithFormatting = (text: string) => {
    if (!text) return null;

    // Handle Italics: *text*
    const italicParts = text.split(/(\*.*?\*)/g);
    return italicParts.map((part, i) => {
      const match = part.match(/\*(.*?)\*/);
      if (match) {
        return <em key={i} className="italic">{match[1]}</em>;
      }
      return part;
    });
  };

  const renderContent = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: ReactNode[] = [];

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      
      const imgMatch = trimmedLine.match(/^\[image:(.*?)\]$/);
      if (imgMatch) {
        const filename = imgMatch[1].trim();
        const path = filename.startsWith('ks-images/') ? filename : `ks-images/${filename}`;
        
        elements.push(
          <div key={`img-${idx}`} className="my-10 first:mt-0 last:mb-0">
            <div className="border border-border/50 bg-muted overflow-hidden">
              <FirebaseStorageImage
                path={path}
                alt={`Image ${filename}`}
                width={1200}
                height={800}
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            </div>
          </div>
        );
        return;
      }

      const parts = line.split(/(\[.*?\]\(.*?\))/g);
      const renderedLine = parts.map((part, pIdx) => {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const label = match[1];
          const url = match[2];
          return (
            <Link 
              key={`${idx}-${pIdx}`} 
              href={url} 
              className="text-accent hover:underline underline-offset-4 decoration-accent/30"
            >
              {renderTextWithFormatting(label)}
            </Link>
          );
        }
        return renderTextWithFormatting(part);
      });

      elements.push(
        <p key={`p-${idx}`} className="min-h-[1.2em] text-[12pt] text-foreground/80 leading-relaxed font-normal mb-4 last:mb-0">
          {renderedLine}
        </p>
      );
    });

    return elements;
  };

  if (isLoading || !firestore || !slug) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-3/4 mb-10" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </main>
    );
  }

  if (!pageData) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-2xl font-normal tracking-widest mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-normal mb-6 tracking-widest border-b border-border/50 pb-6">
          {pageData.title}
        </h1>
        <div className="max-w-none">
          {renderContent(pageData.content)}
        </div>
      </div>
    </main>
  );
}
