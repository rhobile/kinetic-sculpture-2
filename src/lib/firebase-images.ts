import data from './firebase-images.json';

export type FirebaseImage = {
  id: string;
  path: string;
  alt: string;
  description?: string;
  width: number;
  height: number;
};

const typedData: { firebaseImages: FirebaseImage[] } = data;

export const FirebaseImages: FirebaseImage[] = typedData.firebaseImages;
