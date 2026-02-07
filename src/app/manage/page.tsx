'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { getStorage, ref as storageRef, listAll, deleteObject, uploadBytes } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Button } from '@/components/ui/button';
import { 
  Trash2, Upload, Loader2, RefreshCw, Lock, 
  CheckCircle2, AlertCircle, Edit3, Save, Plus, Layout
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { EXCLUDED_IMAGES } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ManageGalleryPage() {
  const { firebaseApp, auth, firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<'ks-images' | 'ks-videos'>('ks-images');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default Sidebar Values (Match AppShell fallbacks)
  const SIDEBAR_DEFAULTS = {
    introTitle: "Kinetic sculptures by Andrew Jones.",
    introSub: "Mainly linear elements balanced and articulated to move simply in the wind, light or strong.",
    commissionNote: "I work to commission. Guide prices are given below the videos or a price for a limited edition.",
    gardenNotice: "It is difficult to appreciate the movement out of the context of a breeze in a garden, so please visit our garden in Ely during Cambridge Open Studios which is in July each year.",
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

  const sidebarQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'sidebar');
  }, [firestore]);
  const { data: sidebarData } = useDoc(sidebarQuery);

  // Editing State (Sculptures)
  const [editingSculpture, setEditingSculpture] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editOrder, setEditOrder] = useState('0');

  // Editing State (News)
  const [editingNews, setEditingNews] = useState<any | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsDate, setNewsDate] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImagePath, setNewsImagePath] = useState('');
  const [newsOrder, setNewsOrder] = useState('0');

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

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user && auth) {
      signInAnonymously(auth).catch((err) => {
        console.error("Anonymous sign-in failed:", err);
      });
    }
  }, [auth, user, isAuthLoading]);

  const fetchData = async () => {
    if (!firebaseApp) return;
    setIsLoading(true);
    try {
      const storage = getStorage(firebaseApp);
      
      const imgRef = storageRef(storage, 'ks-images');
      const imgRes = await listAll(imgRef);
      const filteredImages = imgRes.items.filter(item => {
        const lowerName = item.name.toLowerCase();
        const isJpg = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
        const fileNameWithoutExt = item.name.split('.').slice(0, -1).join('.');
        const fileNameLower = fileNameWithoutExt.toLowerCase();
        const isExcluded = EXCLUDED_IMAGES.some(excluded => fileNameLower === excluded.toLowerCase());
        return isJpg && !isExcluded;
      }).map(item => ({ id: item.fullPath, path: item.fullPath, name: item.name }));
      
      setImages(filteredImages);

      const vidRef = storageRef(storage, 'ks-videos');
      const vidRes = await listAll(vidRef);
      const videoItems = vidRes.items.map(item => ({
        id: item.fullPath,
        path: item.fullPath,
        name: item.name
      }));
      setVideos(videoItems);

    } catch (error: any) {
      console.error("Error loading storage content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (firebaseApp) {
      fetchData();
    }
  }, [firebaseApp]);

  // Sorted Images for the dashboard to match Home view
  const sortedDashboardImages = useMemo(() => {
    return [...images].map(img => {
      const fileName = img.name.split('.').slice(0, -1).join('.');
      const normalizedKey = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fsData = firestoreVideos?.find(v => v.id === normalizedKey);
      return { ...img, order: fsData?.order ?? 999 };
    }).sort((a, b) => a.order - b.order);
  }, [images, firestoreVideos]);

  const handleDelete = async (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please wait while the app connects. If this persists, refresh the page."
      });
      return;
    }

    const isConfirmed = window.confirm(`Permanently delete this file?\nPath: ${path}`);
    if (!isConfirmed) return;

    try {
      const storage = getStorage(firebaseApp);
      const fileRef = storageRef(storage, path);
      await deleteObject(fileRef);
      toast({ title: "File deleted successfully" });
      await fetchData();
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast({ 
        variant: "destructive", 
        title: "Delete failed", 
        description: error.message || "Could not delete file."
      });
    }
  };

  const openEditSculpture = (image: any) => {
    const fileName = image.name.split('.').slice(0, -1).join('.');
    const normalizedKey = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = firestoreVideos?.find(v => v.id === normalizedKey);
    setEditingSculpture({ ...image, normalizedKey });
    setEditTitle(existing?.title || fileName.replace(/[-_]/g, ' '));
    setEditDesc(existing?.description || '');
    setEditOrder(existing?.order?.toString() || '0');
  };

  const saveSculptureInfo = async () => {
    if (!firestore || !editingSculpture) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'videos', editingSculpture.normalizedKey), {
        id: editingSculpture.normalizedKey,
        title: editTitle,
        description: editDesc,
        order: Number(editOrder) || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Sculpture info saved" });
      setEditingSculpture(null);
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
      await setDoc(doc(firestore, 'pages', 'sidebar'), {
        ...sidebarState,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Sidebar content updated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update failed" });
    } finally {
      setIsSaving(false);
    }
  };

  // News Items Handling
  const openEditNews = (item?: any) => {
    if (item) {
      setEditingNews(item);
      setNewsTitle(item.title);
      setNewsDate(item.date);
      setNewsContent(item.content);
      setNewsImagePath(item.imagePath || '');
      setNewsOrder(item.order?.toString() || '0');
    } else {
      setEditingNews({ isNew: true });
      setNewsTitle('');
      setNewsDate(new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }));
      setNewsContent('');
      setNewsImagePath('');
      setNewsOrder('0');
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
    if (!firestore || !window.confirm("Delete this news item?")) return;
    try {
      await deleteDoc(doc(firestore, 'news', id));
      toast({ title: "News item deleted" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  const hasMatchingVideo = (imageName: string) => {
    const nameWithoutExt = imageName.split('.').slice(0, -1).join('.').toLowerCase();
    return videos.some(v => v.name.split('.').slice(0, -1).join('.').toLowerCase() === nameWithoutExt);
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[12pt] font-normal uppercase tracking-widest">
              Management Dashboard
            </h1>
            {!user && !isAuthLoading && <Lock className="size-3 text-muted-foreground" />}
          </div>
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={fetchData} 
              className="rounded-none font-normal text-[11pt]"
            >
              <RefreshCw className="size-4 mr-2" /> Refresh
            </Button>
          </div>
          <input type="file" ref={fileInputRef} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !firebaseApp || !user) return;
            setIsUploading(true);
            try {
              const storage = getStorage(firebaseApp);
              const storageReference = storageRef(storage, `${uploadFolder}/${file.name}`);
              await uploadBytes(storageReference, file);
              toast({ title: "Upload successful" });
              fetchData();
            } catch (error: any) {
              toast({ variant: "destructive", title: "Upload failed", description: error.message });
            } finally {
              setIsUploading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }} className="hidden" />
        </div>

        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-4 rounded-none bg-muted/50 p-1 mb-8">
            <TabsTrigger value="images" className="rounded-none">Images</TabsTrigger>
            <TabsTrigger value="videos" className="rounded-none">Videos</TabsTrigger>
            <TabsTrigger value="news" className="rounded-none">News</TabsTrigger>
            <TabsTrigger value="sidebar" className="rounded-none">Sidebar</TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">Gallery Images</h2>
                <p className="text-[9pt] text-muted-foreground">Order numbers determine display sequence on home page.</p>
              </div>
              <Button type="button" size="sm" onClick={() => { setUploadFolder('ks-images'); fileInputRef.current?.click(); }} disabled={isUploading} className="rounded-none h-8 font-normal text-[10pt]">
                {isUploading ? <Loader2 className="size-3 animate-spin mr-2" /> : <Upload className="size-3 mr-2" />}
                Upload Image
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedDashboardImages.map((image) => (
                <div key={image.id} className="relative group aspect-square bg-muted border border-border/50 overflow-hidden rounded-none">
                  <FirebaseStorageImage path={image.path} alt={image.name} width={300} height={300} className="w-full h-full object-cover rounded-none" />
                  
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            {hasMatchingVideo(image.name) ? (
                              <CheckCircle2 className="size-5 text-green-500 fill-black/50" />
                            ) : (
                              <AlertCircle className="size-5 text-amber-500 fill-black/50" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{hasMatchingVideo(image.name) ? 'Matching video found' : 'No matching video (.mp4) found'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {image.order !== 999 && (
                       <span className="bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-sm w-fit font-mono">
                         #{image.order}
                       </span>
                    )}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 gap-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-none shadow-lg" 
                      onClick={() => openEditSculpture(image)}
                    >
                      <Edit3 className="size-4" />
                    </Button>
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      className="rounded-none shadow-lg" 
                      onClick={(e) => handleDelete(e, image.path)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">Gallery Videos</h2>
                <p className="text-[9pt] text-muted-foreground">Best format: MP4 (H.264) at 30 FPS.</p>
              </div>
              <Button type="button" size="sm" onClick={() => { setUploadFolder('ks-videos'); fileInputRef.current?.click(); }} disabled={isUploading} className="rounded-none h-8 font-normal text-[10pt]">
                {isUploading ? <Loader2 className="size-3 animate-spin mr-2" /> : <Upload className="size-3 mr-2" />}
                Upload Video
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="p-4 bg-muted/30 border border-border/50 flex justify-between items-center">
                  <span className="text-[11pt] truncate">{video.name}</span>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDelete(e, video.path)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">News Updates</h2>
              <Button type="button" size="sm" onClick={() => openEditNews()} className="rounded-none h-8 font-normal text-[10pt]">
                <Plus className="size-3 mr-2" /> Add News
              </Button>
            </div>
            <div className="space-y-4">
              {firestoreNews?.map((item) => (
                <div key={item.id} className="p-6 bg-muted/20 border border-border/50 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <p className="text-[9pt] uppercase tracking-widest text-muted-foreground">{item.date}</p>
                    <h3 className="text-[12pt] font-normal">{item.title}</h3>
                    <p className="text-[10pt] text-muted-foreground line-clamp-2">{item.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="icon" className="rounded-none" onClick={() => openEditNews(item)}><Edit3 className="size-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="rounded-none text-destructive" onClick={() => deleteNewsItem(item.id)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
              {firestoreNews?.length === 0 && <p className="text-center py-12 text-muted-foreground">No news items found.</p>}
            </div>
          </TabsContent>

          <TabsContent value="sidebar" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">Sidebar Content</h2>
                <p className="text-[9pt] text-muted-foreground">Edit the global site information shown in the left sidebar.</p>
              </div>
              <Button type="button" size="sm" onClick={saveSidebar} disabled={isSaving} className="rounded-none h-8 font-normal text-[10pt]">
                {isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />}
                Save Changes
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/20 border border-border/50 p-6">
              <div className="space-y-6">
                <h3 className="text-[11pt] font-normal uppercase tracking-wider border-b border-border/50 pb-2">Main Introduction</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9pt] uppercase tracking-widest">Main Title Line</Label>
                    <Input 
                      value={sidebarState.introTitle} 
                      onChange={e => setSidebarState({...sidebarState, introTitle: e.target.value})} 
                      className="rounded-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9pt] uppercase tracking-widest">Sub-Introduction</Label>
                    <Textarea 
                      value={sidebarState.introSub} 
                      onChange={e => setSidebarState({...sidebarState, introSub: e.target.value})} 
                      className="rounded-none h-24" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9pt] uppercase tracking-widest">Commission Note</Label>
                    <Textarea 
                      value={sidebarState.commissionNote} 
                      onChange={e => setSidebarState({...sidebarState, commissionNote: e.target.value})} 
                      className="rounded-none h-24" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[11pt] font-normal uppercase tracking-wider border-b border-border/50 pb-2">Notices & Contact</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9pt] uppercase tracking-widest">Garden/Visit Notice</Label>
                    <Textarea 
                      value={sidebarState.gardenNotice} 
                      onChange={e => setSidebarState({...sidebarState, gardenNotice: e.target.value})} 
                      className="rounded-none h-32" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9pt] uppercase tracking-widest">Email Address</Label>
                      <Input value={sidebarState.email} onChange={e => setSidebarState({...sidebarState, email: e.target.value})} className="rounded-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9pt] uppercase tracking-widest">Phone</Label>
                      <Input value={sidebarState.phone} onChange={e => setSidebarState({...sidebarState, phone: e.target.value})} className="rounded-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9pt] uppercase tracking-widest">Mobile</Label>
                      <Input value={sidebarState.mobile} onChange={e => setSidebarState({...sidebarState, mobile: e.target.value})} className="rounded-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9pt] uppercase tracking-widest">Social Handle</Label>
                      <Input value={sidebarState.social} onChange={e => setSidebarState({...sidebarState, social: e.target.value})} className="rounded-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editingSculpture} onOpenChange={() => setEditingSculpture(null)}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader><DialogTitle className="tracking-widest font-normal">Edit Sculpture Info</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Title</Label>
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="rounded-none" />
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input type="number" value={editOrder} onChange={e => setEditOrder(e.target.value)} className="rounded-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="rounded-none min-h-[150px]" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={saveSculptureInfo} disabled={isSaving} className="rounded-none"><Save className="size-4 mr-2" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingNews} onOpenChange={() => setEditingNews(null)}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader><DialogTitle className="tracking-widest font-normal">{editingNews?.isNew ? 'New Update' : 'Edit Update'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="rounded-none" />
              </div>
              <div className="space-y-2">
                <Label>Date Label (e.g., July 2024)</Label>
                <Input value={newsDate} onChange={e => setNewsDate(e.target.value)} className="rounded-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Image Path (optional)</Label>
                <Input value={newsImagePath} onChange={e => setNewsImagePath(e.target.value)} className="rounded-none" placeholder="ks-images/sculpture.jpg" />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={newsOrder} onChange={e => setNewsOrder(e.target.value)} className="rounded-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} className="rounded-none min-h-[200px]" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={saveNewsItem} disabled={isSaving} className="rounded-none"><Save className="size-4 mr-2" /> Save News</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}