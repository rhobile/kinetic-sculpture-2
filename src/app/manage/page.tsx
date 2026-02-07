
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getStorage, ref as storageRef, listAll, uploadBytes } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Button } from '@/components/ui/button';
import { 
  Trash2, Upload, Loader2, RefreshCw, Lock, 
  CheckCircle2, AlertCircle, Edit3, Save, Plus, FileText, Settings,
  Video, Image as ImageIcon, Info, Search
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { EXCLUDED_IMAGES } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function ManageGalleryPage() {
  const { firebaseApp, auth, firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'videos');
  }, [firestore]);
  const { data: firestoreVideos } = useCollection(videosQuery);

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

  // Sculpture Editing State
  const [isSculptureDialogOpen, setIsSculptureDialogOpen] = useState(false);
  const [isCloudBrowserOpen, setIsCloudBrowserOpen] = useState(false);
  const [editingSculpture, setEditingSculpture] = useState<any | null>(null);
  const [sculptureTitle, setSculptureTitle] = useState('');
  const [sculptureDesc, setSculptureDesc] = useState('');
  const [sculptureOrder, setSculptureOrder] = useState('0');
  const [sculptureImage, setSculptureImage] = useState<File | null>(null);
  const [sculptureVideo, setSculptureVideo] = useState<File | null>(null);

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
      signInAnonymously(auth).catch((err) => console.error("Anonymous sign-in failed:", err));
    }
  }, [auth, user, isAuthLoading]);

  const fetchData = useCallback(async () => {
    if (!firebaseApp) return;
    setIsLoading(true);
    try {
      const storage = getStorage(firebaseApp);
      
      const imgRes = await listAll(storageRef(storage, 'ks-images'));
      setImages(imgRes.items.map(item => ({ id: item.fullPath, path: item.fullPath, name: item.name })));

      const vidRes = await listAll(storageRef(storage, 'ks-videos'));
      setVideos(vidRes.items.map(item => ({ id: item.fullPath, path: item.fullPath, name: item.name })));

      toast({ title: "Gallery refreshed" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Refresh failed" });
    } finally {
      setIsLoading(false);
    }
  }, [firebaseApp]);

  useEffect(() => {
    if (firebaseApp) fetchData();
  }, [firebaseApp, fetchData]);

  const combinedSculptures = useMemo(() => {
    const allNames = new Set([
      ...images.map(i => i.name.split('.').slice(0, -1).join('.').toLowerCase()),
      ...videos.map(v => v.name.split('.').slice(0, -1).join('.').toLowerCase())
    ]);

    return Array.from(allNames).map(name => {
      const normalizedKey = name.replace(/[^a-z0-9]/g, '');
      const fsData = firestoreVideos?.find(v => v.id === normalizedKey);
      const img = images.find(i => i.name.split('.').slice(0, -1).join('.').toLowerCase() === name);
      const vid = videos.find(v => v.name.split('.').slice(0, -1).join('.').toLowerCase() === name);
      
      return {
        id: normalizedKey,
        name: name,
        title: fsData?.title || name.replace(/[-_]/g, ' '),
        description: fsData?.description || '',
        order: fsData?.order ?? 999,
        imagePath: img?.path,
        videoPath: vid?.path,
        hasImage: !!img,
        hasVideo: !!vid,
        hasMetadata: !!fsData
      };
    }).sort((a, b) => a.order - b.order);
  }, [images, videos, firestoreVideos]);

  // Filters for Cloud Browser (items in storage but not yet indexed)
  const unindexedItems = useMemo(() => {
    return combinedSculptures.filter(s => !s.hasMetadata);
  }, [combinedSculptures]);

  const saveSculpture = async () => {
    if (!firestore || !firebaseApp || !sculptureTitle) return;
    setIsSaving(true);
    try {
      const storage = getStorage(firebaseApp);
      // Slug-ify the title to create a consistent ID
      const normalizedKey = sculptureTitle.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Only upload if new files were picked from PC
      if (sculptureImage) {
        const iRef = storageRef(storage, `ks-images/${normalizedKey}.jpg`);
        await uploadBytes(iRef, sculptureImage);
      }
      if (sculptureVideo) {
        const vRef = storageRef(storage, `ks-videos/${normalizedKey}.mp4`);
        await uploadBytes(vRef, sculptureVideo);
      }

      await setDoc(doc(firestore, 'videos', normalizedKey), {
        id: normalizedKey,
        title: sculptureTitle,
        description: sculptureDesc,
        order: Number(sculptureOrder) || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({ title: "Sculpture saved successfully" });
      setIsSculptureDialogOpen(false);
      setEditingSculpture(null);
      setSculptureImage(null);
      setSculptureVideo(null);
      await fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const removeSculptureFromIndex = async (sculpture: any) => {
    if (!firestore) return;
    if (!window.confirm(`Remove "${sculpture.title}" from the Index? This will delete the title and description text, but keep the files in your masonry gallery.`)) return;
    
    setIsSaving(true);
    try {
      await deleteDoc(doc(firestore, 'videos', sculpture.id));
      toast({ title: "Removed from index" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to remove entry" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveNewsItem = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const id = editingNews.isNew ? doc(collection(firestore, 'news')).id : editingNews.id;
      await setDoc(doc(firestore, 'news', id), {
        id,
        title: newsTitle,
        date: newsDate,
        content: newsContent,
        imagePath: newsImagePath,
        order: Number(newsOrder) || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "News item saved" });
      setEditingNews(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNewsItem = async (id: string) => {
    if (!firestore || !window.confirm("Delete this news update?")) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(firestore, 'news', id));
      toast({ title: "News item deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const savePage = async () => {
    if (!firestore || !pageSlug) return;
    setIsSaving(true);
    try {
      const cleanedSlug = pageSlug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await setDoc(doc(firestore, 'pages', cleanedSlug), {
        id: cleanedSlug,
        title: pageTitle,
        slug: cleanedSlug,
        content: pageContent,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      if (!editingPage.isNew && editingPage.id !== cleanedSlug) await deleteDoc(doc(firestore, 'pages', editingPage.id));
      toast({ title: "Page saved" });
      setEditingPage(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!firestore || !window.confirm("Delete this page?")) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(firestore, 'pages', id));
      toast({ title: "Page deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveSidebar = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'pages', 'sidebar'), { ...sidebarState, updatedAt: new Date().toISOString() }, { merge: true });
      toast({ title: "Sidebar updated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update failed" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
          <h1 className="text-[12pt] font-normal uppercase tracking-widest">Management Dashboard</h1>
          <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={isLoading} className="rounded-none font-normal">
            <RefreshCw className={cn("size-4 mr-2", isLoading && "animate-spin")} /> Refresh Files
          </Button>
        </div>

        <Tabs defaultValue="sculptures" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 rounded-none bg-muted/50 p-1 mb-8">
            <TabsTrigger value="sculptures" className="rounded-none">Sculptures</TabsTrigger>
            <TabsTrigger value="news" className="rounded-none">News</TabsTrigger>
            <TabsTrigger value="pages" className="rounded-none">Pages</TabsTrigger>
            <TabsTrigger value="sidebar" className="rounded-none">Sidebar</TabsTrigger>
          </TabsList>

          <TabsContent value="sculptures" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">Sculptures Index</h2>
                <p className="text-[9pt] text-muted-foreground">"Delete" only removes the Index entry, keeping files in the gallery.</p>
              </div>
              <Button onClick={() => {
                setEditingSculpture(null);
                setSculptureTitle('');
                setSculptureDesc('');
                setSculptureOrder('0');
                setSculptureImage(null);
                setSculptureVideo(null);
                setIsSculptureDialogOpen(true);
              }} className="rounded-none h-8 font-normal text-[10pt]">
                <Plus className="size-3 mr-2" /> Add Sculpture
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {combinedSculptures.map((sculpture) => (
                <div key={sculpture.id} className="bg-muted/20 border border-border/50 overflow-hidden flex flex-col group relative">
                  <div className="aspect-video relative bg-black">
                    {sculpture.imagePath ? (
                      <FirebaseStorageImage path={sculpture.imagePath} alt={sculpture.title} width={400} height={225} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] uppercase">No Image</div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-sm font-mono">#{sculpture.order}</span>
                      {sculpture.hasMetadata && (
                        <span className="bg-green-600/80 text-white text-[9px] px-2 py-1 rounded-sm uppercase tracking-tighter">In Index</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex-1 space-y-2">
                    <h3 className="text-[11pt] font-normal truncate">{sculpture.title}</h3>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ImageIcon className={cn("size-3", sculpture.hasImage ? "text-green-500" : "text-destructive")} />
                        <span className="text-[9px] uppercase">JPG</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className={cn("size-3", sculpture.hasVideo ? "text-green-500" : "text-destructive")} />
                        <span className="text-[9px] uppercase">MP4</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 border-t border-border/50 bg-muted/30 flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="rounded-none" onClick={() => {
                      setEditingSculpture(sculpture);
                      setSculptureTitle(sculpture.title);
                      setSculptureDesc(sculpture.description);
                      setSculptureOrder(sculpture.order.toString());
                      setIsSculptureDialogOpen(true);
                    }}><Edit3 className="size-4" /></Button>
                    {sculpture.hasMetadata && (
                      <Button variant="ghost" size="icon" className="text-destructive rounded-none" onClick={() => removeSculptureFromIndex(sculpture)}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* News Content */}
          <TabsContent value="news" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">News Updates</h2>
              <Button size="sm" onClick={() => { setEditingNews({ isNew: true }); setNewsTitle(''); setNewsDate(new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })); setNewsContent(''); }} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Add News</Button>
            </div>
            <div className="space-y-4">
              {firestoreNews?.map((item) => (
                <div key={item.id} className="p-6 bg-muted/20 border border-border/50 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[9pt] uppercase tracking-widest text-muted-foreground">{item.date}</p>
                    <h3 className="text-[12pt] font-normal">{item.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => { setEditingNews(item); setNewsTitle(item.title); setNewsDate(item.date); setNewsContent(item.content); setNewsImagePath(item.imagePath || ''); setNewsOrder(item.order?.toString() || '0'); }}><Edit3 className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteNewsItem(item.id)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Pages Content */}
          <TabsContent value="pages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Custom Pages</h2>
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
                    <Button variant="outline" size="icon" onClick={() => { setEditingPage(page); setPageTitle(page.title); setPageSlug(page.slug); setPageContent(page.content); }}><Edit3 className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePage(page.id)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Sidebar Content */}
          <TabsContent value="sidebar" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Sidebar Content</h2>
              <Button size="sm" onClick={saveSidebar} disabled={isSaving} className="rounded-none h-8 font-normal">
                {isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save
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
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Sculpture Dialog */}
      <Dialog open={isSculptureDialogOpen} onOpenChange={setIsSculptureDialogOpen}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader>
            <DialogTitle>{editingSculpture ? 'Edit Sculpture' : 'Add New Sculpture'}</DialogTitle>
            <DialogDescription>Add titles and descriptions to items in your collection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label>Title</Label>
                <Input value={sculptureTitle} onChange={e => setSculptureTitle(e.target.value)} placeholder="e.g. Arc Line Dot" className="rounded-none" />
              </div>
              <div>
                <Label>Order</Label>
                <Input type="number" value={sculptureOrder} onChange={e => setSculptureOrder(e.target.value)} className="rounded-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={sculptureDesc} onChange={e => setSculptureDesc(e.target.value)} className="rounded-none min-h-[100px]" />
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground uppercase text-[10px] tracking-widest">Storage Files</Label>
                {!editingSculpture && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-[10px] uppercase tracking-wider" onClick={() => setIsCloudBrowserOpen(true)}>
                    <Search className="size-3 mr-1" /> Import from Cloud Storage
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><ImageIcon className="size-4" /> Sculpture Image (.jpg)</Label>
                  <Input type="file" accept=".jpg,.jpeg" onChange={e => setSculptureImage(e.target.files?.[0] || null)} className="rounded-none" />
                  {editingSculpture?.imagePath && <p className="text-[9px] text-muted-foreground truncate">{editingSculpture.imagePath}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Video className="size-4" /> Sculpture Video (.mp4)</Label>
                  <Input type="file" accept=".mp4" onChange={e => setSculptureVideo(e.target.files?.[0] || null)} className="rounded-none" />
                  {editingSculpture?.videoPath && <p className="text-[9px] text-muted-foreground truncate">{editingSculpture.videoPath}</p>}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveSculpture} disabled={isSaving || !sculptureTitle} className="rounded-none w-full sm:w-auto">
              {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
              {editingSculpture ? 'Save Changes' : 'Add Sculpture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cloud Browser Dialog */}
      <Dialog open={isCloudBrowserOpen} onOpenChange={setIsCloudBrowserOpen}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>Cloud Storage Browser</DialogTitle>
            <DialogDescription>Pick a sculpture already in your cloud storage to add to the index.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
            {unindexedItems.length > 0 ? (
              unindexedItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 p-3 border border-border/50 bg-muted/20 hover:bg-muted/40 cursor-pointer"
                  onClick={() => {
                    setEditingSculpture(null);
                    setSculptureTitle(item.title);
                    setSculptureDesc('');
                    setSculptureOrder('0');
                    setIsCloudBrowserOpen(false);
                  }}
                >
                  <div className="size-12 bg-black flex items-center justify-center shrink-0">
                    {item.imagePath ? (
                      <FirebaseStorageImage path={item.imagePath} alt={item.title} width={48} height={48} className="object-cover opacity-50" />
                    ) : <ImageIcon className="size-4 text-white/20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                      {item.hasImage && "JPG"} {item.hasVideo && "MP4"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-none">Select</Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8 italic">No unindexed items found in Storage.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* News Dialog */}
      <Dialog open={!!editingNews} onOpenChange={() => setEditingNews(null)}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader><DialogTitle>{editingNews?.isNew ? 'New Update' : 'Edit Update'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title</Label><Input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label>Date</Label><Input value={newsDate} onChange={e => setNewsDate(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2"><Label>Description Content</Label><Textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} className="rounded-none min-h-[200px]" /></div>
          </div>
          <DialogFooter><Button onClick={saveNewsItem} disabled={isSaving} className="rounded-none">Save News</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Dialog */}
      <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader><DialogTitle>{editingPage?.isNew ? 'New Page' : 'Edit Page'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title</Label><Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={pageSlug} onChange={e => setPageSlug(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={pageContent} onChange={e => setPageContent(e.target.value)} className="rounded-none min-h-[300px]" /></div>
          </div>
          <DialogFooter><Button onClick={savePage} disabled={isSaving} className="rounded-none">Save Page</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
