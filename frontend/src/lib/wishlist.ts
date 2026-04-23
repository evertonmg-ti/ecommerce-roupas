export type WishlistProductInput = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAt?: number;
  imageUrl?: string;
  category: string;
  stock: number;
};
