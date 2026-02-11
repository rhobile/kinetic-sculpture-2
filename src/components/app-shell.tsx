'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Menu, Settings } from 'lucide-react';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { firestore } = useFirebase();

  // Sidebar dynamic content
  const sidebarQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'sidebar');
  }, [firestore]);
  const { data: sidebarData } = useDoc(sidebarQuery);

  // Dynamic custom pages links
  const pagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'pages');
  }, [firestore]);
  const { data: pages } = useCollection(pagesQuery);

  const customPages = pages?.filter(p => p.id !== 'sidebar') || [];

  // Fallback / Initial values
  const defaults = {
    introTitle: "Kinetic sculptures by Andrew Jones.",
    introSub: "Mainly linear elements balanced and articulated to move simply in the wind, light or strong.",
    commissionNote: "I work to commission. Guide prices are given below the videos or a price for a limited edition.",
    gardenNotice: "It is difficult to appreciate the movement out of the context of a breeze in a garden, so please visit our garden in July each year.",
    email: "andrew@rhobile.com",
    phone: "Telephone +44 (0)1353 610406",
    mobile: "Mobile +44 (0)781 4179181",
    social: "@Rhobile",
    layout: ['intro', 'commission', 'links', 'garden', 'contact', 'pages'],
    spacing: {
      intro: "4",
      commission: "4",
      links: "4",
      garden: "4",
      contact: "4",
      pages: "4"
    }
  };

  // Safe merge logic to ensure Firestore data always wins over defaults
  const config = {
    ...defaults,
    ...(sidebarData || {}),
    layout: sidebarData?.layout || defaults.layout,
    spacing: { 
      ...defaults.spacing, 
      ...(sidebarData?.spacing || {}) 
    }
  };

  const spacingMap: Record<string, string> = {
    "0": "mb-0", "1": "mb-1", "2": "mb-2", "3": "mb-3", "4": "mb-4", "5": "mb-5",
    "6": "mb-6", "8": "mb-8", "10": "mb-10", "12": "mb-12", "16": "mb-16"
  };

  const getSpacingClass = (blockId: string) => {
    const val = config.spacing[blockId as keyof typeof config.spacing] || "4";
    return spacingMap[val.toString()] || "mb-4";
  };

  const renderBlock = (blockId: string) => {
    switch (blockId) {
      case 'intro':
        return (
          <div key="intro" className={cn("space-y-4", getSpacingClass('intro'))}>
            <p className="text-[12pt] text-foreground leading-snug">{config.introTitle}</p>
            <p className="text-[12pt] text-muted-foreground leading-relaxed">{config.introSub}</p>
          </div>
        );
      case 'commission':
        return (
          <div key="commission" className={getSpacingClass('commission')}>
            <p className="text-[12pt] text-muted-foreground leading-relaxed">{config.commissionNote}</p>
          </div>
        );
      case 'links':
        return (
          <div key="links" className={cn("space-y-2", getSpacingClass('links'))}>
            <p>
              <Link href="/news" className="text-[12pt] text-accent hover:underline underline-offset-4 decoration-accent/30">
                News (if there is any)
              </Link>
            </p>
            <p>
              <Link href="/sculptures" className="text-[12pt] text-accent hover:underline underline-offset-4 decoration-accent/30">
                Flow observations of wind and water
              </Link>
            </p>
          </div>
        );
      case 'garden':
        return (
          <div key="garden" className={cn("space-y-4 text-muted-foreground text-[12pt] leading-relaxed", getSpacingClass('garden'))}>
            <p>{config.gardenNotice}</p>
            <p>
              If you would like to visit at another time, please contact me.
            </p>
          </div>
        );
      case 'contact':
        return (
          <div key="contact" className={cn("space-y-1 text-muted-foreground pt-2 border-t border-border/50 text-[12pt]", getSpacingClass('contact'))}>
            <p><a href={`mailto:${config.email}`} className="hover:text-accent transition-colors">{config.email}</a></p>
            <p>{config.phone}</p>
            <p>{config.mobile}</p>
            <p><a href="#" className="hover:text-accent transition-colors">{config.social}</a></p>
          </div>
        );
      case 'pages':
        return (
          <nav key="pages" className={cn("flex flex-col gap-4 pt-4 border-t border-border/50 text-[12pt]", getSpacingClass('pages'))}>
            {customPages.map((page) => (
              <Link 
                key={page.id} 
                href={`/p/${page.slug}`} 
                className="text-foreground hover:text-accent transition-colors"
              >
                {page.title}
              </Link>
            ))}
            <Link href="/manage" className="text-muted-foreground/30 hover:text-accent transition-colors flex items-center gap-2 mt-4 pt-4 border-t border-border/20 text-[10pt]">
              <Settings className="size-3" /> Manage Dashboard
            </Link>
          </nav>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider suppressHydrationWarning>
      <Sidebar className="border-0 bg-sidebar" style={{ '--sidebar-width': '18rem', '--sidebar-width-icon': '3rem' } as React.CSSProperties}>
        <SidebarHeader className="p-6 pb-2 flex items-center justify-center">
          <Link href="/" className="block text-foreground hover:no-underline w-full">
            <h1 className="font-headline text-xl sm:text-2xl tracking-[0.15em] sm:tracking-[0.25em] mb-1 uppercase whitespace-nowrap text-center font-normal">
              R H O B I L E
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-6 py-4 space-y-0 text-sm leading-relaxed overflow-y-auto font-normal">
          {config.layout.map(blockId => renderBlock(blockId))}
        </SidebarContent>
      </Sidebar>
      
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 sm:hidden">
          <SidebarTrigger><Menu className="size-6" /></SidebarTrigger>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-base font-headline tracking-[0.15em] uppercase whitespace-nowrap font-normal truncate">R H O B I L E</h1>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
