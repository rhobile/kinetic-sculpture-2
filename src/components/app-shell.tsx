'use client';

import React, { type ReactNode, Fragment } from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Menu, Settings } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function AppShell({ children }: { children: ReactNode }) {
  const { firestore } = useFirebase();

  // Sidebar dynamic content
  const sidebarQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'sidebar');
  }, [firestore]);
  const { data: sidebarData } = useDoc(sidebarQuery);

  const defaults = {
    content: `Kinetic sculptures by Andrew Jones.\n\nMainly linear elements balanced and articulated to move simply in the wind, light or strong.\n\nI work to commission. Guide prices are given below the videos or a price for a limited edition.\n\n[News (if there is any)](/news)\n\n[Flow observations of wind and water](/observations)\n\nIt is difficult to appreciate the movement out of the context of a breeze in a garden, so please visit our garden in July each year.\n\nIf you would like to visit at another time, please contact me.\n\nandrew@rhobile.com\nTelephone +44 (0)1353 610406\nMobile +44 (0)781 4179181\n@Rhobile`
  };

  const sidebarText = sidebarData?.content || defaults.content;

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

  // Helper to parse formatting and [text](url) into Link components
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      // Split by markdown link pattern [label](url)
      const parts = line.split(/(\[.*?\]\(.*?\))/g);
      
      const content = parts.map((part, partIdx) => {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const label = match[1];
          const url = match[2];
          return (
            <Link 
              key={`${lineIdx}-${partIdx}`} 
              href={url} 
              className="text-accent hover:underline underline-offset-4 decoration-accent/30"
            >
              {renderTextWithFormatting(label)}
            </Link>
          );
        }
        return renderTextWithFormatting(part);
      });

      return (
        <p key={lineIdx} className="min-h-[1.2em] text-[12pt] text-foreground/80 leading-relaxed font-normal">
          {content}
        </p>
      );
    });
  };

  return (
    <SidebarProvider suppressHydrationWarning>
      <Sidebar className="border-0 bg-sidebar" style={{ '--sidebar-width': '18rem', '--sidebar-width-icon': '3rem' } as React.CSSProperties}>
        <SidebarHeader className="p-6 pb-2 flex items-center justify-center">
          <Link href="/" className="block text-foreground hover:no-underline w-full">
            <h1 className="font-headline text-xl sm:text-2xl tracking-[0.15em] sm:tracking-[0.25em] mb-1 whitespace-nowrap text-center font-normal">
              Rhobile
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-6 py-4 space-y-0 overflow-y-auto">
          <div className="space-y-1">
            {renderFormattedText(sidebarText)}
          </div>
          <div className="pt-8 mt-4 border-t border-border/20">
            <Link href="/manage" className="text-muted-foreground/30 hover:text-accent transition-colors flex items-center gap-2 text-[10pt]">
              <Settings className="size-3" /> Manage Dashboard
            </Link>
          </div>
        </SidebarContent>
      </Sidebar>
      
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 sm:hidden">
          <SidebarTrigger><Menu className="size-6" /></SidebarTrigger>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-base font-headline tracking-[0.15em] whitespace-nowrap font-normal truncate">Rhobile</h1>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
