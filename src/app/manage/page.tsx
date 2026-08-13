'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, query, setDoc, orderBy } from 'firebase/firestore';
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
  Trash2, Loader2, RefreshCw, Save, Plus, LogIn, LogOut, ShieldCheck, ShieldAlert, AlertCircle, EyeOff, Eye, Image as ImageIcon, Calendar, Settings
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Management Dashboard.
 * Strictly White Background / Black Text.
 * Legibility fixed for all inputs.
 */
export default function ManageDashboardPage() {
  const { firebaseApp, auth, firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const [imagesData, setImagesData] = useState<{ id: string, path: string }[]>([]);
  const [videosData, setVideosData] = useState<{ id: string, path: string }[]>([]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, collection: string, action: 'delete' | 'hide' | 'unhide', msg: string } | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isAdmin = user && (
    user.email === 'rhobile@gmail.com' || 
    user.uid === 'ge6KSJEZKFXsNZerEbXseOR2vSS2' ||
    user.uid === 'gHZ9n7s2b9X8fJ2kP3s5t8YxVOE2'
  );

  const allVideosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'videos');
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

  const [siteTitle, setSiteTitle] = useState('Rhobile');
  const [sidebarContent, setSidebarContent] = useState('');
  
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemOrder, setItemOrder] = useState('0');

  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [entryType, setEntryType] = useState<'news' | 'observations'>('news');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryImagePath, setEntryImagePath] = useState('');
  const [entryVideoId, setEntryVideoId] = useState('');
  const [entryOrder, setEntryOrder] = useState('0');

  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('');

  const sidebarQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'sidebar');
  }, [firestore]);
  const { data: sidebarData } = useDoc(sidebarQuery);

  useEffect(() => {
    if (sidebarData) {
      if (sidebarContent === '' && sidebarData.content) setSidebarContent(sidebarData.content);
      if (siteTitle === 'Rhobile' && sidebarData.siteTitle) setSiteTitle(sidebarData.siteTitle);
    }
  }, [sidebarData, sidebarContent, siteTitle]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoggingIn(true);
    signInWithEmailAndPassword(auth, loginEmail, loginPassword)
      .then(() => {
        toast({ title: "Authenticated as Admin" });
        setLoginEmail('');
        setLoginPassword('');
      })
      .catch((error: any) => {
        toast({ variant: "destructive", title: "Sign-In Failed", description: error.message });
      })
      .finally(() => {
        setIsLoggingIn(false);
      });
  };

  const handleLogout = () => {
    if (!auth) return;
    signOut(auth).then(() => {
      toast({ title: "Signed out successfully" });
    });
  };

  const fetchData = useCallback(async () => {
    if (!firebaseApp) return;
    setIsRefreshing(true);
    try {
      const storage = getStorage(firebaseApp, 'gs://ks-bucket-nl');
      const [imagesRes, videosRes] = await Promise.all([
        listAll(storageRef(storage, 'ks-images')),
        listAll(storageRef(storage, 'ks-videos'))
      ]);
      
      const images = imagesRes.items.map(item => ({
        id: item.name.split('.').slice(0, -1).join('.').toLowerCase().trim(),
        path: item.fullPath
      }));
      
      const videos = videosRes.items.map(item => ({
        id: item.name.split('.').slice(0, -1).join('.').toLowerCase().trim(),
        path: item.fullPath
      }));
      
      setImagesData(images);
      setVideosData(videos);
      toast({ title: "Media Metadata Synced" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Storage sync failed", description: error.message });
    } finally {
      setIsRefreshing(false);
    }
  }, [firebaseApp]);

  useEffect(() => {
    if (firebaseApp) fetchData();
  }, [firebaseApp, fetchData]);

  const masonryItems = useMemo(() => {
    const allIds = Array.from(new Set([
      ...imagesData.map(i => i.id),
      ...videosData.map(v => v.id)
    ]));

    return allIds.map(id => {
      const fsData = firestoreVideos?.find(v => v.id.toLowerCase().trim() === id.toLowerCase().trim());
      const imgMatch = imagesData.find(i => i.id === id);
      const vidMatch = videosData.find(v => v.id === id);

      return {
        id,
        title: fsData?.title || id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: fsData?.description || "",
        order: fsData?.order ?? 999,
        imagePath: imgMatch?.path || null,
        videoPath: vidMatch?.path || null,
        isIndexed: !!fsData,
        isHidden: fsData?.hidden || false,
        hasImage: !!imgMatch,
        hasVideo: !!vidMatch
      };
    }).sort((a: any, b: any) => a.order - b.order);
  }, [imagesData, videosData, firestoreVideos]);

  const saveItem = () => {
    if (!firestore || !itemTitle || !editingItem) return;
    setIsSaving(true);
    const id = editingItem.id;
    const docRef = doc(firestore, 'videos', id);
    setDocumentNonBlocking(docRef, {
      id,
      title: itemTitle,
      description: itemDesc,
      order: Number(itemOrder) || 0,
      updatedAt: new Date().toISOString(),
      hidden: editingItem.isHidden || false
    }, { merge: true });
    setIsItemDialogOpen(false);
    setIsSaving(false);
    toast({ title: "Metadata Saved" });
  };

  const saveSidebar = () => {
    if (!firestore) return;
    setIsSaving(true);
    const docRef = doc(firestore, 'pages', 'sidebar');
    setDocumentNonBlocking(docRef, {
      content: sidebarContent,
      siteTitle: siteTitle,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setIsSaving(false);
    toast({ title: "Sidebar Updated" });
  };

  const openEntryDialog = (type: 'news' | 'observations', entry?: any) => {
    setEntryType(type);
    if (entry) {
      setEditingEntry(entry);
      setEntryTitle(entry.title || '');
      setEntryDate(entry.date || '');
      setEntryContent(entry.content || '');
      setEntryImagePath(entry.imagePath || '');
      setEntryVideoId(entry.videoId || '');
      setEntryOrder(entry.order?.toString() || '0');
    } else {
      setEditingEntry({ isNew: true });
      setEntryTitle('');
      setEntryDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
      setEntryContent('');
      setEntryImagePath('');
      setEntryVideoId('');
      setEntryOrder('0');
    }
    setIsEntryDialogOpen(true);
  };

  const saveEntry = () => {
    if (!firestore || !entryTitle) return;
    setIsSaving(true);
    const slug = entryTitle.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const id = editingEntry?.isNew ? (slug || `entry-${Date.now()}`) : editingEntry.id;
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
    setIsEntryDialogOpen(false);
    setIsSaving(false);
    toast({ title: `${entryType} saved` });
  };

  const openPageDialog = (page?: any) => {
    if (page) {
      setEditingPage(page);
      setPageTitle(page.title || '');
      setPageSlug(page.slug || '');
      setPageContent(page.content || '');
    } else {
      setEditingPage({ isNew: true });
      setPageTitle('');
      setPageSlug('');
      setPageContent('');
    }
    setIsPageDialogOpen(true);
  };

  const savePage = () => {
    if (!firestore || !pageTitle) return;
    setIsSaving(true);
    const id = editingPage?.isNew ? (pageSlug || pageTitle.toLowerCase().replace(/\s+/g, '-')) : editingPage.id;
    const docRef = doc(firestore, 'pages', id);
    setDocumentNonBlocking(docRef, {
      id,
      title: pageTitle,
      slug: pageSlug || id,
      content: pageContent,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setIsPageDialogOpen(false);
    setIsSaving(false);
    toast({ title: "Page saved" });
  };

  const handleConfirmAction = useCallback(() => {
    if (!itemToDelete || !firestore) return;
    const { id, collection: col, action } = itemToDelete;
    const docRef = doc(firestore, col, id);

    if (action === 'hide') {
      setDocumentNonBlocking(docRef, { hidden: true, id }, { merge: true });
    } else if (action === 'unhide') {
      setDocumentNonBlocking(docRef, { hidden: false, id }, { merge: true });
    } else {
      deleteDocumentNonBlocking(docRef);
    }
    setItemToDelete(null);
    toast({ title: "Action completed" });
  }, [itemToDelete, firestore]);

  if (isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-white text-black/50"><Loader2 className="size-8 animate-spin" /></div>;
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-white min-h-screen text-black">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 pb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-[14pt] font-normal uppercase tracking-[0.2em] text-black">Site Management</h1>
            {isAdmin ? (
              <Badge variant="outline" className="w-fit rounded-none border-green-500/30 bg-green-500/5 text-green-600 text-[10px] uppercase tracking-widest px-2 py-0.5 mt-2">
                <ShieldCheck className="size-3 mr-1" /> Admin: {user.email}
              </Badge>
            ) : (
              <Badge variant="outline" className="w-fit rounded-none border-black/10 bg-black/5 text-black/40 text-[10px] uppercase tracking-widest px-2 py-0.5 mt-2">
                <ShieldAlert className="size-3 mr-1" /> Viewing as Public
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isRefreshing} className="rounded-none font-normal uppercase tracking-widest text-[10px] border-black/20 text-black">
              <RefreshCw className={cn("size-4 mr-2", isRefreshing && "animate-spin")} /> Sync Media
            </Button>
            {isAdmin && <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-none text-red-600 uppercase tracking-widest text-[10px]"><LogOut className="size-4 mr-2" /> Logout</Button>}
          </div>
        </div>

        {!isAdmin && (
          <div className="max-w-md mx-auto space-y-6">
            <Alert variant="destructive" className="rounded-none bg-red-50 border-red-200 text-red-600">
              <AlertCircle className="size-4" />
              <AlertTitle className="uppercase tracking-widest text-[10px] font-bold">Admin Restricted</AlertTitle>
              <AlertDescription className="text-sm font-normal">Please sign in with your admin credentials to edit the gallery or pages.</AlertDescription>
            </Alert>
            <Card className="rounded-none border-black/10 shadow-none bg-white">
              <CardHeader><CardTitle className="text-xs uppercase tracking-[0.2em] text-black font-normal">Admin Authentication</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest text-black">Email Address</Label><Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="rounded-none border-black/20 text-black bg-white" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest text-black">Password</Label><Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="rounded-none border-black/20 text-black bg-white" required /></div>
                  <Button type="submit" disabled={isLoggingIn} className="rounded-none w-full uppercase tracking-widest text-[11px] font-bold h-11 bg-black text-white">{isLoggingIn ? <Loader2 className="size-3 animate-spin mr-2" /> : <LogIn className="size-3 mr-2" />} Sign In</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && (
          <Tabs defaultValue="masonry" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-5 rounded-none bg-black/5 p-1 mb-8">
              <TabsTrigger value="masonry" className="rounded-none text-[9px] uppercase tracking-widest py-2 data-[state=active]:bg-white data-[state=active]:text-black">Sculptures</TabsTrigger>
              <TabsTrigger value="sidebar" className="rounded-none text-[9px] uppercase tracking-widest py-2 data-[state=active]:bg-white data-[state=active]:text-black">Sidebar</TabsTrigger>
              <TabsTrigger value="news" className="rounded-none text-[9px] uppercase tracking-widest py-2 data-[state=active]:bg-white data-[state=active]:text-black">News</TabsTrigger>
              <TabsTrigger value="obs" className="rounded-none text-[9px] uppercase tracking-widest py-2 data-[state=active]:bg-white data-[state=active]:text-black">Observations</TabsTrigger>
              <TabsTrigger value="pages" className="rounded-none text-[9px] uppercase tracking-widest py-2 data-[state=active]:bg-white data-[state=active]:text-black">Pages</TabsTrigger>
            </TabsList>

            <TabsContent value="masonry" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {masonryItems.map((item: any) => (
                  <div key={item.id} className={cn(
                    "p-4 border flex items-center gap-4 transition-all relative rounded-none", 
                    item.isHidden ? "bg-orange-50 border-orange-200 grayscale opacity-60" : "bg-black/5 border-black/10"
                  )}>
                    <div className="size-16 bg-neutral-200 shrink-0 relative border border-black/10 overflow-hidden">
                      {item.imagePath ? (
                        <FirebaseStorageImage path={item.imagePath} alt={item.title} width={64} height={64} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-black/30">
                          <ImageIcon className="size-5 opacity-20" />
                        </div>
                      )}
                      {item.isHidden && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><EyeOff className="size-4 text-black" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[10pt] font-normal truncate uppercase tracking-tight text-black">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn("text-[8px] px-1 rounded-none uppercase", item.hasImage ? "text-green-600 border-green-200" : "text-red-600 border-red-200")}>Img</Badge>
                        <Badge variant="outline" className={cn("text-[8px] px-1 rounded-none uppercase", item.hasVideo ? "text-green-600 border-green-200" : "text-red-600 border-red-200")}>Vid</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Button variant="outline" size="sm" className="rounded-none h-7 px-2 text-[9px] uppercase tracking-widest border-black/20 text-black" onClick={() => {
                        setEditingItem(item);
                        setItemTitle(item.title || '');
                        setItemDesc(item.description || '');
                        setItemOrder(item.order?.toString() || '0');
                        setIsItemDialogOpen(true);
                      }}>Edit</Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-none h-7 w-7 p-0 text-black/40 hover:text-black"
                        onClick={() => setItemToDelete({ 
                          id: item.id, 
                          collection: 'videos', 
                          action: item.isHidden ? 'unhide' : 'hide', 
                          msg: item.isHidden ? `Unhide "${item.title}"?` : `Hide "${item.title}" from public gallery?` 
                        })}
                      >
                        {item.isHidden ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sidebar" className="space-y-6">
              <Card className="rounded-none border-black/10 bg-white">
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-black font-normal">Global Sidebar & Site Title</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-black">Site Header Title</Label>
                    <Input value={siteTitle} onChange={e => setSiteTitle(e.target.value)} className="rounded-none border-black/20 text-black bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-black">Sidebar Content (Markdown: [Label](url) and *Italics*)</Label>
                    <Textarea value={sidebarContent} onChange={e => setSidebarContent(e.target.value)} className="rounded-none h-64 font-mono text-sm border-black/20 text-black bg-white" />
                  </div>
                  <Button onClick={saveSidebar} disabled={isSaving} className="rounded-none w-full uppercase tracking-widest text-[11px] font-bold h-11 bg-black text-white">
                    {isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="news" className="space-y-6">
              <div className="flex justify-between items-center border-b border-black/10 pb-4">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal text-black">News Articles</h2>
                <Button size="sm" onClick={() => openEntryDialog('news')} className="rounded-none h-8 font-normal uppercase text-[9px] tracking-widest bg-black text-white"><Plus className="size-3 mr-2" /> Add News</Button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {firestoreNews?.map((item: any) => (
                  <div key={item.id} className="p-4 border border-black/10 bg-black/5 flex items-center justify-between gap-4 rounded-none">
                    <div className="flex-1 min-w-0">
                       <h3 className="text-[10pt] font-normal truncate uppercase tracking-tight text-black">{item.title}</h3>
                       <p className="text-[9px] text-black/50 uppercase tracking-widest"><Calendar className="size-3 inline mr-1" /> {item.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" onClick={() => openEntryDialog('news', item)} className="rounded-none h-7 px-3 text-[9px] uppercase border-black/20 text-black">Edit</Button>
                       <Button variant="ghost" size="sm" onClick={() => setItemToDelete({ id: item.id, collection: 'news', action: 'delete', msg: `Permanently delete news item "${item.title}"?` })} className="rounded-none h-7 px-2 text-red-600"><Trash2 className="size-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="obs" className="space-y-6">
              <div className="flex justify-between items-center border-b border-black/10 pb-4">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal text-black">Observations</h2>
                <Button size="sm" onClick={() => openEntryDialog('observations')} className="rounded-none h-8 font-normal uppercase text-[9px] tracking-widest bg-black text-white"><Plus className="size-3 mr-2" /> Add Observation</Button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {firestoreObs?.map((item: any) => (
                  <div key={item.id} className="p-4 border border-black/10 bg-black/5 flex items-center justify-between gap-4 rounded-none">
                    <div className="flex-1 min-w-0">
                       <h3 className="text-[10pt] font-normal truncate uppercase tracking-tight text-black">{item.title}</h3>
                       <p className="text-[9px] text-black/50 uppercase tracking-widest"><Calendar className="size-3 inline mr-1" /> {item.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" onClick={() => openEntryDialog('observations', item)} className="rounded-none h-7 px-3 text-[9px] uppercase border-black/20 text-black">Edit</Button>
                       <Button variant="ghost" size="sm" onClick={() => setItemToDelete({ id: item.id, collection: 'observations', action: 'delete', msg: `Delete observation "${item.title}"?` })} className="rounded-none h-7 px-2 text-red-600"><Trash2 className="size-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pages" className="space-y-6">
              <div className="flex justify-between items-center border-b border-black/10 pb-4">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal text-black">Static Pages</h2>
                <Button size="sm" onClick={() => openPageDialog()} className="rounded-none h-8 font-normal uppercase text-[9px] tracking-widest bg-black text-white"><Plus className="size-3 mr-2" /> Create Page</Button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {firestorePages?.filter(p => p.id !== 'sidebar').map((item: any) => (
                  <div key={item.id} className="p-4 border border-black/10 bg-black/5 flex items-center justify-between gap-4 rounded-none">
                    <div className="flex-1 min-w-0">
                       <h3 className="text-[10pt] font-normal truncate uppercase tracking-tight text-black">{item.title}</h3>
                       <p className="text-[9px] text-black/50 uppercase tracking-widest">URL Slug: /p/{item.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" onClick={() => openPageDialog(item)} className="rounded-none h-7 px-3 text-[9px] uppercase border-black/20 text-black">Edit</Button>
                       <Button variant="ghost" size="sm" onClick={() => setItemToDelete({ id: item.id, collection: 'pages', action: 'delete', msg: `Delete static page "${item.title}"?` })} className="rounded-none h-7 px-2 text-red-600"><Trash2 className="size-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl rounded-none border-black/20 bg-white text-black shadow-2xl">
          <DialogHeader><DialogTitle className="uppercase tracking-[0.2em] text-[10pt] font-normal text-black">Edit Sculpture Metadata</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3"><Label className="text-[9px] uppercase tracking-widest text-black">Public Title</Label><Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} className="rounded-none border-black/20 text-black bg-white" /></div>
              <div><Label className="text-[9px] uppercase tracking-widest text-black">Sort Order</Label><Input type="number" value={itemOrder} onChange={e => setItemOrder(e.target.value)} className="rounded-none border-black/20 text-black bg-white" /></div>
            </div>
            <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest text-black">Sculpture Description</Label><Textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="rounded-none h-32 border-black/20 text-black bg-white" /></div>
          </div>
          <DialogFooter><Button onClick={saveItem} disabled={isSaving} className="rounded-none w-full uppercase tracking-widest font-bold h-11 bg-black text-white hover:bg-black/90">{isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save Metadata</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="max-w-3xl rounded-none bg-white text-black border-black/20 shadow-2xl">
          <DialogHeader><DialogTitle className="uppercase tracking-widest text-[10pt] font-normal text-black">{entryType === 'news' ? 'News Entry' : 'Observation Entry'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[9px] uppercase text-black">Title</Label><Input value={entryTitle} onChange={e => setEntryTitle(e.target.value)} className="rounded-none border-black/20 text-black bg-white" /></div>
              <div className="space-y-2"><Label className="text-[9px] uppercase text-black">Date (Displayed)</Label><Input value={entryDate} onChange={e => setEntryDate(e.target.value)} className="rounded-none border-black/20 text-black bg-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[9px] uppercase text-black">Image Name (in ks-images/)</Label><Input value={entryImagePath} onChange={e => setEntryImagePath(e.target.value)} className="rounded-none border-black/20 text-black bg-white" /></div>
              <div className="space-y-2"><Label className="text-[9px] uppercase text-black">Video ID (for popup)</Label><Input value={entryVideoId} onChange={e => setEntryVideoId(e.target.value)} className="rounded-none border-black/20 text-black bg-white" /></div>
            </div>
            <div className="space-y-2"><Label className="text-[9px] uppercase text-black">Main Content Text</Label><Textarea value={entryContent} onChange={e => setEntryContent(e.target.value)} className="rounded-none h-48 border-black/20 text-black bg-white" /></div>
          </div>
          <DialogFooter><Button onClick={saveEntry} disabled={isSaving} className="rounded-none w-full uppercase tracking-widest h-11 bg-black text-white hover:bg-black/90">{isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save Entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
        <DialogContent className="max-w-4xl rounded-none bg-white text-black border-black/20 shadow-2xl">
          <DialogHeader><DialogTitle className="uppercase tracking-widest text-[10pt] font-normal text-black">Static Custom Page</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[9px] uppercase text-black">Page Title</Label><Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} className="rounded-none border-black/20 text-black bg-white" /></div>
              <div className="space-y-2"><Label className="text-[9px] uppercase text-black">URL Slug (e.g. about)</Label><Input value={pageSlug} onChange={e => setPageSlug(e.target.value)} className="rounded-none border-black/20 text-black bg-white" /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] uppercase text-black">Content ([image:name.jpg], [video:name.mp4], [Link](url))</Label>
              <Textarea value={pageContent} onChange={e => setPageContent(e.target.value)} className="rounded-none h-[400px] font-mono border-black/20 text-black bg-white" />
            </div>
          </div>
          <DialogFooter><Button onClick={savePage} disabled={isSaving} className="rounded-none w-full h-11 uppercase tracking-widest bg-black text-white hover:bg-black/90">{isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save Page</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-none border-black/20 bg-white text-black shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase tracking-widest text-[10pt] font-normal text-black">Confirm Action</AlertDialogTitle>
            <AlertDialogDescription className="text-black/60 font-normal">{itemToDelete?.msg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-black/20 text-black bg-white uppercase text-[9px] tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} className="rounded-none bg-red-600 text-white hover:bg-red-700 border-none uppercase text-[9px] tracking-widest">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
