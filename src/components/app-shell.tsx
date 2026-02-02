'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Home, Info, Mail, FileImage, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <SidebarProvider>
      <Sidebar className="border-0">
        <SidebarHeader className="p-4">
          <Link href="/" className="block text-foreground hover:no-underline">
            <h1 className="font-headline text-2xl font-semibold tracking-tight">
              Kinetic Sculptures
            </h1>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            A curated collection of mesmerizing kinetic art and digital sculptures.
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/'}>
                <Link href="/">
                  <Home className="size-4" />
                  <span>Gallery</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/about'}>
                <Link href="/about">
                  <Info className="size-4" />
                  <span>About</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/contact'}>
                <Link href="/contact">
                  <Mail className="size-4" />
                  <span>Contact</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/demo'}>
                <Link href="/demo">
                  <FileImage className="size-4" />
                  <span>Storage Demo</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-4 sm:hidden">
          <SidebarTrigger>
            <Menu className="size-6" />
          </SidebarTrigger>
          <div className="flex-1">
            <h1 className="text-lg font-semibold font-headline">Kinetic Sculptures</h1>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
