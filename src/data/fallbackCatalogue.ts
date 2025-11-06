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
    name: 'Absolut Vodka Brick Bottle',
    tagline: 'Limited brick collector run inspired by the iconic bottle.',
    price: 89.99,
    image: 'absolut-vodka.svg',
    bestseller: true,
  },
  {
    id: 2,
    name: 'Crown Royal Brick Decanter',
    tagline: 'Purple velvet aesthetics rendered in studs and slopes.',
    price: 94.99,
    image: 'crown-royal.svg',
    bestseller: true,
  },
  {
    id: 3,
    name: 'Don Julio Collector Build',
    tagline: 'Crystal-clear tequila bottle recreated with transparent bricks.',
    price: 109.99,
    image: 'don-julio.svg',
    bestseller: true,
  },
  {
    id: 4,
    name: 'Grey Goose Display Model',
    tagline: 'A sleek arctic tower with swooping brick-built geese.',
    price: 84.99,
    image: 'grey-goose.svg',
  },
  {
    id: 5,
    name: 'Hennessy Prestige Edition',
    tagline: 'Warm copper tones and a rounded decanter silhouette.',
    price: 99.99,
    image: 'hennessy.svg',
  },
  {
    id: 6,
    name: "Jack Daniel's Heritage Kit",
    tagline: 'Classic Tennessee profile complete with label tiles.',
    price: 79.99,
    image: 'jack-daniels.svg',
  },
  {
    id: 7,
    name: 'Jägermeister Lodge Series',
    tagline: 'Evergreen bottle with stag badge recreated in micro-bricks.',
    price: 92.99,
    image: 'jagermeister.svg',
  },
  {
    id: 8,
    name: 'Jameson Distillery Tribute',
    tagline: 'Irish heritage bottle with barrel-inspired accents.',
    price: 88.99,
    image: 'jameson.svg',
  },
  {
    id: 9,
    name: "Maker's Mark Brick Foundry",
    tagline: 'Signature wax dip sculpted with bold red slopes.',
    price: 82.99,
    image: 'makers-mark.svg',
  },
  {
    id: 10,
    name: 'Malibu Island Edition',
    tagline: 'Tropical vibes, palm trees, and a bright seaside palette.',
    price: 76.99,
    image: 'malibu.svg',
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
