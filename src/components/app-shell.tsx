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

/**
 * App Shell for Rhobile.
 * Supports *italics* in sidebar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { firestore, user } = useFirebase();

  const isAdmin = user && (
    user.email === 'rhobile@gmail.com' || 
    user.uid === 'ge6KSJEZKFXsNZerEbXseOR2vSS2' ||
    user.uid === 'gHZ9n7s2b9X8fJ2kP3s5t8YxVOE2'
  );

  const sidebarQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'sidebar');
  }, [firestore]);
  const { data: sidebarData } = useDoc(sidebarQuery);

  const defaults = {
    content: `Kinetic sculptures by Andrew Jones.\n\nMainly linear elements balanced and articulated to move simply in the wind, light or strong.\n\nI work to commission. Guide prices are given below the videos or a price for a limited edition.\n\n[News (if there is any)](/news)\n\n[Flow observations of wind and water](/observations)\n\nIt is difficult to appreciate the movement out of the context of a breeze in a garden, so please visit our garden in July each year.\n\nIf you would like to visit at another time, please contact me.\n\nandrew@rhobile.com\nTelephone +44 (0)1353 610406\nMobile +44 (0)781 4179181\n@Rhobile`
  };

  const sidebarText = sidebarData?.content || defaults.content;
  const siteTitle = sidebarData?.siteTitle || 'Rhobile';

  const renderTextWithFormatting = (text: string) => {
    if (!text) return null;
    const italicParts = text.split(/(\*.*?\*)/g);
    return italicParts.map((part, i) => {
      const match = part.match(/\*(.*?)\*/);
      if (match) {
        return <em key={i} className="italic font-normal">{match[1]}</em>;
      }
      return part;
    });
  };

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
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
      <Sidebar className="border-0 bg-white" style={{ '--sidebar-width': '18rem', '--sidebar-width-icon': '3rem' } as React.CSSProperties}>
        <SidebarHeader className="p-6 pb-2 flex items-center justify-center bg-white">
          <Link href="/" className="block text-black hover:no-underline w-full">
            <h1 className="font-headline text-xl sm:text-2xl tracking-[0.15em] sm:tracking-[0.25em] mb-1 whitespace-nowrap text-center font-normal uppercase">
              {siteTitle}
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-6 py-4 space-y-0 overflow-y-auto bg-white">
          <div className="space-y-1">
            {renderFormattedText(sidebarText)}
          </div>
          {isAdmin && (
            <div className="pt-8 mt-4 border-t border-black/10">
              <Link href="/manage" className="text-black/30 hover:text-black transition-colors flex items-center gap-2 text-[10pt] uppercase tracking-widest hover:no-underline">
                <Settings className="size-3" /> Management Dashboard
              </Link>
            </div>
          )}
        </SidebarContent>
      </Sidebar>
      
      <SidebarInset className="bg-white">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-white/95 backdrop-blur px-4 sm:hidden">
          <SidebarTrigger className="text-black"><Menu className="size-6" /></SidebarTrigger>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-base font-headline tracking-[0.15em] whitespace-nowrap font-normal truncate text-black uppercase">{siteTitle}</h1>
          </div>
        </header>
        <div className="flex-1 bg-white">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
