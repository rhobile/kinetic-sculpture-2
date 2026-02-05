
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { getStorage, ref as storageRef, listAll, deleteObject, uploadBytes } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Button } from '@/components/ui/button';
import { 
  Trash2, Upload, Loader2, RefreshCw, Lock, Video, 
  Image as ImageIcon, CheckCircle2, AlertCircle, Info, Edit3, Save, X 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EXCLUDED_IMAGES } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ManageGalleryPage() {
  const { firebaseApp, auth, firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<'ks-images' | 'ks-videos'>('ks-images');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore Descriptions
  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'videos');
  }, [firestore]);
  const { data: firestoreVideos } = useCollection(videosQuery);

  // Editing State
  const [editingSculpture, setEditingSculpture] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
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
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: error.code === 'storage/unauthorized' 
          ? "Wait 60s for rules to deploy, then refresh." 
          : "Could not fetch files from ks- folders."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (firebaseApp) {
      fetchData();
    }
  }, [firebaseApp]);

  const handleDelete = async (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You must be signed in." });
      return;
    }

    const isConfirmed = window.confirm(`Are you sure you want to delete this file?\nPath: ${path}`);
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
        description: error.message || "You might not have permission."
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firebaseApp) return;

    if (!user) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You must be signed in." });
      return;
    }

    setIsUploading(true);
    try {
      const storage = getStorage(firebaseApp);
      const storageReference = storageRef(storage, `${uploadFolder}/${file.name}`);
      await uploadBytes(storageReference, file);
      toast({ title: "Upload successful" });
      fetchData();
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Check file type and permissions."
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openEditDialog = (image: any) => {
    const fileName = image.name.split('.').slice(0, -1).join('.');
    const normalizedKey = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = firestoreVideos?.find(v => v.id === normalizedKey);
    
    setEditingSculpture({ ...image, normalizedKey });
    setEditTitle(existing?.title || fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
    setEditDesc(existing?.description || '');
  };

  const handleSaveDescription = async () => {
    if (!firestore || !editingSculpture) return;
    setIsSaving(true);
    try {
      const docRef = doc(firestore, 'videos', editingSculpture.normalizedKey);
      await setDoc(docRef, {
        id: editingSculpture.normalizedKey,
        title: editTitle,
        description: editDesc,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast({ title: "Description saved" });
      setEditingSculpture(null);
    } catch (error: any) {
      console.error("Save failed:", error);
      toast({ variant: "destructive", title: "Save failed", description: error.message });
    } finally {
      setIsSaving(false);
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
          <div>
            <h1 className="text-[12pt] font-normal uppercase tracking-widest flex items-center gap-2">
              Cloud Storage Browser (ks- folders)
              {!user && !isAuthLoading && <Lock className="size-3 text-muted-foreground" />}
            </h1>
            <p className="text-[12pt] text-muted-foreground mt-1 font-normal">Manage sculpture media and descriptions.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="rounded-none font-normal text-[11pt]">
              <RefreshCw className="size-4 mr-2" /> Refresh
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept={uploadFolder === 'ks-images' ? "image/*" : "video/mp4"}
            />
          </div>
        </div>

        <Alert className="rounded-none border-accent/20 bg-accent/5">
          <Info className="h-4 w-4 text-accent" />
          <AlertTitle className="text-[10pt] uppercase tracking-widest font-normal">Management Tips</AlertTitle>
          <AlertDescription className="text-[10pt] text-muted-foreground font-normal space-y-2 mt-2">
            <p>Maintain consistent filenames (e.g., <code>wave.jpg</code> and <code>wave.mp4</code>). Click the edit icon to manage descriptions stored in Firestore.</p>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-none bg-muted/50 p-1 mb-8">
            <TabsTrigger value="images" className="rounded-none data-[state=active]:bg-background">
              <ImageIcon className="size-4 mr-2" /> Images ({images.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="rounded-none data-[state=active]:bg-background">
              <Video className="size-4 mr-2" /> Videos ({videos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Sculpture Images (/ks-images)</h2>
              <Button size="sm" onClick={() => { setUploadFolder('ks-images'); fileInputRef.current?.click(); }} disabled={isUploading} className="rounded-none h-8 font-normal text-[10pt]">
                {isUploading && uploadFolder === 'ks-images' ? <Loader2 className="size-3 animate-spin mr-2" /> : <Upload className="size-3 mr-2" />}
                Upload Image
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-none" />)}
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group aspect-square bg-muted border border-border/50 overflow-hidden rounded-none">
                    <FirebaseStorageImage
                      path={image.path}
                      alt={image.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-60 rounded-none"
                    />
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      {hasMatchingVideo(image.name) ? (
                        <div className="bg-green-500/90 p-1" title="Has matching video">
                          <CheckCircle2 className="size-3 text-white" />
                        </div>
                      ) : (
                        <div className="bg-amber-500/90 p-1" title="Missing matching video">
                          <AlertCircle className="size-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 gap-2">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="rounded-none h-10 w-10" 
                        onClick={() => openEditDialog(image)}
                        title="Edit Description"
                      >
                        <Edit3 className="size-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="rounded-none h-10 w-10" 
                        onClick={(e) => handleDelete(e, image.path)}
                        title="Delete Image"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-[9pt] truncate font-normal">
                      {image.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-border/50 text-muted-foreground font-normal">
                No images found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Sculpture Videos (/ks-videos)</h2>
              <Button size="sm" onClick={() => { setUploadFolder('ks-videos'); fileInputRef.current?.click(); }} disabled={isUploading} className="rounded-none h-8 font-normal text-[10pt]">
                {isUploading && uploadFolder === 'ks-videos' ? <Loader2 className="size-3 animate-spin mr-2" /> : <Upload className="size-3 mr-2" />}
                Upload Video
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-none" />)}
              </div>
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="p-4 bg-muted/30 border border-border/50 flex justify-between items-center group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Video className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-[11pt] font-normal truncate">{video.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0" 
                      onClick={(e) => handleDelete(e, video.path)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-border/50 text-muted-foreground font-normal">
                No videos found.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Description Dialog */}
      <Dialog open={!!editingSculpture} onOpenChange={() => setEditingSculpture(null)}>
        <DialogContent className="rounded-none border-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-normal text-[12pt]">Edit Sculpture Info</DialogTitle>
            <DialogDescription className="text-[10pt]">Updates are stored in Firestore and show instantly in the gallery.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[10pt] uppercase tracking-wide">Title</Label>
              <Input 
                id="title" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
                className="rounded-none"
                placeholder="Sculpture Title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-[10pt] uppercase tracking-wide">Description</Label>
              <Textarea 
                id="desc" 
                value={editDesc} 
                onChange={(e) => setEditDesc(e.target.value)} 
                className="rounded-none min-h-[150px]"
                placeholder="Paste or type the description here..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingSculpture(null)} className="rounded-none font-normal">
              <X className="size-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSaveDescription} disabled={isSaving} className="rounded-none font-normal">
              {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
