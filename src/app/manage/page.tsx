'use client';

import { useState, useEffect, useRef } from 'react';
import { getStorage, ref, listAll, deleteObject, uploadBytes } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { useFirebase } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, Loader2, RefreshCw, Lock, Video, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EXCLUDED_IMAGES } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ManageGalleryPage() {
  const { firebaseApp, auth, user, isUserLoading: isAuthLoading } = useFirebase();
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<'menu-images' | 'menu-videos'>('menu-images');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure user is signed in (anonymously) to satisfy Storage rules for writes
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
      
      // Fetch Images
      const imgRef = ref(storage, 'menu-images/');
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

      // Fetch Videos
      const vidRef = ref(storage, 'menu-videos/');
      const vidRes = await listAll(vidRef);
      const videoItems = vidRes.items.map(item => ({
        id: item.fullPath,
        path: item.fullPath,
        name: item.name
      }));
      setVideos(videoItems);

    } catch (error: any) {
      console.error("Error loading storage content:", error);
      if (error.code !== 'storage/unauthorized') {
        toast({
          variant: "destructive",
          title: "Error loading content",
          description: "Could not fetch files from Cloud Storage."
        });
      }
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
      const fileRef = ref(storage, path);
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
      const storageRef = ref(storage, `${uploadFolder}/${file.name}`);
      await uploadBytes(storageRef, file);
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

  const triggerUpload = (folder: 'menu-images' | 'menu-videos') => {
    setUploadFolder(folder);
    fileInputRef.current?.click();
  };

  // Check for matching video for an image
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
              Cloud Storage Browser
              {!user && !isAuthLoading && <Lock className="size-3 text-muted-foreground" />}
            </h1>
            <p className="text-[12pt] text-muted-foreground mt-1 font-normal">Manage sculpture metadata and media pairs.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="rounded-none font-normal text-[11pt]">
              <RefreshCw className="size-4 mr-2" /> Refresh All
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept={uploadFolder === 'menu-images' ? "image/*" : "video/mp4"}
            />
          </div>
        </div>

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
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Sculpture Images (/menu-images)</h2>
              <Button size="sm" onClick={() => triggerUpload('menu-images')} disabled={isUploading} className="rounded-none h-8 font-normal text-[10pt]">
                {isUploading && uploadFolder === 'menu-images' ? <Loader2 className="size-3 animate-spin mr-2" /> : <Upload className="size-3 mr-2" />}
                Upload .jpg
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
                    <div className="absolute top-2 left-2 z-10">
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
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="rounded-none h-10 w-10" 
                        onClick={(e) => handleDelete(e, image.path)}
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
              <div className="text-center py-20 border border-dashed border-border/50 text-muted-foreground">
                No images found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[10pt] uppercase tracking-widest font-normal">Sculpture Videos (/menu-videos)</h2>
              <Button size="sm" onClick={() => triggerUpload('menu-videos')} disabled={isUploading} className="rounded-none h-8 font-normal text-[10pt]">
                {isUploading && uploadFolder === 'menu-videos' ? <Loader2 className="size-3 animate-spin mr-2" /> : <Upload className="size-3 mr-2" />}
                Upload .mp4
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
              <div className="text-center py-20 border border-dashed border-border/50 text-muted-foreground">
                No videos found.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-12 p-6 bg-muted/20 border border-border/50">
          <h2 className="text-[10pt] uppercase tracking-widest font-normal mb-4">How to synchronize</h2>
          <ul className="text-[11pt] text-muted-foreground space-y-2 font-normal">
            <li>• Every <strong>.jpg</strong> in <code className="text-foreground">menu-images/</code> needs a matching <strong>.mp4</strong> in <code className="text-foreground">menu-videos/</code>.</li>
            <li>• The filenames must be identical (e.g., <code className="text-foreground">sculpture-one.jpg</code> and <code className="text-foreground">sculpture-one.mp4</code>).</li>
            <li>• Case sensitivity matters in Firebase Storage; use all lowercase if possible.</li>
            <li>• Images without matching videos will be excluded from the public home page gallery.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
