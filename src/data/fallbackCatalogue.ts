export interface FallbackProduct {
  id: number;
  name: string;
  tagline?: string;
  price: number;
  image: string;
  bestseller?: boolean;
}

export const fallbackProducts: FallbackProduct[] = [
  {
    id: 1,
    name: 'Mini Retro Car',
    tagline: 'Small set, big fun.',
    price: 12.99,
    image: 'https://images.pexels.com/photos/35619/capri-ford-oldtimer-automotive.jpg?auto=compress&cs=tinysrgb&w=800',
    bestseller: true,
  },
  {
    id: 2,
    name: 'Cosmic Robot',
    tagline: 'Build your own galactic buddy.',
    price: 14.99,
    image: 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=800',
    bestseller: true,
  },
  {
    id: 3,
    name: 'Castle in the Clouds',
    tagline: 'For dreamers and creators.',
    price: 18.99,
    image: 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=800',
    bestseller: true,
  },
  {
    id: 4,
    name: 'Ocean Explorer',
    tagline: 'Dive into creativity.',
    price: 16.99,
    image: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 5,
    name: 'Space Station',
    tagline: 'Build your own orbit.',
    price: 22.99,
    image: 'https://images.pexels.com/photos/73910/mars-mars-rover-space-travel-robot-73910.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 6,
    name: 'Jungle Temple',
    tagline: 'Adventure awaits.',
    price: 19.99,
    image: 'https://images.pexels.com/photos/1660996/pexels-photo-1660996.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export function resolveFallbackImage(image: string): string {
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
    return image;
  }

  if (!image.startsWith('/')) {
    return `/fallback-products/${image}`;
  }

  return image;
}
