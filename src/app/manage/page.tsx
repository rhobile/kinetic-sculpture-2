'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, query, orderBy, setDoc } from 'firebase/firestore';
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
  Trash2, Loader2, RefreshCw, Save, Plus, LayoutGrid, Info
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
import { cn } from '@/lib/utils';
import { EXCLUDED_IMAGES } from '@/lib/constants';

export default function ManageDashboardPage() {
  const { firebaseApp, auth, firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const [storageData, setStorageData] = useState<{ images: any[] }>({ images: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, collection: 'videos' | 'news' | 'pages' | 'observations', msg: string } | null>(null);

  const SIDEBAR_DEFAULT = `Kinetic sculptures by Andrew Jones.\n\nMainly linear elements balanced and articulated to move simply in the wind, light or strong.\n\nI work to commission. Guide prices are given below the videos or a price for a limited edition.\n\n[News (if there is any)](/news)\n\n[Flow observations of wind and water](/observations)\n\nIt is difficult to appreciate the movement out of the context of a breeze in a garden, so please visit our garden in July each year.\n\nIf you would like to visit at another time, please contact me.\n\nandrew@rhobile.com\nTelephone +44 (0)1353 610406\nMobile +44 (0)781 4179181\n@Rhobile`;

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

  // UI State
  const [sidebarContent, setSidebarContent] = useState('');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemOrder, setItemOrder] = useState('0');

  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [entryType, setEntryType] = useState<'news' | 'observations'>('news');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryImagePath, setEntryImagePath] = useState('');
  const [entryVideoId, setEntryVideoId] = useState('');

  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('');

  useEffect(() => {
    if (sidebarData?.content) {
      setSidebarContent(sidebarData.content);
    } else if (sidebarData === null) {
      setSidebarContent(SIDEBAR_DEFAULT);
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
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Entry updated" });
      setEditingEntry(null);
    } finally {
      setIsSaving(false);
    }
  };

  const savePage = async () => {
    if (!firestore || !pageTitle || !pageSlug) return;
    setIsSaving(true);
    try {
      const id = editingPage?.isNew ? pageSlug.toLowerCase().trim() : editingPage.id;
      const docRef = doc(firestore, 'pages', id);
      setDocumentNonBlocking(docRef, {
        id,
        title: pageTitle,
        slug: pageSlug,
        content: pageContent,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Page updated" });
      setEditingPage(null);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSidebar = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const docRef = doc(firestore, 'pages', 'sidebar');
      await setDoc(docRef, {
        content: sidebarContent,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Sidebar updated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = useCallback(() => {
    if (!itemToDelete || !firestore) return;
    const { id, collection: col } = itemToDelete;
    const docRef = doc(firestore, col, id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Record removed" });
    setItemToDelete(null);
  }, [itemToDelete, firestore]);

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <LayoutGrid className="size-6 text-muted-foreground" />
            <h1 className="text-[12pt] font-normal uppercase tracking-widest text-foreground/80">Management Dashboard</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={isRefreshing} className="rounded-none font-normal">
            <RefreshCw className={cn("size-4 mr-2", isRefreshing && "animate-spin")} /> Sync Storage
          </Button>
        </div>

        <Tabs defaultValue="sidebar" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5 rounded-none bg-muted/50 p-1 mb-8">
            <TabsTrigger value="sidebar" className="rounded-none">Sidebar</TabsTrigger>
            <TabsTrigger value="masonry" className="rounded-none">Masonry</TabsTrigger>
            <TabsTrigger value="news" className="rounded-none">News</TabsTrigger>
            <TabsTrigger value="obs" className="rounded-none">Observations</TabsTrigger>
            <TabsTrigger value="pages" className="rounded-none">Pages</TabsTrigger>
          </TabsList>

          <TabsContent value="sidebar" className="space-y-6">
            <div className="flex justify-between items-center border-b border-border/30 pb-4">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Unified Sidebar Content</h2>
              <Button size="sm" onClick={saveSidebar} disabled={isSaving} className="rounded-none h-8 font-normal">
                {isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save Sidebar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10pt] font-normal uppercase tracking-widest">Full Sidebar Text</Label>
                  <Textarea 
                    value={sidebarContent} 
                    onChange={e => setSidebarContent(e.target.value)} 
                    className="rounded-none h-[600px] font-mono text-sm leading-relaxed p-6"
                    placeholder="Type your sidebar content here..."
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-accent/5 border border-accent/20 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-accent">
                    <Info className="size-4" />
                    <h3 className="text-[10pt] font-normal uppercase tracking-widest">How to add links</h3>
                  </div>
                  <p className="text-[12px] text-foreground/70 leading-relaxed">
                    To turn words into a blue link, use the following format:<br /><br />
                    <code className="bg-muted px-1 py-0.5 rounded text-accent">[Link Label](/url)</code>
                  </p>
                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Useful URLs:</p>
                    <ul className="space-y-2 text-[12px] font-mono">
                      <li>News: <code className="text-accent">/news</code></li>
                      <li>Observations: <code className="text-accent">/observations</code></li>
                      <li>Home: <code className="text-accent">/</code></li>
                      <li>Custom Page: <code className="text-accent">/p/your-slug</code></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="masonry" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masonryItems.map((item: any) => (
                <div key={item.id} className={cn("p-4 border flex items-center gap-4", item.isIndexed ? "bg-muted/30 border-border/50 shadow-sm" : "bg-background border-dashed border-border/40 opacity-70")}>
                  <div className="size-16 bg-black shrink-0 relative border border-border/50 overflow-hidden">
                    <FirebaseStorageImage path={item.imagePath} alt={item.title} width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10pt] font-normal truncate">{item.title}</h3>
                    <p className="text-[8pt] text-accent font-mono break-all leading-tight mt-1">{item.id}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-none h-6 px-2 text-[9px] uppercase tracking-widest" onClick={() => {
                    setEditingItem(item);
                    setItemTitle(item.title || '');
                    setItemDesc(item.description || '');
                    setItemOrder(item.order?.toString() || '0');
                    setIsItemDialogOpen(true);
                  }}>Edit</Button>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="news" className="space-y-6">
            <Button size="sm" onClick={() => { setEntryType('news'); setEditingEntry({ isNew: true }); setEntryTitle(''); setEntryDate(''); setEntryContent(''); setEntryImagePath(''); setEntryVideoId(''); }} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Add News Entry</Button>
            {editingEntry && entryType === 'news' && (
              <div className="bg-muted/20 border border-border/50 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={entryTitle} onChange={e => setEntryTitle(e.target.value)} className="rounded-none" /></div>
                  <div className="space-y-2"><Label>Date Label</Label><Input value={entryDate} onChange={e => setEntryDate(e.target.value)} className="rounded-none" /></div>
                </div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={entryContent} onChange={e => setEntryContent(e.target.value)} className="rounded-none h-32" /></div>
                <div className="flex gap-2"><Button onClick={saveEntry} disabled={isSaving} className="rounded-none h-8">Save</Button><Button variant="outline" onClick={() => setEditingEntry(null)} className="rounded-none h-8">Cancel</Button></div>
              </div>
            )}
            <div className="space-y-4">
              {firestoreNews?.map((item) => (
                <div key={item.id} className="p-4 bg-muted/20 border border-border/50 flex justify-between items-center">
                  <h3 className="text-[10pt] font-normal">{item.title}</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-none" onClick={() => { setEntryType('news'); setEditingEntry(item); setEntryTitle(item.title); setEntryDate(item.date); setEntryContent(item.content); setEntryImagePath(item.imagePath || ''); setEntryVideoId(item.videoId || ''); }}>Edit</Button>
                    <Button variant="ghost" size="sm" className="rounded-none text-destructive" onClick={() => setItemToDelete({ id: item.id, collection: 'news', msg: `Delete news item "${item.title}"?` })}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="obs" className="space-y-6">
             <Button size="sm" onClick={() => { setEntryType('observations'); setEditingEntry({ isNew: true }); setEntryTitle(''); setEntryDate(''); setEntryContent(''); setEntryImagePath(''); setEntryVideoId(''); }} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Add Observation</Button>
             {editingEntry && entryType === 'observations' && (
              <div className="bg-muted/20 border border-border/50 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={entryTitle} onChange={e => setEntryTitle(e.target.value)} className="rounded-none" /></div>
                  <div className="space-y-2"><Label>Date Label</Label><Input value={entryDate} onChange={e => setEntryDate(e.target.value)} className="rounded-none" /></div>
                </div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={entryContent} onChange={e => setEntryContent(e.target.value)} className="rounded-none h-32" /></div>
                <div className="flex gap-2"><Button onClick={saveEntry} disabled={isSaving} className="rounded-none h-8">Save</Button><Button variant="outline" onClick={() => setEditingEntry(null)} className="rounded-none h-8">Cancel</Button></div>
              </div>
            )}
            <div className="space-y-4">
              {firestoreObs?.map((item) => (
                <div key={item.id} className="p-4 bg-muted/20 border border-border/50 flex justify-between items-center">
                  <h3 className="text-[10pt] font-normal">{item.title}</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-none" onClick={() => { setEntryType('observations'); setEditingEntry(item); setEntryTitle(item.title); setEntryDate(item.date); setEntryContent(item.content); setEntryImagePath(item.imagePath || ''); setEntryVideoId(item.videoId || ''); }}>Edit</Button>
                    <Button variant="ghost" size="sm" className="rounded-none text-destructive" onClick={() => setItemToDelete({ id: item.id, collection: 'observations', msg: `Delete observation "${item.title}"?` })}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <Button size="sm" onClick={() => { setEditingPage({ isNew: true }); setPageTitle(''); setPageSlug(''); setPageContent(''); }} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Create Page</Button>
            {editingPage && (
              <div className="bg-muted/20 border border-border/50 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} className="rounded-none" /></div>
                  <div className="space-y-2"><Label>Slug</Label><Input value={pageSlug} onChange={e => setPageSlug(e.target.value)} className="rounded-none" /></div>
                </div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={pageContent} onChange={e => setPageContent(e.target.value)} className="rounded-none h-48" /></div>
                <div className="flex gap-2"><Button onClick={savePage} disabled={isSaving} className="rounded-none h-8">Save</Button><Button variant="outline" onClick={() => setEditingPage(null)} className="rounded-none h-8">Cancel</Button></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {firestorePages?.filter(p => p.id !== 'sidebar').map((page) => (
                <div key={page.id} className="p-4 bg-muted/20 border border-border/50 flex justify-between items-center">
                  <h3 className="text-[10pt] font-normal">{page.title}</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-none" onClick={() => { setEditingPage(page); setPageTitle(page.title); setPageSlug(page.slug); setPageContent(page.content); }}>Edit</Button>
                    <Button variant="ghost" size="sm" className="rounded-none text-destructive" onClick={() => setItemToDelete({ id: page.id, collection: 'pages', msg: `Delete page "${page.title}"?` })}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader><DialogTitle>Sculpture Metadata</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3"><Label className="text-[10px] uppercase">Title</Label><Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} className="rounded-none" /></div>
              <div><Label className="text-[10px] uppercase">Order</Label><Input type="number" value={itemOrder} onChange={e => setItemOrder(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2"><Label className="text-[10px] uppercase">Description</Label><Textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="rounded-none h-24" /></div>
          </div>
          <DialogFooter><Button onClick={saveItem} disabled={isSaving} className="rounded-none w-full">Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase tracking-widest text-sm">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>{itemToDelete?.msg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className="rounded-none bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
