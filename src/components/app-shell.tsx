
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

  // Fallback values
  const content = {
    introTitle: sidebarData?.introTitle || "Kinetic sculptures by Andrew Jones.",
    introSub: sidebarData?.introSub || "Mainly linear elements balanced and articulated to move simply in the wind, light or strong.",
    commissionNote: sidebarData?.commissionNote || "I work to commission. Guide prices are given below the videos or a price for a limited edition.",
    gardenNotice: sidebarData?.gardenNotice || "It is difficult to appreciate the movement out of the context of a breeze in a garden, so please visit our garden in July each year.",
    email: sidebarData?.email || "andrew@rhobile.com",
    phone: sidebarData?.phone || "Telephone +44 (0)1353 610406",
    mobile: sidebarData?.mobile || "Mobile +44 (0)781 4179181",
    social: sidebarData?.social || "@Rhobile"
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-0 bg-sidebar">
        <SidebarHeader className="p-6 pb-2 flex items-center justify-center">
          <Link href="/" className="block text-foreground hover:no-underline w-full">
            <h1 className="font-headline text-xl sm:text-2xl tracking-[0.15em] sm:tracking-[0.25em] mb-1 uppercase whitespace-nowrap text-center font-normal">
              R H O B I L E
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-6 py-4 space-y-8 text-sm leading-relaxed overflow-y-auto font-normal">
          <div className="space-y-4">
            <p className="text-[12pt] text-foreground">{content.introTitle}</p>
            <p className="text-[12pt] text-muted-foreground">{content.introSub}</p>
            <p className="text-[12pt] text-muted-foreground">{content.commissionNote}</p>
            <div className="space-y-2">
              <p>
                <Link href="/sculptures" className="text-[12pt] text-accent hover:underline underline-offset-4 decoration-accent/30 font-medium">
                  Index of Sculptures
                </Link>
              </p>
              <p>
                <Link href="/news" className="text-[12pt] text-accent hover:underline underline-offset-4 decoration-accent/30">
                  News (if there is any)
                </Link>
              </p>
            </div>
          </div>

          <div className="space-y-4 text-muted-foreground text-[12pt]">
            <p>{content.gardenNotice}</p>
            <p>
              If you would like to visit at another time, please <Link href="/contact" className="text-accent hover:underline underline-offset-4 decoration-accent/30">contact me</Link>.
            </p>
          </div>

          <div className="space-y-1 text-muted-foreground pt-2 border-t border-border/50 text-[12pt]">
            <p><a href={`mailto:${content.email}`} className="hover:text-accent transition-colors">{content.email}</a></p>
            <p>{content.phone}</p>
            <p>{content.mobile}</p>
            <p><a href="#" className="hover:text-accent transition-colors">{content.social}</a></p>
          </div>

          <nav className="flex flex-col gap-4 pt-4 border-t border-border/50 text-[12pt]">
            <Link href="/about" className="text-foreground hover:text-accent transition-colors">About Us</Link>
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
              <Settings className="size-3" /> Manage Gallery
            </Link>
          </nav>
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
