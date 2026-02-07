'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { useFirebase, useCollection, useDoc, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Button } from '@/components/ui/button';
import { 
  Trash2, Loader2, RefreshCw, Edit3, Save, Plus, Search, EyeOff, ListFilter, Settings, ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function ManageDashboardPage() {
  const { firebaseApp, auth, firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const [storageData, setStorageData] = useState<{ images: any[], videos: Set<string> }>({ images: [], videos: new Set() });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, collection: 'videos' | 'news' | 'pages', msg: string, actionType?: 'delete' | 'remove-observation' } | null>(null);

  // Sidebar Defaults
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

  // Observation / Gallery Editing State
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCloudBrowserOpen, setIsCloudBrowserOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemOrder, setItemOrder] = useState('0');
  const [itemImagePath, setItemImagePath] = useState('');
  const [itemVideoPath, setItemVideoPath] = useState('');
  const [itemHidden, setItemHidden] = useState(false);
  const [itemIsObservation, setItemIsObservation] = useState(false);

  // News Editing State
  const [editingNews, setEditingNews] = useState<any | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsDate, setNewsDate] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImagePath, setNewsImagePath] = useState('');
  const [newsOrder, setNewsOrder] = useState('0');

  // Custom Pages State
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('');

  // Sidebar State
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
      signInAnonymously(auth).catch((err) => console.error("Auth failed:", err));
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
      toast({ title: "Storage state refreshed" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Refresh failed" });
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

  const homeGalleryItems = useMemo(() => {
    return storageData.images.map(img => {
      const fsData = firestoreVideos?.find(v => v.id === img.id);
      const videoExists = storageData.videos.has(img.id);
      
      return {
        id: img.id,
        title: fsData?.title || img.id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: fsData?.description || "",
        hidden: fsData?.hidden || false,
        order: fsData?.order ?? 999,
        imagePath: fsData?.imagePath || img.path,
        videoPath: fsData?.videoPath || `ks-videos/${img.id}.mp4`,
        isObservation: fsData?.isObservation || false,
        isIndexed: !!fsData,
        hasVideo: videoExists
      };
    }).sort((a: any, b: any) => a.order - b.order);
  }, [storageData, firestoreVideos]);

  const confirmDelete = () => {
    if (!itemToDelete || !firestore) return;

    if (itemToDelete.actionType === 'remove-observation') {
      updateDocumentNonBlocking(doc(firestore, 'videos', itemToDelete.id), {
        isObservation: false
      });
      toast({ title: "Removed from Flow Observations" });
    } else {
      deleteDocumentNonBlocking(doc(firestore, itemToDelete.collection, itemToDelete.id));
      toast({ title: "Item removed", description: "The record has been cleared from the database." });
    }
    setItemToDelete(null);
  };

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

      toast({ title: "Record updated" });
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
      toast({ title: "News update saved" });
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

  const openItemEditor = (item: any) => {
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
          <h1 className="text-[12pt] font-normal uppercase tracking-widest">Management Dashboard</h1>
          <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={isRefreshing} className="rounded-none font-normal">
            <RefreshCw className={cn("size-4 mr-2", isRefreshing && "animate-spin")} /> Refresh All State
          </Button>
        </div>

        <Tabs defaultValue="observations" className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-5 rounded-none bg-muted/50 p-1 mb-8">
            <TabsTrigger value="observations" className="rounded-none">Flow Observations</TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-none">Home Gallery</TabsTrigger>
            <TabsTrigger value="news" className="rounded-none">News</TabsTrigger>
            <TabsTrigger value="pages" className="rounded-none">Pages</TabsTrigger>
            <TabsTrigger value="sidebar" className="rounded-none">Sidebar</TabsTrigger>
          </TabsList>

          <TabsContent value="observations" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">Curated Flow Observations</h2>
                <p className="text-[9pt] text-muted-foreground mt-1">Manage the list appearing on the dedicated Flow Observations page.</p>
              </div>
              <Button size="sm" onClick={() => openItemEditor({ isNew: true, isObservation: true })} className="rounded-none h-8 font-normal">
                <Plus className="size-3 mr-2" /> Add Observation
              </Button>
            </div>

            <div className="space-y-4">
              {observationItems.map((item) => (
                <div key={item.id} className="p-6 bg-muted/20 border border-border/50 flex justify-between items-center group">
                  <div className="flex items-center gap-6">
                    <div className="size-16 bg-black flex items-center justify-center shrink-0 border border-border/50">
                      <FirebaseStorageImage path={item.imagePath} alt={item.title} width={64} height={64} className="object-cover opacity-80" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[12pt] font-normal">{item.title}</h3>
                      <p className="text-[9pt] uppercase tracking-widest text-muted-foreground">Display Order: {item.order}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-none" onClick={() => openItemEditor(item)}><Edit3 className="size-4" /></Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive rounded-none" 
                      onClick={() => setItemToDelete({ 
                        id: item.id, 
                        collection: 'videos', 
                        actionType: 'remove-observation',
                        msg: "Remove this from the Flow Observations list? It will still remain in the Home Gallery." 
                      })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {observationItems.length === 0 && (
                <div className="py-20 text-center border border-dashed border-border/50 bg-muted/5">
                  <ListFilter className="size-8 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-[10pt] text-muted-foreground uppercase tracking-widest">No curated observations.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">Home Page Masonry Index</h2>
                <p className="text-[9pt] text-muted-foreground mt-1">Configure visibility and text for every item on your home page.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeGalleryItems.map((item: any) => (
                <div key={item.id} className={cn("p-4 bg-muted/20 border border-border/50 flex items-center gap-4 transition-all hover:bg-muted/30", item.hidden && "opacity-60")}>
                  <div className="size-16 bg-black shrink-0 relative border border-border/50">
                    <FirebaseStorageImage path={item.imagePath} alt={item.title} width={64} height={64} className="object-cover w-full h-full" />
                    {item.hidden && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><EyeOff className="size-4 text-white" /></div>}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[10pt] font-normal truncate">{item.title}</h3>
                      {!item.isIndexed && <Badge variant="outline" className="text-[7px] h-3.5 rounded-none uppercase tracking-tighter bg-yellow-500/10 border-yellow-500/20">New</Badge>}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[8pt] text-muted-foreground uppercase tracking-widest"># {item.order}</p>
                      {!item.hasVideo && <p className="text-[8pt] text-destructive/80 font-medium">Missing Video</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="size-8 rounded-none" onClick={() => openItemEditor(item)}><Edit3 className="size-4" /></Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 text-destructive rounded-none" 
                      onClick={() => setItemToDelete({ 
                        id: item.id, 
                        collection: 'videos', 
                        msg: "Delete the record for this sculpture? Files in Storage will not be touched, but custom text and order will be reset." 
                      })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
                    <Button variant="outline" size="icon" className="rounded-none" onClick={() => { 
                      setEditingNews(item); 
                      setNewsTitle(item.title); 
                      setNewsDate(item.date); 
                      setNewsContent(item.content); 
                      setNewsImagePath(item.imagePath || ''); 
                      setNewsOrder(item.order?.toString() || '0'); 
                    }}><Edit3 className="size-4" /></Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive rounded-none" 
                      onClick={() => setItemToDelete({ id: item.id, collection: 'news', msg: "Delete this news update permanently?" })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Custom Content Pages</h2>
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
                    <Button variant="outline" size="icon" className="rounded-none" onClick={() => { 
                      setEditingPage(page); 
                      setPageTitle(page.title); 
                      setPageSlug(page.slug); 
                      setPageContent(page.content); 
                    }}><Edit3 className="size-4" /></Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive rounded-none" 
                      onClick={() => setItemToDelete({ id: page.id, collection: 'pages', msg: "Delete this page permanently?" })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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

      {/* Item (Observation/Gallery) Edit Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader>
            <DialogTitle>Sculpture Configuration</DialogTitle>
            <DialogDescription>Update metadata and visibility for this work.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs uppercase tracking-widest">Hide from Gallery</Label>
                  <p className="text-[10px] text-muted-foreground">Remove from home page.</p>
                </div>
                <Switch checked={itemHidden} onCheckedChange={setItemHidden} />
              </div>
              <div className="flex items-center justify-between border-l pl-4 border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-xs uppercase tracking-widest">Mark as Observation</Label>
                  <p className="text-[10px] text-muted-foreground">Add to curated list.</p>
                </div>
                <Switch checked={itemIsObservation} onCheckedChange={setItemIsObservation} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label className="text-[10px] uppercase tracking-widest">Title</Label>
                <Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} className="rounded-none" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest">Order</Label>
                <Input type="number" value={itemOrder} onChange={e => setItemOrder(e.target.value)} className="rounded-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest">Description</Label>
              <Textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="rounded-none min-h-[100px]" />
            </div>
            <div className="space-y-4 border-t border-border/50 pt-4">
              <div className="flex items-center justify-between">
                <Label className="uppercase text-[10px] tracking-widest text-muted-foreground">Storage Asset Linking</Label>
                <Button variant="link" size="sm" className="h-auto p-0 text-[10px] uppercase tracking-widest" onClick={() => setIsCloudBrowserOpen(true)}>
                  <Search className="size-3 mr-1" /> Browse Cloud Storage
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[9px] uppercase">Image Path</Label><Input value={itemImagePath} onChange={e => setItemImagePath(e.target.value)} className="rounded-none text-xs" /></div>
                <div className="space-y-2"><Label className="text-[9px] uppercase">Video Path</Label><Input value={itemVideoPath} onChange={e => setItemVideoPath(e.target.value)} className="rounded-none text-xs" /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveItem} disabled={isSaving || !itemTitle} className="rounded-none w-full sm:w-auto">
              {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cloud Browser Dialog */}
      <Dialog open={isCloudBrowserOpen} onOpenChange={setIsCloudBrowserOpen}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader><DialogTitle className="uppercase tracking-widest text-sm">Cloud Asset Browser</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4 px-2">
            {storageData.images.map((item) => (
              <div key={item.path} className="flex items-center gap-4 p-3 border border-border/50 bg-muted/20 hover:bg-muted/40 cursor-pointer" onClick={() => {
                setItemTitle(item.id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
                setItemImagePath(item.path);
                setItemVideoPath(`ks-videos/${item.name.replace(/\.[^/.]+$/, ".mp4")}`);
                setIsCloudBrowserOpen(false);
              }}>
                <div className="size-12 bg-black flex items-center justify-center shrink-0 border border-border/50">
                  <FirebaseStorageImage path={item.path} alt={item.name} width={48} height={48} className="object-cover opacity-50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-none text-[10px] uppercase tracking-widest">Link Asset</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* News Edit Dialog */}
      <Dialog open={!!editingNews} onOpenChange={(open) => !open && setEditingNews(null)}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader><DialogTitle>{editingNews?.isNew ? 'Create News Update' : 'Edit News Update'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="rounded-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Display Date</Label><Input value={newsDate} onChange={e => setNewsDate(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label>Display Order</Label><Input type="number" value={newsOrder} onChange={e => setNewsOrder(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} className="rounded-none h-40" /></div>
            <div className="space-y-2"><Label>Image Storage Path</Label><Input value={newsImagePath} onChange={e => setNewsImagePath(e.target.value)} className="rounded-none" placeholder="ks-images/news.jpg" /></div>
          </div>
          <DialogFooter><Button onClick={saveNewsItem} disabled={isSaving} className="rounded-none w-full sm:w-auto">Save News</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Page Edit Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent className="max-w-3xl rounded-none">
          <DialogHeader><DialogTitle>{editingPage?.isNew ? 'Create Page' : 'Edit Page Content'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Page Title</Label><Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label>URL Slug</Label><Input value={pageSlug} onChange={e => setPageSlug(e.target.value)} className="rounded-none" placeholder="e.g. contact-us" /></div>
            </div>
            <div className="space-y-2"><Label>Page Content</Label><Textarea value={pageContent} onChange={e => setPageContent(e.target.value)} className="rounded-none h-80" /></div>
          </div>
          <DialogFooter><Button onClick={savePage} disabled={isSaving} className="rounded-none w-full sm:w-auto">Save Page</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Universal Delete Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent Action Required</AlertDialogTitle>
            <AlertDialogDescription>{itemToDelete?.msg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}