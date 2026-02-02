'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Menu } from 'lucide-react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar className="border-0 bg-sidebar">
        <SidebarHeader className="p-6 pb-2">
          <Link href="/" className="block text-foreground hover:no-underline">
            <h1 className="font-headline text-3xl font-bold tracking-[0.2em] mb-1 uppercase whitespace-nowrap">
              R H O B I L E
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-6 py-4 space-y-8 text-sm leading-relaxed overflow-y-auto">
          <div className="space-y-4">
            <p className="font-semibold text-base text-foreground">
              Kinetic sculptures by Andrew Jones.
            </p>
            <p className="text-muted-foreground">
              Mainly linear elements balanced and articulated to move simply in the wind, light or strong.
            </p>
            <p className="text-muted-foreground">
              I work to commission. Guide prices are given below the videos or a price for a limited edition.
            </p>
            <p>
              <Link href="#" className="font-semibold text-accent hover:underline underline-offset-4 decoration-accent/30">
                News (if there is any)
              </Link>
            </p>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              It is difficult to appreciate the movement out of the context of a breeze in a garden, so please visit our garden in Ely during <a href="https://camopenstudios.org/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline underline-offset-4 decoration-accent/30">Cambridge Open Studios</a> which is in July each year.
            </p>
            <p>
              If you would like to visit at another time, please <Link href="/contact" className="text-accent hover:underline underline-offset-4 decoration-accent/30">contact me</Link>.
            </p>
          </div>

          <div className="space-y-1 text-muted-foreground font-medium pt-2 border-t border-border/50">
            <p>
              <a href="mailto:andrew@rhobile.com" className="hover:text-accent transition-colors">andrew@rhobile.com</a>
            </p>
            <p>Telephone +44 (0)1353 610406</p>
            <p>Mobile +44 (0)781 4179181</p>
            <p>
              <a href="#" className="hover:text-accent transition-colors">@Rhobile</a>
            </p>
          </div>

          <nav className="flex flex-col gap-4 pt-4 border-t border-border/50">
            <Link href="/about" className="text-foreground hover:text-accent font-semibold transition-colors">
              My background
            </Link>
            <Link href="#" className="text-foreground hover:text-accent font-semibold transition-colors">
              Introduction to the sculptures
            </Link>
            <div className="space-y-0">
              <Link href="#" className="text-foreground hover:text-accent font-semibold transition-colors block">
                Flow observations of wind and water.
              </Link>
              <span className="text-muted-foreground text-xs">(short videos)</span>
            </div>
            <Link href="#" className="text-foreground hover:text-accent font-semibold transition-colors italic">
              Sign up for news by email....
            </Link>
          </nav>
        </SidebarContent>
      </Sidebar>
      
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-4 sm:hidden">
          <SidebarTrigger>
            <Menu className="size-6" />
          </SidebarTrigger>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-headline tracking-[0.2em] uppercase whitespace-nowrap">R H O B I L E</h1>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
