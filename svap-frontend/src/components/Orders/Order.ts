export type OrderStatus = "completed" | "cancelled";

export interface Order {
  id: string;
  itemName: string;
  itemImage: string;
  swappedWith: string;
  swappedImage: string;
  status: OrderStatus;
  date: string;
  location: string;
}

export const ORDERS: Order[] = [
  {
    id: "ORD-001",
    itemName: "iPhone 15 Pro Max 256GB",
    itemImage: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200",
    swappedWith: "MacBook Air M2",
    swappedImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200",
    status: "completed",
    date: "12 Jun 2026",
    location: "Karachi",
  },
  {
    id: "ORD-002",
    itemName: "PS5 Disc Edition",
    itemImage: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=200",
    swappedWith: "Xbox Series X",
    swappedImage: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=200",
    status: "cancelled",
    date: "8 Jun 2026",
    location: "Lahore",
  },
  {
    id: "ORD-003",
    itemName: "Samsung Galaxy S24 Ultra",
    itemImage: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200",
    swappedWith: "iPad Pro M2",
    swappedImage: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200",
    status: "completed",
    date: "1 Jun 2026",
    location: "Islamabad",
  },
  {
    id: "ORD-004",
    itemName: "Sony WH-1000XM5",
    itemImage: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200",
    swappedWith: "AirPods Max",
    swappedImage: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200",
    status: "completed",
    date: "24 May 2026",
    location: "Faisalabad",
  },
];