'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStorage, ref as storageRef, listAll } from 'firebase/storage';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, query, setDoc } from 'firebase/firestore';
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
  Trash2, Loader2, RefreshCw, Save, Plus, LogIn, LogOut, ShieldCheck, ShieldAlert, AlertCircle, Copy, Check, Calendar, EyeOff, Eye
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
import { EXCLUDED_IMAGES } from '@/lib/constants';

/**
 * The Administrative Command Center for Rhobile.
 * Allows for content curation, news updates, flow observations, and cinematic page management.
 */
export default function ManageDashboardPage() {
  const { firebaseApp, auth, firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const [storageData, setStorageData] = useState<{ images: any[] }>({ images: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, collection: string, action: 'delete' | 'hide' | 'unhide', msg: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isAdmin = user && (user.email === 'rhobile@gmail.com' || user.uid === 'ge6KSJEZKFXsNZerEbXseOR2vSS2');

  // Firestore Data
  const allVideosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'videos');
  }, [firestore]);
  const { data: firestoreVideos } = useCollection(allVideosQuery);

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'news');
  }, [firestore]);
  const { data: firestoreNews } = useCollection(newsQuery);

  const obsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'observations');
  }, [firestore]);
  const { data: firestoreObs } = useCollection(obsQuery);

  const pagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'pages');
  }, [firestore]);
  const { data: firestorePages } = useCollection(pagesQuery);

  // Site Identity State
  const [siteTitle, setSiteTitle] = useState('Rhobile');
  const [sidebarContent, setSidebarContent] = useState('');
  
  // Sculpture Modal
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemOrder, setItemOrder] = useState('0');

  // News/Obs Modal
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [entryType, setEntryType] = useState<'news' | 'observations'>('news');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryImagePath, setEntryImagePath] = useState('');
  const [entryVideoId, setEntryVideoId] = useState('');
  const [entryOrder, setEntryOrder] = useState('0');

  // Pages Modal
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
        toast({ title: "Authenticated", description: "Welcome back, Admin." });
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
      toast({ title: "Signed out" });
    });
  };

  const fetchData = useCallback(async () => {
    if (!firebaseApp) return;
    setIsRefreshing(true);
    try {
      const storage = getStorage(firebaseApp, 'gs://ks-bucket-nl');
      const imgRes = await listAll(storageRef(storage, 'ks-images'));
      const images = imgRes.items
        .filter(item => {
          const lowerName = item.name.toLowerCase();
          const fileNameLower = item.name.split('.').slice(0, -1).join('.').toLowerCase().trim();
          return (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) && !EXCLUDED_IMAGES.includes(fileNameLower);
        })
        .map(item => ({ 
          id: item.name.split('.').slice(0, -1).join('.').toLowerCase().trim(), 
          path: item.fullPath, 
          name: item.name 
        }));
      setStorageData({ images });
    } catch (error: any) {
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
        isIndexed: !!fsData,
        isHidden: fsData?.hidden || false
      };
    }).sort((a: any, b: any) => a.order - b.order);
  }, [storageData, firestoreVideos]);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({ title: "URL Copied", description: "Client-direct link is ready." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveItem = () => {
    if (!firestore || !itemTitle) return;
    setIsSaving(true);
    const id = editingItem?.id;
    const docRef = doc(firestore, 'videos', id);
    setDocumentNonBlocking(docRef, {
      id,
      title: itemTitle,
      description: itemDesc,
      order: Number(itemOrder) || 0,
      updatedAt: new Date().toISOString(),
      hidden: editingItem?.isHidden || false
    }, { merge: true });
    setIsItemDialogOpen(false);
    setIsSaving(false);
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
    if (!firestore || !pageTitle || !pageSlug) return;
    setIsSaving(true);
    const id = editingPage?.isNew ? pageSlug.toLowerCase().trim() : editingPage.id;
    const docRef = doc(firestore, 'pages', id);
    setDocumentNonBlocking(docRef, {
      id,
      title: pageTitle,
      slug: pageSlug,
      content: pageContent,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setIsPageDialogOpen(false);
    setIsSaving(false);
  };

  const saveSidebar = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const docRef = doc(firestore, 'pages', 'sidebar');
      await setDoc(docRef, {
        siteTitle,
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
    const { id, collection: col, action } = itemToDelete;
    const docRef = doc(firestore, col, id);
    if (action === 'hide') {
      updateDocumentNonBlocking(docRef, { hidden: true });
    } else if (action === 'unhide') {
      updateDocumentNonBlocking(docRef, { hidden: false });
    } else {
      deleteDocumentNonBlocking(docRef);
    }
    setItemToDelete(null);
  }, [itemToDelete, firestore]);

  if (isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="size-8 animate-spin text-accent" /></div>;
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-[12pt] font-normal uppercase tracking-widest text-foreground/80">Management Dashboard</h1>
            {isAdmin ? (
              <Badge variant="outline" className="w-fit rounded-none border-green-500/50 bg-green-500/5 text-green-600 text-[9px] uppercase tracking-widest px-2 py-0.5 mt-2">
                <ShieldCheck className="size-3 mr-1" /> Authorized Admin
              </Badge>
            ) : (
              <Badge variant="outline" className="w-fit rounded-none border-orange-500/50 bg-orange-500/5 text-orange-600 text-[9px] uppercase tracking-widest px-2 py-0.5 mt-2">
                <ShieldAlert className="size-3 mr-1" /> Visitor Mode
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={isRefreshing} className="rounded-none font-normal">
              <RefreshCw className={cn("size-4 mr-2", isRefreshing && "animate-spin")} /> Sync Storage
            </Button>
            {isAdmin && <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-none text-destructive"><LogOut className="size-4 mr-2" /> Logout</Button>}
          </div>
        </div>

        {!isAdmin && (
          <div className="max-w-md mx-auto space-y-6">
            <Alert variant="destructive" className="rounded-none">
              <AlertCircle className="size-4" />
              <AlertTitle className="uppercase tracking-widest text-[10px] font-bold">Access Restricted</AlertTitle>
              <AlertDescription className="text-sm">Sign in as <strong className="text-foreground">rhobile@gmail.com</strong> to manage gallery content.</AlertDescription>
            </Alert>
            <Card className="rounded-none">
              <CardHeader><CardTitle className="text-sm uppercase tracking-widest">Admin Sign-In</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2"><Label className="text-[10px] uppercase">Email</Label><Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="rounded-none" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] uppercase">Password</Label><Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="rounded-none" required /></div>
                  <Button type="submit" disabled={isLoggingIn} className="rounded-none w-full uppercase tracking-widest text-[11px] font-bold">{isLoggingIn ? <Loader2 className="size-3 animate-spin mr-2" /> : <LogIn className="size-3 mr-2" />} Authenticate</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && (
          <Tabs defaultValue="masonry" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-5 rounded-none bg-muted/50 p-1 mb-8">
              <TabsTrigger value="sidebar" className="rounded-none">Sidebar</TabsTrigger>
              <TabsTrigger value="masonry" className="rounded-none">Masonry</TabsTrigger>
              <TabsTrigger value="news" className="rounded-none">News</TabsTrigger>
              <TabsTrigger value="obs" className="rounded-none">Obs</TabsTrigger>
              <TabsTrigger value="pages" className="rounded-none">Pages</TabsTrigger>
            </TabsList>

            <TabsContent value="sidebar" className="space-y-6">
              <div className="flex justify-between items-center border-b border-border/30 pb-4">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">Site Identity</h2>
                <Button size="sm" onClick={saveSidebar} disabled={isSaving} className="rounded-none h-8 font-normal">{isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save Changes</Button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2"><Label className="text-[10pt] font-normal uppercase">Site Title</Label><Input value={siteTitle} onChange={e => setSiteTitle(e.target.value)} className="rounded-none" /></div>
                <div className="space-y-2">
                   <Label className="text-[10pt] font-normal uppercase">Sidebar Text</Label>
                   <p className="text-[9px] text-muted-foreground mb-2">Use [Label](url) for links and *text* for italics.</p>
                   <Textarea value={sidebarContent} onChange={e => setSidebarContent(e.target.value)} className="rounded-none h-[400px] font-mono" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="masonry" className="space-y-6">
              <div className="flex justify-between items-center border-b border-border/30 pb-4">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">Sculpture Gallery</h2>
                <Badge variant="outline" className="rounded-none text-[8px] uppercase tracking-widest">Manage Display Order & Metadata</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {masonryItems.map((item: any) => (
                  <div key={item.id} className={cn("p-4 border flex items-center gap-4 transition-colors", item.isHidden ? "bg-orange-50/10 border-orange-200/50 grayscale" : "bg-muted/30 border-border/50")}>
                    <div className="size-16 bg-black shrink-0 relative border border-border/50 overflow-hidden">
                      <FirebaseStorageImage path={item.imagePath} alt={item.title} width={64} height={64} className="object-cover w-full h-full" />
                      {item.isHidden && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><EyeOff className="size-4 text-white" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[10pt] font-normal truncate">{item.title}</h3>
                      <p className="text-[8pt] text-accent font-mono truncate">{item.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="rounded-none h-7 px-2 text-[9px] uppercase tracking-widest" onClick={() => {
                          setEditingItem(item);
                          setItemTitle(item.title || '');
                          setItemDesc(item.description || '');
                          setItemOrder(item.order?.toString() || '0');
                          setIsItemDialogOpen(true);
                        }}>Edit</Button>
                        <Button variant="outline" size="sm" className="rounded-none h-7 w-7 p-0" onClick={() => handleCopyLink(item.id)}>
                          {copiedId === item.id ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />}
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-none h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setItemToDelete({ 
                            id: item.id, 
                            collection: 'videos', 
                            action: item.isHidden ? 'unhide' : 'hide', 
                            msg: item.isHidden ? `Make "${item.title}" visible in the gallery again?` : `Hide "${item.title}" from the public gallery?` 
                          })}
                        >
                          {item.isHidden ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                        </Button>
                        {item.isIndexed && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-none h-7 w-7 p-0 text-destructive/50 hover:text-destructive"
                            onClick={() => setItemToDelete({ 
                              id: item.id, 
                              collection: 'videos', 
                              action: 'delete', 
                              msg: `Delete metadata for "${item.title}"? This will reset its custom title and description.` 
                            })}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="news" className="space-y-6">
              <div className="flex justify-between items-center border-b border-border/30 pb-4">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">News Articles</h2>
                <Button size="sm" onClick={() => openEntryDialog('news')} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Add News</Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {firestoreNews?.map((item: any) => (
                  <div key={item.id} className="p-4 border bg-muted/30 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                       <h3 className="text-[10pt] font-normal truncate">{item.title}</h3>
                       <p className="text-[8pt] text-muted-foreground"><Calendar className="size-3 inline mr-1" /> {item.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" onClick={() => openEntryDialog('news', item)} className="rounded-none h-7 px-3 text-[9px] uppercase">Edit</Button>
                       <Button variant="ghost" size="sm" onClick={() => setItemToDelete({ id: item.id, collection: 'news', action: 'delete', msg: `Delete news item "${item.title}"?` })} className="rounded-none h-7 px-2 text-destructive"><Trash2 className="size-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="obs" className="space-y-6">
              <div className="flex justify-between items-center border-b border-border/30 pb-4">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">Flow Observations</h2>
                <Button size="sm" onClick={() => openEntryDialog('observations')} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Add Observation</Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {firestoreObs?.map((item: any) => (
                  <div key={item.id} className="p-4 border bg-muted/30 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                       <h3 className="text-[10pt] font-normal truncate">{item.title}</h3>
                       <p className="text-[8pt] text-muted-foreground">{item.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" onClick={() => openEntryDialog('observations', item)} className="rounded-none h-7 px-3 text-[9px] uppercase">Edit</Button>
                       <Button variant="ghost" size="sm" onClick={() => setItemToDelete({ id: item.id, collection: 'observations', action: 'delete', msg: `Delete observation "${item.title}"?` })} className="rounded-none h-7 px-2 text-destructive"><Trash2 className="size-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pages" className="space-y-6">
              <div className="flex justify-between items-center border-b border-border/30 pb-4">
                <h2 className="text-[10pt] uppercase tracking-widest font-normal">Custom Pages</h2>
                <Button size="sm" onClick={() => openPageDialog()} className="rounded-none h-8 font-normal"><Plus className="size-3 mr-2" /> Add Page</Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {firestorePages?.filter(p => p.id !== 'sidebar').map((item: any) => (
                  <div key={item.id} className="p-4 border bg-muted/30 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                       <h3 className="text-[10pt] font-normal truncate">{item.title}</h3>
                       <p className="text-[8pt] text-accent font-mono truncate">/p/{item.slug || item.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" onClick={() => openPageDialog(item)} className="rounded-none h-7 px-3 text-[9px] uppercase">Edit</Button>
                       <Button variant="ghost" size="sm" onClick={() => setItemToDelete({ id: item.id, collection: 'pages', action: 'delete', msg: `Delete page "${item.title}"?` })} className="rounded-none h-7 px-2 text-destructive"><Trash2 className="size-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader><DialogTitle className="uppercase tracking-widest text-sm font-normal">Sculpture Metadata</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3"><Label className="text-[10px] uppercase">Title</Label><Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} className="rounded-none" /></div>
              <div><Label className="text-[10px] uppercase">Order</Label><Input type="number" value={itemOrder} onChange={e => setItemOrder(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2"><Label className="text-[10px] uppercase">Description</Label><Textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="rounded-none h-32" /></div>
          </div>
          <DialogFooter><Button onClick={saveItem} disabled={isSaving} className="rounded-none w-full uppercase tracking-widest font-bold h-11">{isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save Metadata</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="max-w-2xl rounded-none overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="uppercase tracking-widest text-sm font-normal">{entryType === 'news' ? 'News' : 'Observation'} Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] uppercase">Title</Label><Input value={entryTitle} onChange={e => setEntryTitle(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label className="text-[10px] uppercase">Date</Label><Input value={entryDate} onChange={e => setEntryDate(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] uppercase">Image (filename)</Label><Input value={entryImagePath} onChange={e => setEntryImagePath(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label className="text-[10px] uppercase">Video ID</Label><Input value={entryVideoId} onChange={e => setEntryVideoId(e.target.value)} className="rounded-none" /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase">Content</Label>
              <Textarea value={entryContent} onChange={e => setEntryContent(e.target.value)} className="rounded-none h-48" />
            </div>
          </div>
          <DialogFooter><Button onClick={saveEntry} disabled={isSaving} className="rounded-none w-full uppercase tracking-widest font-bold h-11">{isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save Entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
        <DialogContent className="max-w-3xl rounded-none overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="uppercase tracking-widest text-sm font-normal">Page Editor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] uppercase">Title</Label><Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label className="text-[10px] uppercase">Slug</Label><Input value={pageSlug} onChange={e => setPageSlug(e.target.value)} className="rounded-none" disabled={!editingPage?.isNew} /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase">Content</Label>
              <p className="text-[8px] text-muted-foreground">Use [image:filename.jpg] for images and [video:filename.mp4] for auto-playing videos. Use [Label](url) for links.</p>
              <Textarea value={pageContent} onChange={e => setPageContent(e.target.value)} className="rounded-none h-64 font-mono" />
            </div>
          </div>
          <DialogFooter><Button onClick={savePage} disabled={isSaving} className="rounded-none w-full uppercase tracking-widest font-bold h-11">{isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="size-3 mr-2" />} Save Page</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase tracking-widest text-sm font-normal">Confirm Action</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">{itemToDelete?.msg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className="rounded-none bg-destructive hover:bg-destructive/90">Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}