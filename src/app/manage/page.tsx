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
  setDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Button } from '@/components/ui/button';
import { 
  Trash2, Loader2, RefreshCw, Edit3, Save, Plus, EyeOff, LayoutGrid
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function ManageDashboardPage() {
  const { firebaseApp, auth, firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const [storageData, setStorageData] = useState<{ images: any[], videos: Set<string> }>({ images: [], videos: new Set() });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, collection: 'videos' | 'news' | 'pages', msg: string, actionType?: 'delete' | 'remove-observation' } | null>(null);

  const SIDEBAR_DEFAULTS = {
    introTitle: "Kinetic sculptures by Andrew Jones.",
    introSub: "Mainly linear elements balanced and articulated to move simply in the wind, light or strong.",
    commissionNote: "I work to commission. Guide prices are given below the videos or a price for a limited edition.",
    gardenNotice: "It is difficult to appreciate the movement out of the context of a breeze in a garden, so please visit our garden in July each year.",
    email: "andrew@rhobile.com",
    phone: "Telephone +44 (0)1353 610406",
    mobile: "Mobile +44 (0)781 4179181",
    social: "@Rhobile"
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
  const [itemImagePath, setItemImagePath] = useState('');
  const [itemVideoPath, setItemVideoPath] = useState('');
  const [itemHidden, setItemHidden] = useState(false);
  const [itemIsObservation, setItemIsObservation] = useState(false);

  // UI State - News
  const [editingNews, setEditingNews] = useState<any | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsDate, setNewsDate] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImagePath, setNewsImagePath] = useState('');
  const [newsOrder, setNewsOrder] = useState('0');

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
        introTitle: sidebarData.introTitle || SIDEBAR_DEFAULTS.introTitle,
        introSub: sidebarData.introSub || SIDEBAR_DEFAULTS.introSub,
        commissionNote: sidebarData.commissionNote || SIDEBAR_DEFAULTS.commissionNote,
        gardenNotice: sidebarData.gardenNotice || SIDEBAR_DEFAULTS.gardenNotice,
        email: sidebarData.email || SIDEBAR_DEFAULTS.email,
        phone: sidebarData.phone || SIDEBAR_DEFAULTS.phone,
        mobile: sidebarData.mobile || SIDEBAR_DEFAULTS.mobile,
        social: sidebarData.social || SIDEBAR_DEFAULTS.social
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
      const [imgRes, vidRes] = await Promise.all([
        listAll(storageRef(storage, 'ks-images')),
        listAll(storageRef(storage, 'ks-videos'))
      ]);

      const videos = new Set(vidRes.items.map(v => v.name.split('.').slice(0, -1).join('.').toLowerCase()));
      const images = imgRes.items.map(item => ({ 
        id: item.name.split('.').slice(0, -1).join('.').toLowerCase(), 
        path: item.fullPath, 
        name: item.name 
      }));

      setStorageData({ images, videos });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Storage refresh failed", description: error.message });
    } finally {
      setIsRefreshing(false);
    }
  }, [firebaseApp]);

  useEffect(() => {
    if (firebaseApp) fetchData();
  }, [firebaseApp, fetchData]);

  const observationItems = useMemo(() => {
    if (!firestoreVideos) return [];
    return firestoreVideos.filter(v => v.isObservation === true).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [firestoreVideos]);

  const masonryItems = useMemo(() => {
    return storageData.images.map(img => {
      const fsData = firestoreVideos?.find(v => v.id === img.id);
      return {
        id: img.id,
        title: fsData?.title || img.id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: fsData?.description || "",
        hidden: fsData?.hidden || false,
        order: fsData?.order ?? 999,
        imagePath: fsData?.imagePath || img.path,
        videoPath: fsData?.videoPath || `ks-videos/${img.id}.mp4`,
        isObservation: fsData?.isObservation || false,
        isIndexed: !!fsData
      };
    }).sort((a: any, b: any) => a.order - b.order);
  }, [storageData, firestoreVideos]);

  // Handler Functions
  const saveItem = async () => {
    if (!firestore || !itemTitle) return;
    setIsSaving(true);
    try {
      const id = editingItem?.id || itemTitle.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const docRef = doc(firestore, 'videos', id);
      
      setDocumentNonBlocking(docRef, {
        id,
        title: itemTitle,
        description: itemDesc,
        order: Number(itemOrder) || 0,
        hidden: itemHidden,
        isObservation: itemIsObservation,
        imagePath: itemImagePath,
        videoPath: itemVideoPath,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({ title: "Masonry item saved" });
      setIsItemDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveNewsItem = async () => {
    if (!firestore || !newsTitle) return;
    setIsSaving(true);
    try {
      const id = editingNews?.id || newsTitle.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const docRef = doc(firestore, 'news', id);
      setDocumentNonBlocking(docRef, {
        id,
        title: newsTitle,
        date: newsDate,
        content: newsContent,
        imagePath: newsImagePath,
        order: Number(newsOrder) || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "News item updated" });
      setEditingNews(null);
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
      const id = editingPage?.id || pageSlug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
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
      setDocumentNonBlocking(docRef, sidebarState, { merge: true });
      toast({ title: "Sidebar content updated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!itemToDelete || !firestore) return;
    if (itemToDelete.actionType === 'remove-observation') {
      updateDocumentNonBlocking(doc(firestore, 'videos', itemToDelete.id), { isObservation: false });
      toast({ title: "Removed from Flow Observations" });
    } else {
      deleteDocumentNonBlocking(doc(firestore, itemToDelete.collection, itemToDelete.id));
      toast({ title: "Record deleted" });
    }
    setItemToDelete(null);
  };

  const openMasonryEditor = (item: any) => {
    setEditingItem(item);
    setItemTitle(item.title || '');
    setItemDesc(item.description || '');
    setItemOrder(item.order?.toString() || '0');
    setItemImagePath(item.imagePath || '');
    setItemVideoPath(item.videoPath || '');
    setItemHidden(item.hidden || false);
    setItemIsObservation(item.isObservation || false);
    setIsItemDialogOpen(true);
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <LayoutGrid className="size-6 text-muted-foreground" />
            <h1 className="text-[12pt] font-normal uppercase tracking-widest">Management Dashboard</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={isRefreshing} className="rounded-none font-normal">
            <RefreshCw className={cn("size-4 mr-2", isRefreshing && "animate-spin")} /> Refresh State
          </Button>
        </div>

        <Tabs defaultValue="masonry" className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-5 rounded-none bg-muted/50 p-1 mb-8">
            <TabsTrigger value="masonry" className="rounded-none">Edit Masonry</TabsTrigger>
            <TabsTrigger value="observations" className="rounded-none">Observations</TabsTrigger>
            <TabsTrigger value="news" className="rounded-none">News</TabsTrigger>
            <TabsTrigger value="pages" className="rounded-none">Pages</TabsTrigger>
            <TabsTrigger value="sidebar" className="rounded-none">Sidebar</TabsTrigger>
          </TabsList>

          <TabsContent value="masonry" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Masonry Gallery Index</h2>
              <p className="text-[9pt] text-muted-foreground">Manage your portfolio grid items and text.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masonryItems.map((item: any) => (
                <div key={item.id} className={cn("p-4 bg-muted/20 border border-border/50 flex items-center gap-4", item.hidden && "opacity-60")}>
                  <div className="size-16 bg-black shrink-0 relative border border-border/50 overflow-hidden">
                    <FirebaseStorageImage path={item.imagePath} alt={item.title} width={64} height={64} className="object-cover w-full h-full" />
                    {item.hidden && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><EyeOff className="size-4 text-white" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10pt] font-normal truncate">{item.title}</h3>
                    <p className="text-[8pt] text-muted-foreground uppercase tracking-widest">Order: {item.order}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="rounded-none h-8 text-[9px] uppercase tracking-widest" onClick={() => openMasonryEditor(item)}>Edit Details</Button>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive rounded-none" onClick={() => setItemToDelete({ id: item.id, collection: 'videos', msg: "Remove metadata for this sculpture? This will revert its title to the filename and reset its order." })}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="observations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Curated Flow Observations</h2>
              <Button size="sm" onClick={() => openMasonryEditor({ isNew: true, isObservation: true })} className="rounded-none h-8 font-normal">
                <Plus className="size-3 mr-2" /> Add Observation
              </Button>
            </div>
            <div className="space-y-4">
              {observationItems.map((item) => (
                <div key={item.id} className="p-6 bg-muted/20 border border-border/50 flex justify-between items-center group">
                  <div className="flex items-center gap-6">
                    <div className="size-16 bg-black flex items-center justify-center shrink-0 border border-border/50 overflow-hidden">
                      <FirebaseStorageImage path={item.imagePath} alt={item.title} width={64} height={64} className="object-cover opacity-80" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[12pt] font-normal">{item.title}</h3>
                      <p className="text-[9pt] uppercase tracking-widest text-muted-foreground">Order: {item.order}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-none" onClick={() => openMasonryEditor(item)}><Edit3 className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive rounded-none" onClick={() => setItemToDelete({ id: item.id, collection: 'videos', actionType: 'remove-observation', msg: "Remove this from curated observations?" })}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">News Updates</h2>
              <Button size="sm" onClick={() => { setEditingNews({ isNew: true }); setNewsTitle(''); setNewsDate(new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })); setNewsContent(''); setNewsImagePath(''); setNewsOrder('0'); }} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Add News</Button>
            </div>
            <div className="space-y-4">
              {firestoreNews?.map((item) => (
                <div key={item.id} className="p-6 bg-muted/20 border border-border/50 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[9pt] uppercase tracking-widest text-muted-foreground">{item.date}</p>
                    <h3 className="text-[12pt] font-normal">{item.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-none" onClick={() => { setEditingNews(item); setNewsTitle(item.title); setNewsDate(item.date); setNewsContent(item.content); setNewsImagePath(item.imagePath || ''); setNewsOrder(item.order?.toString() || '0'); }}><Edit3 className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive rounded-none" onClick={() => setItemToDelete({ id: item.id, collection: 'news', msg: "Delete this news item?" })}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Content Pages</h2>
              <Button size="sm" onClick={() => { setEditingPage({ isNew: true }); setPageTitle(''); setPageSlug(''); setPageContent(''); }} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Add Page</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {firestorePages?.filter(p => p.id !== 'sidebar').map((page) => (
                <div key={page.id} className="p-6 bg-muted/20 border border-border/50 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-[12pt] font-normal">{page.title}</h3>
                    <p className="text-[9pt] font-mono text-muted-foreground">/p/{page.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-none" onClick={() => { setEditingPage(page); setPageTitle(page.title); setPageSlug(page.slug); setPageContent(page.content); }}><Edit3 className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive rounded-none" onClick={() => setItemToDelete({ id: page.id, collection: 'pages', msg: "Delete this page?" })}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sidebar" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Sidebar Branding</h2>
              <Button size="sm" onClick={saveSidebar} disabled={isSaving} className="rounded-none h-8 font-normal">
                {isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save Changes
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/20 border border-border/50 p-6">
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title Line</Label><Input value={sidebarState.introTitle} onChange={e => setSidebarState({...sidebarState, introTitle: e.target.value})} className="rounded-none" /></div>
                <div className="space-y-2"><Label>Sub-Intro</Label><Textarea value={sidebarState.introSub} onChange={e => setSidebarState({...sidebarState, introSub: e.target.value})} className="rounded-none h-24" /></div>
                <div className="space-y-2"><Label>Commission Note</Label><Textarea value={sidebarState.commissionNote} onChange={e => setSidebarState({...sidebarState, commissionNote: e.target.value})} className="rounded-none h-24" /></div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Garden Notice</Label><Textarea value={sidebarState.gardenNotice} onChange={e => setSidebarState({...sidebarState, gardenNotice: e.target.value})} className="rounded-none h-24" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Email</Label><Input value={sidebarState.email} onChange={e => setSidebarState({...sidebarState, email: e.target.value})} className="rounded-none" /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={sidebarState.phone} onChange={e => setSidebarState({...sidebarState, phone: e.target.value})} className="rounded-none" /></div>
                </div>
                <div className="space-y-2"><Label>Mobile</Label><Input value={sidebarState.mobile} onChange={e => setSidebarState({...sidebarState, mobile: e.target.value})} className="rounded-none" /></div>
                <div className="space-y-2"><Label>Social Link</Label><Input value={sidebarState.social} onChange={e => setSidebarState({...sidebarState, social: e.target.value})} className="rounded-none" /></div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Item Editor Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader>
            <DialogTitle>Masonry Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs uppercase tracking-widest">Hide from Masonry</Label>
                </div>
                <Switch checked={itemHidden} onCheckedChange={setItemHidden} />
              </div>
              <div className="flex items-center justify-between border-l pl-4 border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-xs uppercase tracking-widest">Observation Mode</Label>
                </div>
                <Switch checked={itemIsObservation} onCheckedChange={setItemIsObservation} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label className="text-[10px] uppercase tracking-widest">Display Title</Label>
                <Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} className="rounded-none" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest">Grid Order</Label>
                <Input type="number" value={itemOrder} onChange={e => setItemOrder(e.target.value)} className="rounded-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest">Description</Label>
              <Textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="rounded-none min-h-[100px]" />
            </div>
          </div>
          <DialogFooter><Button onClick={saveItem} disabled={isSaving || !itemTitle} className="rounded-none w-full">{isSaving ? <Loader2 className="animate-spin size-4 mr-2" /> : <Save className="size-4 mr-2" />} Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* News Dialog */}
      <Dialog open={!!editingNews} onOpenChange={(open) => !open && setEditingNews(null)}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader><DialogTitle>{editingNews?.isNew ? 'Add News' : 'Edit News'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="rounded-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input value={newsDate} onChange={e => setNewsDate(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label>Order</Label><Input type="number" value={newsOrder} onChange={e => setNewsOrder(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} className="rounded-none h-40" /></div>
            <div className="space-y-2"><Label>Image Path</Label><Input value={newsImagePath} onChange={e => setNewsImagePath(e.target.value)} className="rounded-none" /></div>
          </div>
          <DialogFooter><Button onClick={saveNewsItem} disabled={isSaving} className="rounded-none">Save News</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent className="max-w-3xl rounded-none">
          <DialogHeader><DialogTitle>{editingPage?.isNew ? 'Add Page' : 'Edit Page'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title</Label><Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={pageSlug} onChange={e => setPageSlug(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={pageContent} onChange={e => setPageContent(e.target.value)} className="rounded-none h-80" /></div>
          </div>
          <DialogFooter><Button onClick={savePage} disabled={isSaving} className="rounded-none">Save Page</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>{itemToDelete?.msg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-none bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
