export type Category = 'ขนม' | 'เครื่องดื่ม';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  description?: string;
  isBestSeller?: boolean;
  isMustTry?: boolean;
  rank?: number;
  customTag?: string; // e.g. "ฟรีไข่มุก!"
  inStock: boolean;
  sweetnessLevels?: string[]; // e.g. ["0%", "25%", "50%", "100%", "120%"]
  toppings?: { name: string; price: number }[];
}

export interface CartItem {
  id: string; // unique for this combination of options (product.id + options string)
  product: Product;
  quantity: number;
  selectedSweetness: string;
  selectedToppings: { name: string; price: number }[];
  note?: string;
}

export type OrderStatus = 'Pending' | 'Preparing' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string; // e.g. "#4401"
  customerName: string;
  roomNo: string;
  phone: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    optionsSummary: string; // e.g. "หวาน 50%, เพิ่มไข่มุก (+฿5)"
  }[];
  totalPrice: number;
  status: OrderStatus;
  note?: string;
  createdAt: string; // ISO string or short time e.g. "2026-07-06 10:30"
  deliveryPhoto?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  stockText: string; // e.g. "Only 2L left"
  status: 'low' | 'normal';
  icon: string; // e.g. "water_drop" or "bakery_dining"
}

export interface ShopConfig {
  isOpen: boolean;
  autoSchedule: boolean;
  openTime: string;
  closeTime: string;
}

