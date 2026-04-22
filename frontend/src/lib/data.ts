export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAt?: number;
  stock: number;
  category: string;
  categorySlug?: string;
  imageUrl?: string;
  status?: string;
  featured?: boolean;
};

export const fallbackProducts: Product[] = [
  {
    id: "1",
    name: "Jaqueta Atelier",
    slug: "jaqueta-atelier",
    description: "Modelagem estruturada e tecido encorpado para looks urbanos.",
    price: 329.9,
    compareAt: 389.9,
    stock: 8,
    category: "Outerwear",
    categorySlug: "outerwear",
    imageUrl: "https://images.unsplash.com/photo-1523398002811-999ca8dec234",
    featured: true
  },
  {
    id: "2",
    name: "Vestido Horizon",
    slug: "vestido-horizon",
    description: "Silhueta fluida com acabamento premium para ocasioes especiais.",
    price: 279.9,
    stock: 13,
    category: "Vestidos",
    categorySlug: "vestidos",
    imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c",
    featured: true
  },
  {
    id: "3",
    name: "Camisa Essential Linen",
    slug: "camisa-essential-linen",
    description: "Linho leve e toque natural para um visual elegante no calor.",
    price: 189.9,
    stock: 21,
    category: "Camisas",
    categorySlug: "camisas",
    imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f"
  }
];

export const adminUsers = [
  {
    id: "u1",
    name: "Ana Martins",
    email: "ana@fashionstore.com",
    role: "ADMIN",
    status: "Ativo"
  },
  {
    id: "u2",
    name: "Carlos Souza",
    email: "carlos@fashionstore.com",
    role: "CUSTOMER",
    status: "Ativo"
  }
];

export const dashboardSummary = [
  { label: "Faturamento", value: "R$ 48.320", detail: "+12% no mes" },
  { label: "Pedidos", value: "184", detail: "27 aguardando envio" },
  { label: "Produtos", value: "96", detail: "14 com estoque baixo" },
  { label: "Clientes", value: "1.248", detail: "+87 novos" }
];
