
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { useFirebase, useCollection, useDoc, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Button } from '@/components/ui/button';
import { 
  Trash2, Loader2, RefreshCw, Edit3, Save, Plus, Image as ImageIcon, Search, AlertCircle, EyeOff, Eye
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

export default function ManageGalleryPage() {
  const { firebaseApp, auth, firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const [images, setImages] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, collection: 'videos' | 'news' | 'pages', msg: string } | null>(null);

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
    return query(collection(firestore, 'videos'), orderBy('order', 'asc'));
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
  const [sculptureImagePath, setSculptureImagePath] = useState('');
  const [sculptureVideoPath, setSculptureVideoPath] = useState('');
  const [sculptureHidden, setSculptureHidden] = useState(false);

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
      const imgRes = await listAll(storageRef(storage, 'ks-images'));
      setImages(imgRes.items.map(item => ({ 
        id: item.name.split('.').slice(0, -1).join('.').toLowerCase(), 
        path: item.fullPath, 
        name: item.name 
      })));
      toast({ title: "Gallery refreshed" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Refresh failed" });
    } finally {
      setIsRefreshing(false);
    }
  }, [firebaseApp]);

  useEffect(() => {
    if (firebaseApp) fetchData();
  }, [firebaseApp, fetchData]);

  const confirmDelete = () => {
    if (!itemToDelete || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, itemToDelete.collection, itemToDelete.id));
    toast({ title: "Item removed", description: "The content has been removed from the website." });
    setItemToDelete(null);
  };

  const saveSculpture = async () => {
    if (!firestore || !sculptureTitle) return;
    setIsSaving(true);
    try {
      const id = editingSculpture?.id || sculptureTitle.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const docRef = doc(firestore, 'videos', id);
      
      setDocumentNonBlocking(docRef, {
        id,
        title: sculptureTitle,
        description: sculptureDesc,
        order: Number(sculptureOrder) || 0,
        hidden: sculptureHidden,
        imagePath: sculptureImagePath || `ks-images/${id}.jpg`,
        videoPath: sculptureVideoPath || `ks-videos/${id}.mp4`,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({ title: "Sculpture saved" });
      setIsSculptureDialogOpen(false);
      setEditingSculpture(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleVisibility = (item: any) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'videos', item.id), {
      hidden: !item.hidden
    });
    toast({ title: item.hidden ? "Sculpture unhidden" : "Sculpture hidden" });
  };

  const saveNewsItem = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const id = editingNews.isNew ? doc(collection(firestore, 'news')).id : editingNews.id;
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
      toast({ title: "News item saved" });
      setEditingNews(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const savePage = async () => {
    if (!firestore || !pageSlug) return;
    setIsSaving(true);
    try {
      const cleanedSlug = pageSlug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const docRef = doc(firestore, 'pages', cleanedSlug);
      setDocumentNonBlocking(docRef, {
        id: cleanedSlug,
        title: pageTitle,
        slug: cleanedSlug,
        content: pageContent,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      if (!editingPage.isNew && editingPage.id !== cleanedSlug) {
        deleteDocumentNonBlocking(doc(firestore, 'pages', editingPage.id));
      }
      toast({ title: "Page saved" });
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
      setDocumentNonBlocking(docRef, { ...sidebarState, updatedAt: new Date().toISOString() }, { merge: true });
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
          <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={isRefreshing} className="rounded-none font-normal">
            <RefreshCw className={cn("size-4 mr-2", isRefreshing && "animate-spin")} /> Refresh Files
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
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Indexed Sculptures</h2>
              <Button size="sm" onClick={() => {
                setEditingSculpture({ isNew: true });
                setSculptureTitle('');
                setSculptureDesc('');
                setSculptureOrder('0');
                setSculptureImagePath('');
                setSculptureVideoPath('');
                setSculptureHidden(false);
                setIsSculptureDialogOpen(true);
              }} className="rounded-none h-8 font-normal">
                <Plus className="size-3 mr-2" /> Add Sculpture
              </Button>
            </div>

            <div className="space-y-4">
              {firestoreVideos?.map((item) => (
                <div key={item.id} className={cn("p-6 bg-muted/20 border border-border/50 flex justify-between items-center group", item.hidden && "opacity-60")}>
                  <div className="flex items-center gap-6">
                    <div className="size-16 bg-black flex items-center justify-center shrink-0 border border-border/50 relative">
                      {item.imagePath ? (
                        <FirebaseStorageImage path={item.imagePath} alt={item.title} width={64} height={64} className="object-cover opacity-80" />
                      ) : <ImageIcon className="size-6 text-muted-foreground" />}
                      {item.hidden && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <EyeOff className="size-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[12pt] font-normal">{item.title}</h3>
                      <div className="flex items-center gap-4 text-[9pt] uppercase tracking-widest text-muted-foreground">
                        <span>Order: {item.order}</span>
                        {item.hidden && <span className="text-destructive font-semibold">Hidden</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => toggleVisibility(item)} title={item.hidden ? "Show in Gallery" : "Hide from Gallery"}>
                      {item.hidden ? <EyeOff className="size-4 text-destructive" /> : <Eye className="size-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => {
                      setEditingSculpture(item);
                      setSculptureTitle(item.title);
                      setSculptureDesc(item.description);
                      setSculptureOrder(item.order.toString());
                      setSculptureImagePath(item.imagePath || '');
                      setSculptureVideoPath(item.videoPath || '');
                      setSculptureHidden(item.hidden || false);
                      setIsSculptureDialogOpen(true);
                    }}><Edit3 className="size-4" /></Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive" 
                      onClick={() => setItemToDelete({ id: item.id, collection: 'videos', msg: "Remove this sculpture from the Index? This will NOT delete your files from Storage." })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!firestoreVideos || firestoreVideos.length === 0) && (
                <p className="text-[10pt] text-muted-foreground italic text-center py-10">No indexed sculptures. Click 'Add Sculpture' to start.</p>
              )}
            </div>
          </TabsContent>

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
                    <Button variant="outline" size="icon" onClick={() => { 
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
                      className="text-destructive" 
                      onClick={() => setItemToDelete({ id: item.id, collection: 'news', msg: "Delete this news update?" })}
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
                    <Button variant="outline" size="icon" onClick={() => { 
                      setEditingPage(page); 
                      setPageTitle(page.title); 
                      setPageSlug(page.slug); 
                      setPageContent(page.content); 
                    }}><Edit3 className="size-4" /></Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive" 
                      onClick={() => setItemToDelete({ id: page.id, collection: 'pages', msg: "Delete this page?" })}
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
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

      {/* Sculpture Edit Dialog */}
      <Dialog open={isSculptureDialogOpen} onOpenChange={setIsSculptureDialogOpen}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader>
            <DialogTitle>{editingSculpture?.isNew ? 'Add Sculpture' : 'Edit Sculpture'}</DialogTitle>
            <DialogDescription>Index a sculpture to show in the detailed list.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-sm">Hide from Gallery</Label>
                <p className="text-xs text-muted-foreground">Keep the metadata but remove from the public masonry.</p>
              </div>
              <Switch checked={sculptureHidden} onCheckedChange={setSculptureHidden} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label>Title</Label>
                <Input value={sculptureTitle} onChange={e => setSculptureTitle(e.target.value)} className="rounded-none" />
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
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="uppercase text-[10px] tracking-widest">Linked Storage Files</Label>
                <Button variant="link" size="sm" className="h-auto p-0 text-[10px] uppercase" onClick={() => setIsCloudBrowserOpen(true)}>
                  <Search className="size-3 mr-1" /> Browse Cloud Storage
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Image Path</Label><Input value={sculptureImagePath} onChange={e => setSculptureImagePath(e.target.value)} placeholder="ks-images/art.jpg" className="rounded-none" /></div>
                <div className="space-y-2"><Label>Video Path</Label><Input value={sculptureVideoPath} onChange={e => setSculptureVideoPath(e.target.value)} placeholder="ks-videos/art.mp4" className="rounded-none" /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveSculpture} disabled={isSaving || !sculptureTitle} className="rounded-none w-full sm:w-auto">
              {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />} {editingSculpture?.isNew ? 'Add to Index' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* News Edit Dialog */}
      <Dialog open={!!editingNews} onOpenChange={(open) => !open && setEditingNews(null)}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader>
            <DialogTitle>{editingNews?.isNew ? 'Add News' : 'Edit News'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="rounded-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date String (e.g. July 2024)</Label><Input value={newsDate} onChange={e => setNewsDate(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label>Order</Label><Input type="number" value={newsOrder} onChange={e => setNewsOrder(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} className="rounded-none h-32" /></div>
            <div className="space-y-2"><Label>Image Path (Optional)</Label><Input value={newsImagePath} onChange={e => setNewsImagePath(e.target.value)} placeholder="ks-images/news.jpg" className="rounded-none" /></div>
          </div>
          <DialogFooter>
            <Button onClick={saveNewsItem} disabled={isSaving || !newsTitle} className="rounded-none">
              {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />} Save News
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Edit Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent className="max-w-3xl rounded-none">
          <DialogHeader>
            <DialogTitle>{editingPage?.isNew ? 'Create Page' : 'Edit Page'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Page Title</Label><Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label>Slug (e.g. my-new-page)</Label><Input value={pageSlug} onChange={e => setPageSlug(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={pageContent} onChange={e => setPageContent(e.target.value)} className="rounded-none h-64" /></div>
          </div>
          <DialogFooter>
            <Button onClick={savePage} disabled={isSaving || !pageSlug} className="rounded-none">
              {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />} Save Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cloud Browser Dialog */}
      <Dialog open={isCloudBrowserOpen} onOpenChange={setIsCloudBrowserOpen}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader><DialogTitle>Cloud Storage Browser</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4 px-2">
            {images.map((item) => (
              <div key={item.path} className="flex items-center gap-4 p-3 border border-border/50 bg-muted/20 hover:bg-muted/40 cursor-pointer" onClick={() => {
                setSculptureTitle(item.id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
                setSculptureImagePath(item.path);
                setSculptureVideoPath(`ks-videos/${item.name.replace(/\.[^/.]+$/, ".mp4")}`);
                setIsCloudBrowserOpen(false);
              }}>
                <div className="size-12 bg-black flex items-center justify-center shrink-0 border border-border/50">
                  <FirebaseStorageImage path={item.path} alt={item.name} width={48} height={48} className="object-cover opacity-50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-none">Select</Button>
              </div>
            ))}
            {images.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <AlertCircle className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No files found in ks-images/</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
