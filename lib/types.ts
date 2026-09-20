export type ColorDef = {
  key: string; label: string; hex: string; frameHex: string; priceDelta: number;
};

export type SpecGroup = { group: string; items: { label: string; value: string }[] };
export type SpecsFlat = {
  displaySize?: number; refreshHz?: number; nits?: number; chip?: string; ramGb?: number;
  storageMaxGb?: number; mainCameraMP?: number; batteryMah?: number; wiredChargeW?: number;
  wirelessChargeW?: number; weightG?: number; os?: string; ip?: string;
};
export type Specs = { flat: SpecsFlat; groups: SpecGroup[] };

export type VariantView = {
  id: string; sku: string; label: string; colorKey: string | null;
  ramGb: number | null; storageGb: number | null;
  price: number; compareAtPrice: number | null; stock: number;
  sizeLabel: string | null;
};

export type ProductCardView = {
  id: string; slug: string; name: string; tagline: string; brand: string;
  basePrice: number; compareAtPrice: number | null; currency: string;
  ratingAverage: number; ratingCount: number;
  featured: boolean; isNew: boolean; badge: string | null;
  image: string; imageAlt: string;
  colors: ColorDef[];
  categorySlug: string; categoryName: string;
  deal: { title: string; endsAt: string; type: string } | null;
  onSale: boolean;
  totalStock: number;
  createdAt: string;
};

export type ProductView = ProductCardView & {
  description: string;
  highlights: string[];
  specs: Specs;
  images: { url: string; alt: string; colorKey: string | null }[];
  variants: VariantView[];
  reviewCount: number;
};

export type ReviewView = {
  id: string; authorName: string; rating: number; title: string; body: string;
  verified: boolean; helpful: number; createdAt: string; userId?: string | null;
};

export type OrderView = {
  id: string; number: string; status: string; paymentStatus: string;
  subtotal: number; discount: number; shipping: number; tax: number; total: number;
  couponCode: string | null; deliveryMethod: string;
  createdAt: string; timeline: { status: string; at: string; note?: string }[];
  items: { name: string; sku: string; label: string | null; image: string | null; unitPrice: number; quantity: number; total: number }[];
  ship: { name: string; line1: string; line2?: string | null; city: string; postal: string; country: string; email: string; phone: string };
};

export type AdminOrderView = OrderView & {
  user: { email: string; name: string } | null;
  payment: { provider: string; last4: string | null; status: string } | null;
};
