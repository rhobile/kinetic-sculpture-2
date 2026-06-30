import { FirebaseStorageImage } from '@/components/firebase/storage-image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function DemoPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Firebase Storage Demo</CardTitle>
            <CardDescription>
              This image is loaded from the new /ks-images/ folder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border aspect-video flex items-center justify-center">
              <FirebaseStorageImage
                path="ks-images/arclinedot.jpg"
                alt="Arc Line Dot sculpture"
                width={800}
                height={450}
                className="w-full h-auto"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
