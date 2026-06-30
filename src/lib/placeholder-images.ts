import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

const typedData: { placeholderImages: ImagePlaceholder[] } = data;

export const PlaceHolderImages: ImagePlaceholder[] = typedData.placeholderImages;
