'use client';

import { useState, useEffect, useRef } from 'react';
import { getStorage, ref, listAll, deleteObject, uploadBytes } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const EXCLUDED_IMAGES = ['helix', 'polished-rhobile_on', 'limetree', 'chopsticksmurfitts2', 'chopstxsap12_on', 'dashcube', 'bubbles_on', 'trioxi_on', 'redsquare_on'];

export default function ManageGalleryPage() {
  const app = useFirebaseApp();
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    if (!app) return;
    setIsLoading(true);
    try {
      const storage = getStorage(app);
      const listRef = ref(storage, 'menu-images/');
      const res = await listAll(listRef);
      
      // Filter to only include .jpg and .jpeg files, and exclude specific names
      const filteredItems = res.items.filter(item => {
        const lowerName = item.name.toLowerCase();
        const isJpg = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
        const fileNameWithoutExt = lowerName.split('.').slice(0, -1).join('.');
        const isExcluded = EXCLUDED_IMAGES.some(excluded => fileNameWithoutExt === excluded.toLowerCase());
        return isJpg && !isExcluded;
      });

      const storageImages = filteredItems.map((item) => ({
        id: item.fullPath,
        path: item.fullPath,
        name: item.name,
      }));
      setImages(storageImages);
    } catch (error) {
      console.error("Error loading images:", error);
      toast({
        variant: "destructive",
        title: "Error loading images",
        description: "Could not fetch images from Storage."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [app]);

  const handleDelete = async (e: React.MouseEvent, imagePath: string) => {
    e.preventDefault();
    e.stopPropagation();

    const isConfirmed = window.confirm("Are you sure you want to delete this sculpture image? This will remove it from the public gallery.");
    
    if (!isConfirmed) return;
    
    try {
      const storage = getStorage(app);
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      toast({ title: "Image deleted successfully" });
      await fetchImages();
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message || "You might not have permission to delete this file."
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !app) return;

    setIsUploading(true);
    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, `menu-images/${file.name}`);
      await uploadBytes(storageRef, file);
      toast({ title: "Image uploaded successfully" });
      fetchImages();
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Ensure you are uploading a valid image file."
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
          <div>
            <h1 className="text-[12pt] font-normal uppercase tracking-widest">Manage Gallery</h1>
            <p className="text-[12pt] text-muted-foreground mt-1 font-normal">Upload or remove sculptures from your public masonry.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchImages} className="rounded-none font-normal text-[12pt]">
              <RefreshCw className="size-4 mr-2" /> Refresh
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="rounded-none font-normal text-[12pt]">
              {isUploading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
              Upload Image
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-none" />
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group aspect-square bg-muted border border-border/50 overflow-hidden rounded-none">
                <FirebaseStorageImage
                  path={image.path}
                  alt={image.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover transition-opacity group-hover:opacity-70"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="rounded-none h-12 w-12" 
                    onClick={(e) => handleDelete(e, image.path)}
                  >
                    <Trash2 className="size-6" />
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-[10pt] truncate font-normal">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-none">
            <p className="text-muted-foreground text-[12pt] font-normal">No .jpg images found. Upload your first sculpture above.</p>
          </div>
        )}
      </div>
    </main>
  );
}
