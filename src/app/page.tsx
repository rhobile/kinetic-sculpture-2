'use client';

import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Card, CardContent } from '@/components/ui/card';
import { FirebaseImages } from '@/lib/firebase-images';

export default function Home() {
  return (
    <div className="bg-background">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="columns-4 gap-0 space-y-0">
          {FirebaseImages.map((image) => (
            <div key={image.id} className="break-inside-avoid">
              <Card className="overflow-hidden transition-shadow duration-300 rounded-none border-0 shadow-none">
                <CardContent className="p-0">
                  <FirebaseStorageImage
                    path={image.path}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    className="w-full h-auto"
                  />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
