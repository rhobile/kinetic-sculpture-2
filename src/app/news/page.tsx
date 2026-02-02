'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function NewsPage() {
  const newsItems = [
    {
      date: 'July 2024',
      title: 'Cambridge Open Studios',
      content: 'Thank you to everyone who visited the garden this year. It was wonderful to see the sculptures moving in the summer breeze and discuss the works with so many enthusiasts.',
      image: PlaceHolderImages[5], // Windswept
    },
    {
      date: 'May 2024',
      title: 'New Commission Completed',
      content: 'A new large-scale "Arc Line Dot" variant has been installed in a private garden in the Cotswolds. This piece was designed to catch the unique light and wind patterns of the rolling hillside.',
      image: PlaceHolderImages[0], // Flowing Forms
    }
  ];

  return (
    <div className="bg-background min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-normal mb-10 tracking-widest uppercase">News</h1>
          
          <div className="space-y-16">
            {newsItems.map((item, index) => (
              <article key={index} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                <div className="md:col-span-1">
                  <div className="aspect-square relative overflow-hidden rounded-none border border-border/50">
                    <Image
                      src={item.image.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      data-ai-hint={item.image.imageHint}
                    />
                  </div>
                </div>
                <div className="md:col-span-3 space-y-3">
                  <p className="text-[12px] uppercase tracking-widest text-muted-foreground">{item.date}</p>
                  <h2 className="text-[14px] font-normal uppercase tracking-wide">{item.title}</h2>
                  <p className="text-[12px] text-foreground/80 leading-relaxed font-normal">
                    {item.content}
                  </p>
                </div>
              </article>
            ))}
            
            {newsItems.length === 0 && (
              <p className="text-[12px] text-muted-foreground italic font-normal">No news updates at this time.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
