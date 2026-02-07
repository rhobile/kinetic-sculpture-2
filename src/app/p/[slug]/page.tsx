'use client';

import { use } from 'react';
import { doc } from 'firebase/firestore';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { firestore } = useFirebase();

  const pageQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return doc(firestore, 'pages', slug);
  }, [firestore, slug]);

  const { data: pageData, isLoading } = useDoc(pageQuery);

  if (isLoading) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!pageData) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto text-center py-20">
          <h1 className="text-2xl font-normal tracking-widest uppercase mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-normal mb-10 tracking-widest uppercase border-b border-border/50 pb-6">
          {pageData.title}
        </h1>
        <div className="prose prose-neutral max-w-none">
          <p className="text-[12pt] text-foreground/80 leading-relaxed font-normal whitespace-pre-wrap">
            {pageData.content}
          </p>
        </div>
      </div>
    </main>
  );
}