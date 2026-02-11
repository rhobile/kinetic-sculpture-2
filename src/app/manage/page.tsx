'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { 
  useFirebase, 
  useCollection, 
  useDoc, 
  useMemoFirebase, 
  deleteDocumentNonBlocking, 
  setDocumentNonBlocking 
} from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Button } from '@/components/ui/button';
import { 
  Trash2, Loader2, RefreshCw, Edit3, Save, Plus, LayoutGrid, ArrowUp, ArrowDown, MoveVertical
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { EXCLUDED_IMAGES } from '@/lib/constants';

export default function ManageDashboardPage() {
  const { firebaseApp, auth, firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const [storageData, setStorageData] = useState<{ images: any[] }>({ images: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, collection: 'videos' | 'news' | 'pages' | 'observations', msg: string } | null>(null);

  const SIDEBAR_DEFAULTS = {
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

  // Firestore Data
  const allVideosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'videos'), orderBy('order', 'asc'));
  }, [firestore]);
  const { data: firestoreVideos } = useCollection(allVideosQuery);

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('order', 'asc'));
  }, [firestore]);
  const { data: firestoreNews } = useCollection(newsQuery);

  const obsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'observations'), orderBy('order', 'asc'));
  }, [firestore]);
  const { data: firestoreObs } = useCollection(obsQuery);

  const pagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'pages');
  }, [firestore]);
  const { data: firestorePages } = useCollection(pagesQuery);

  const sidebarQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'sidebar');
  }, [firestore]);
  const { data: sidebarData } = useDoc(sidebarQuery);

  // UI State - Masonry Item Editor
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemOrder, setItemOrder] = useState('0');

  // UI State - News & Observations Shared Form State
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [entryType, setEntryType] = useState<'news' | 'observations'>('news');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryImagePath, setEntryImagePath] = useState('');
  const [entryVideoId, setEntryVideoId] = useState('');
  const [entryOrder, setEntryOrder] = useState('0');

  // UI State - Page
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('');

  // UI State - Sidebar
  const [sidebarState, setSidebarState] = useState(SIDEBAR_DEFAULTS);

  useEffect(() => {
    if (sidebarData) {
      setSidebarState({
        ...SIDEBAR_DEFAULTS,
        ...sidebarData,
        layout: sidebarData.layout || SIDEBAR_DEFAULTS.layout,
        spacing: { 
          ...SIDEBAR_DEFAULTS.spacing, 
          ...(sidebarData.spacing || {}) 
        }
      });
    }
  }, [sidebarData]);

  useEffect(() => {
    if (!isAuthLoading && !user && auth) {
      signInAnonymously(auth).catch((err) => console.error("Anonymous auth failed:", err));
    }
  }, [auth, user, isAuthLoading]);

  const fetchData = useCallback(async () => {
    if (!firebaseApp) return;
    setIsRefreshing(true);
    try {
      const storage = getStorage(firebaseApp);
      const imgRes = await listAll(storageRef(storage, 'ks-images'));

      const images = imgRes.items
        .filter(item => {
          const lowerName = item.name.toLowerCase();
          const fileNameLower = item.name.split('.').slice(0, -1).join('.').toLowerCase().trim();
          const isImage = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
          const isExcluded = EXCLUDED_IMAGES.includes(fileNameLower);
          return isImage && !isExcluded;
        })
        .map(item => ({ 
          id: item.name.split('.').slice(0, -1).join('.').toLowerCase().trim(), 
          path: item.fullPath, 
          name: item.name 
        }));

      setStorageData({ images });
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (error: any) {
      console.error("Storage list error:", error);
      toast({ variant: "destructive", title: "Storage refresh failed", description: error.message });
    } finally {
      setIsRefreshing(false);
    }
  }, [firebaseApp]);

  useEffect(() => {
    if (firebaseApp) fetchData();
  }, [firebaseApp, fetchData]);

  const masonryItems = useMemo(() => {
    return storageData.images.map(img => {
      const fsData = firestoreVideos?.find(v => v.id === img.id);
      return {
        id: img.id,
        title: fsData?.title || img.id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: fsData?.description || "",
        order: fsData?.order ?? 999,
        imagePath: img.path,
        isIndexed: !!fsData
      };
    }).sort((a: any, b: any) => {
      if (a.isIndexed && !b.isIndexed) return -1;
      if (!a.isIndexed && b.isIndexed) return 1;
      return a.order - b.order;
    });
  }, [storageData, firestoreVideos]);

  const saveItem = async () => {
    if (!firestore || !itemTitle) return;
    setIsSaving(true);
    try {
      const id = editingItem?.id;
      const docRef = doc(firestore, 'videos', id);
      setDocumentNonBlocking(docRef, {
        id,
        title: itemTitle,
        description: itemDesc,
        order: Number(itemOrder) || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Masonry record updated" });
      setIsItemDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveEntry = async () => {
    if (!firestore || !entryTitle) return;
    setIsSaving(true);
    try {
      const id = editingEntry?.isNew 
        ? entryTitle.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : editingEntry.id;
      const docRef = doc(firestore, entryType, id);
      setDocumentNonBlocking(docRef, {
        id,
        title: entryTitle,
        date: entryDate,
        content: entryContent,
        imagePath: entryImagePath,
        videoId: entryVideoId,
        order: Number(entryOrder) || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: `${entryType === 'news' ? 'News' : 'Observation'} item updated` });
      setEditingEntry(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const savePage = async () => {
    if (!firestore || !pageTitle || !pageSlug) return;
    setIsSaving(true);
    try {
      const id = editingPage?.isNew 
        ? pageSlug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : editingPage.id;
      const docRef = doc(firestore, 'pages', id);
      setDocumentNonBlocking(docRef, {
        id,
        title: pageTitle,
        slug: pageSlug,
        content: pageContent,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Custom page saved" });
      setEditingPage(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveSidebar = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const docRef = doc(firestore, 'pages', 'sidebar');
      // Ensure we are saving a clean object
      const payload = {
        introTitle: sidebarState.introTitle,
        introSub: sidebarState.introSub,
        commissionNote: sidebarState.commissionNote,
        gardenNotice: sidebarState.gardenNotice,
        email: sidebarState.email,
        phone: sidebarState.phone,
        mobile: sidebarState.mobile,
        social: sidebarState.social,
        layout: sidebarState.layout,
        spacing: sidebarState.spacing,
        updatedAt: new Date().toISOString()
      };
      setDocumentNonBlocking(docRef, payload, { merge: true });
      toast({ title: "Sidebar content updated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const moveSidebarBlock = (index: number, direction: 'up' | 'down') => {
    const newLayout = [...sidebarState.layout];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayout.length) return;
    
    [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
    setSidebarState({ ...sidebarState, layout: newLayout });
  };

  const handleConfirmDelete = useCallback(() => {
    if (!itemToDelete || !firestore) return;
    const { id, collection: col } = itemToDelete;
    const docRef = doc(firestore, col, id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Record removed" });
    setItemToDelete(null);
  }, [itemToDelete, firestore]);

  const blockLabels: Record<string, string> = {
    intro: "Introduction (Title & Sub)",
    commission: "Commission Note",
    links: "Internal Links (News/Obs)",
    garden: "Garden Notice",
    contact: "Contact Details",
    pages: "Custom Pages Links"
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <LayoutGrid className="size-6 text-muted-foreground" />
            <h1 className="text-[12pt] font-normal uppercase tracking-widest text-foreground/80">Management Dashboard</h1>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={isRefreshing} className="rounded-none font-normal">
              <RefreshCw className={cn("size-4 mr-2", isRefreshing && "animate-spin")} /> 
              {isRefreshing ? 'Syncing Storage...' : 'Sync with Storage'}
            </Button>
            {lastRefreshed && (
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Last synced: {lastRefreshed}</span>
            )}
          </div>
        </div>

        <Tabs defaultValue="masonry" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5 rounded-none bg-muted/50 p-1 mb-8">
            <TabsTrigger value="masonry" className="rounded-none">Edit Masonry</TabsTrigger>
            <TabsTrigger value="news" className="rounded-none">News</TabsTrigger>
            <TabsTrigger value="obs" className="rounded-none">Observations</TabsTrigger>
            <TabsTrigger value="pages" className="rounded-none">Pages</TabsTrigger>
            <TabsTrigger value="sidebar" className="rounded-none">Sidebar</TabsTrigger>
          </TabsList>

          <TabsContent value="masonry" className="space-y-6">
            <div className="flex justify-between items-center border-b border-border/30 pb-4">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Masonry Index</h2>
              <p className="text-[9pt] text-muted-foreground hidden sm:block">Items in ks-images bucket. Entries appear on home page.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masonryItems.map((item: any) => (
                <div key={item.id} className={cn("p-4 border flex items-center gap-4", item.isIndexed ? "bg-muted/30 border-border/50 shadow-sm" : "bg-background border-dashed border-border/40 opacity-70")}>
                  <div className="size-16 bg-black shrink-0 relative border border-border/50 overflow-hidden">
                    <FirebaseStorageImage path={item.imagePath} alt={item.title} width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10pt] font-normal truncate">{item.title}</h3>
                    <p className="text-[8pt] text-accent font-mono break-all leading-tight">{item.id}</p>
                    <p className="text-[7pt] text-muted-foreground uppercase tracking-widest mt-1">
                      {item.isIndexed ? `Order: ${item.order}` : 'Unindexed Asset'}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="rounded-none h-6 px-1.5 text-[8px] uppercase tracking-widest min-w-10" onClick={() => {
                      setEditingItem(item);
                      setItemTitle(item.title || '');
                      setItemDesc(item.description || '');
                      setItemOrder(item.order?.toString() || '0');
                      setIsItemDialogOpen(true);
                    }}>
                      {item.isIndexed ? 'Edit' : 'Add'}
                    </Button>
                    {item.isIndexed && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6 text-destructive rounded-none hover:bg-destructive/10" 
                        onClick={() => setItemToDelete({ id: item.id, collection: 'videos', msg: "Remove this item from the public gallery?" })}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <div className="flex justify-between items-center border-b border-border/30 pb-4">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">News Updates</h2>
              <Button size="sm" onClick={() => { setEntryType('news'); setEditingEntry({ isNew: true }); setEntryTitle(''); setEntryDate(new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })); setEntryContent(''); setEntryImagePath(''); setEntryVideoId(''); setEntryOrder('0'); }} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Add News Entry</Button>
            </div>
            
            {(editingEntry && entryType === 'news') ? (
              <div className="bg-muted/20 border border-border/50 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={entryTitle} onChange={e => setEntryTitle(e.target.value)} className="rounded-none" /></div>
                  <div className="space-y-2"><Label>Date Label (e.g. July 2023)</Label><Input value={entryDate} onChange={e => setEntryDate(e.target.value)} className="rounded-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Image Path (relative to ks-images/)</Label><Input value={entryImagePath} placeholder="example.jpg" onChange={e => setEntryImagePath(e.target.value)} className="rounded-none" /></div>
                  <div className="space-y-2"><Label>Video ID (relative to ks-videos/)</Label><Input value={entryVideoId} placeholder="example" onChange={e => setEntryVideoId(e.target.value)} className="rounded-none" /></div>
                </div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={entryContent} onChange={e => setEntryContent(e.target.value)} className="rounded-none h-32" /></div>
                <div className="flex gap-2">
                  <Button onClick={saveEntry} disabled={isSaving} className="rounded-none h-8">{isSaving ? <Loader2 className="animate-spin size-4" /> : 'Save News Item'}</Button>
                  <Button variant="outline" onClick={() => setEditingEntry(null)} className="rounded-none h-8">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {firestoreNews?.map((item) => (
                  <div key={item.id} className="p-6 bg-muted/20 border border-border/50 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-[9pt] uppercase tracking-widest text-muted-foreground">{item.date}</p>
                      <h3 className="text-[12pt] font-normal">{item.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="rounded-none" onClick={() => { setEntryType('news'); setEditingEntry(item); setEntryTitle(item.title); setEntryDate(item.date); setEntryContent(item.content); setEntryImagePath(item.imagePath || ''); setEntryVideoId(item.videoId || ''); setEntryOrder(item.order?.toString() || '0'); }}><Edit3 className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive rounded-none hover:bg-destructive/10" onClick={() => setItemToDelete({ id: item.id, collection: 'news', msg: "Delete this news item permanently?" })}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="obs" className="space-y-6">
            <div className="flex justify-between items-center border-b border-border/30 pb-4">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Flow Observations</h2>
              <Button size="sm" onClick={() => { setEntryType('observations'); setEditingEntry({ isNew: true }); setEntryTitle(''); setEntryDate(new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })); setEntryContent(''); setEntryImagePath(''); setEntryVideoId(''); setEntryOrder('0'); }} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Add Observation</Button>
            </div>
            
            {(editingEntry && entryType === 'observations') ? (
              <div className="bg-muted/20 border border-border/50 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={entryTitle} onChange={e => setEntryTitle(e.target.value)} className="rounded-none" /></div>
                  <div className="space-y-2"><Label>Date Label</Label><Input value={entryDate} onChange={e => setEntryDate(e.target.value)} className="rounded-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Image Path (relative to ks-images/)</Label><Input value={entryImagePath} placeholder="example.jpg" onChange={e => setEntryImagePath(e.target.value)} className="rounded-none" /></div>
                  <div className="space-y-2"><Label>Video ID (relative to ks-videos/)</Label><Input value={entryVideoId} placeholder="arclinedot" onChange={e => setEntryVideoId(e.target.value)} className="rounded-none" /></div>
                </div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={entryContent} onChange={e => setEntryContent(e.target.value)} className="rounded-none h-32" /></div>
                <div className="flex gap-2">
                  <Button onClick={saveEntry} disabled={isSaving} className="rounded-none h-8">{isSaving ? <Loader2 className="animate-spin size-4" /> : 'Save Observation'}</Button>
                  <Button variant="outline" onClick={() => setEditingEntry(null)} className="rounded-none h-8">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {firestoreObs?.map((item) => (
                  <div key={item.id} className="p-6 bg-muted/20 border border-border/50 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-[9pt] uppercase tracking-widest text-muted-foreground">{item.date}</p>
                      <h3 className="text-[12pt] font-normal">{item.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="rounded-none" onClick={() => { setEntryType('observations'); setEditingEntry(item); setEntryTitle(item.title); setEntryDate(item.date); setEntryContent(item.content); setEntryImagePath(item.imagePath || ''); setEntryVideoId(item.videoId || ''); setEntryOrder(item.order?.toString() || '0'); }}><Edit3 className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive rounded-none hover:bg-destructive/10" onClick={() => setItemToDelete({ id: item.id, collection: 'observations', msg: "Delete this observation permanently?" })}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <div className="flex justify-between items-center border-b border-border/30 pb-4">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Custom Pages</h2>
              <Button size="sm" onClick={() => { setEditingPage({ isNew: true }); setPageTitle(''); setPageSlug(''); setPageContent(''); }} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Create New Page</Button>
            </div>
            {editingPage ? (
               <div className="bg-muted/20 border border-border/50 p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Page Title</Label><Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} className="rounded-none" /></div>
                    <div className="space-y-2"><Label>URL Slug</Label><Input value={pageSlug} onChange={e => setPageSlug(e.target.value)} className="rounded-none" /></div>
                  </div>
                  <div className="space-y-2"><Label>Page Content</Label><Textarea value={pageContent} onChange={e => setPageContent(e.target.value)} className="rounded-none h-48" /></div>
                  <div className="flex gap-2">
                    <Button onClick={savePage} disabled={isSaving} className="rounded-none h-8">Save Page</Button>
                    <Button variant="outline" onClick={() => setEditingPage(null)} className="rounded-none h-8">Cancel</Button>
                  </div>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {firestorePages?.filter(p => p.id !== 'sidebar').map((page) => (
                  <div key={page.id} className="p-6 bg-muted/20 border border-border/50 flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-[12pt] font-normal">{page.title}</h3>
                      <p className="text-[9pt] font-mono text-muted-foreground">/p/{page.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="rounded-none" onClick={() => { setEditingPage(page); setPageTitle(page.title); setPageSlug(page.slug); setPageContent(page.content); }}><Edit3 className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive rounded-none hover:bg-destructive/10" onClick={() => setItemToDelete({ id: page.id, collection: 'pages', msg: "Delete this page permanently?" })}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sidebar" className="space-y-6">
            <div className="flex justify-between items-center border-b border-border/30 pb-4">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Sidebar Layout & Content</h2>
              <Button size="sm" onClick={saveSidebar} disabled={isSaving} className="rounded-none h-8 font-normal">
                {isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save All Sidebar Changes
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-muted/10 border border-border/50 p-6 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-[9pt] font-semibold uppercase tracking-widest text-accent">Block 1: Introduction</h3>
                    <div className="space-y-2"><Label>Title Line</Label><Input value={sidebarState.introTitle} onChange={e => setSidebarState({...sidebarState, introTitle: e.target.value})} className="rounded-none" /></div>
                    <div className="space-y-2"><Label>Sub-Intro</Label><Textarea value={sidebarState.introSub} onChange={e => setSidebarState({...sidebarState, introSub: e.target.value})} className="rounded-none h-24" /></div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[9pt] font-semibold uppercase tracking-widest text-accent">Block 2: Commission Note</h3>
                    <div className="space-y-2"><Label>Note Text</Label><Textarea value={sidebarState.commissionNote} onChange={e => setSidebarState({...sidebarState, commissionNote: e.target.value})} className="rounded-none h-24" /></div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[9pt] font-semibold uppercase tracking-widest text-accent">Block 3: Garden Notice</h3>
                    <div className="space-y-2"><Label>Notice Text</Label><Textarea value={sidebarState.gardenNotice} onChange={e => setSidebarState({...sidebarState, gardenNotice: e.target.value})} className="rounded-none h-24" /></div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[9pt] font-semibold uppercase tracking-widest text-accent">Block 4: Contact Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Email</Label><Input value={sidebarState.email} onChange={e => setSidebarState({...sidebarState, email: e.target.value})} className="rounded-none" /></div>
                      <div className="space-y-2"><Label>Phone</Label><Input value={sidebarState.phone} onChange={e => setSidebarState({...sidebarState, phone: e.target.value})} className="rounded-none" /></div>
                    </div>
                    <div className="space-y-2"><Label>Mobile</Label><Input value={sidebarState.mobile} onChange={e => setSidebarState({...sidebarState, mobile: e.target.value})} className="rounded-none" /></div>
                    <div className="space-y-2"><Label>Social Link</Label><Input value={sidebarState.social} onChange={e => setSidebarState({...sidebarState, social: e.target.value})} className="rounded-none" /></div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-accent/5 border border-accent/20 p-6 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-[10pt] font-normal uppercase tracking-widest">Sidebar Layout & Spacing</h3>
                    <p className="text-[8pt] text-muted-foreground">Drag or use arrows to reorder. Set the space after each block.</p>
                  </div>
                  
                  <div className="space-y-3">
                    {sidebarState.layout.map((blockId, index) => (
                      <div key={blockId} className="flex flex-col bg-background border border-border/50 p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{blockLabels[blockId] || blockId}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="size-6" onClick={() => moveSidebarBlock(index, 'up')} disabled={index === 0}><ArrowUp className="size-3" /></Button>
                            <Button variant="ghost" size="icon" className="size-6" onClick={() => moveSidebarBlock(index, 'down')} disabled={index === sidebarState.layout.length - 1}><ArrowDown className="size-3" /></Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-[9px] uppercase tracking-widest whitespace-nowrap">Space After:</Label>
                          <Select 
                            value={sidebarState.spacing[blockId as keyof typeof sidebarState.spacing] || "4"} 
                            onValueChange={(val) => setSidebarState({
                              ...sidebarState, 
                              spacing: { ...sidebarState.spacing, [blockId]: val }
                            })}
                          >
                            <SelectTrigger className="h-7 rounded-none text-[10px]">
                              <SelectValue placeholder="Units" />
                            </SelectTrigger>
                            <SelectContent>
                              {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(u => (
                                <SelectItem key={u} value={u.toString()} className="text-[10px]">{u} Units</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader><DialogTitle>Sculpture Metadata: {editingItem?.id}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3"><Label className="text-[10px] uppercase tracking-widest">Display Title</Label><Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} className="rounded-none" /></div>
              <div><Label className="text-[10px] uppercase tracking-widest">Grid Order</Label><Input type="number" value={itemOrder} onChange={e => setItemOrder(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest">Description</Label><Textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="rounded-none min-h-[100px]" /></div>
          </div>
          <DialogFooter><Button onClick={saveItem} disabled={isSaving || !itemTitle} className="rounded-none w-full">{isSaving ? <Loader2 className="animate-spin size-4 mr-2" /> : <Save className="size-4 mr-2" />} Save Metadata</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-none border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-normal uppercase tracking-widest text-[14px]">Confirm Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/70 leading-relaxed">{itemToDelete?.msg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="rounded-none border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
