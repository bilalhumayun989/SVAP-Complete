export interface ProductUser {
  name: string
  email: string
  avatar: string
}

export interface Product {
  id: string
  user: ProductUser
  image: string
  title: string
  description: string
  location: string
  views: number
  condition?: string
  swapFor?: string
  swapForImage?: string
}

const itemDefs = [
  { title: "iPhone 15 Pro Max 256GB",  swapFor: "MacBook Air M2",         swapImg: "https://picsum.photos/seed/macbook/120/80"  },
  { title: "MacBook Air M2 8/256GB",   swapFor: "iPad Pro M2",            swapImg: "https://picsum.photos/seed/ipad/120/80"    },
  { title: "PS5 Slim Disc Edition",    swapFor: "Xbox Series X",          swapImg: "https://picsum.photos/seed/xbox/120/80"    },
  { title: "Canon EOS R6 + 24-105mm", swapFor: "Sony A7 IV",             swapImg: "https://picsum.photos/seed/camera2/120/80" },
  { title: "Samsung Galaxy S24 Ultra", swapFor: "iPhone 15 Pro",          swapImg: "https://picsum.photos/seed/iphone14/120/80"},
  { title: "Dell XPS 15 Core i7 RTX",  swapFor: "MacBook Pro M3",         swapImg: "https://picsum.photos/seed/macpro/120/80"  },
  { title: "Apple Watch Series 9 45mm",swapFor: "Samsung Galaxy Watch 6", swapImg: "https://picsum.photos/seed/watch2/120/80"  },
  { title: "iPad Pro M2 11-inch",      swapFor: "Surface Pro 9",          swapImg: "https://picsum.photos/seed/surface/120/80" },
  { title: "DJI Mini 4 Pro Drone",     swapFor: "DJI Air 3",              swapImg: "https://picsum.photos/seed/drone2/120/80"  },
  { title: "Sony WH-1000XM5",          swapFor: "AirPods Max",            swapImg: "https://picsum.photos/seed/airpods/120/80" },
  { title: "Xbox Series X 1TB",        swapFor: "PS5 Digital Edition",    swapImg: "https://picsum.photos/seed/ps5d/120/80"    },
  { title: "Kindle Paperwhite 11th",   swapFor: "Kobo Libra 2",           swapImg: "https://picsum.photos/seed/kobo/120/80"    },
]

const cities     = ["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Hyderabad","Peshawar","Quetta","Sialkot"]
const conditions = ["Like New","Good","Fair","Brand New"]

export const products: Product[] = Array.from({ length: 50 }).map((_, i) => {
  const def = itemDefs[i % itemDefs.length]
  return {
    id:          (i + 1).toString(),
    user: {
      name:   `user_${i + 1}`,
      email:  `user${i + 1}@mail.com`,
      avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
    },
    image:       `https://picsum.photos/seed/product_${i + 1}/800/600`,
    title:       def.title,
    description: `High quality product in excellent condition. ${i % 2 === 0 ? "With box and accessories included." : "Barely used, like new."}`,
    location:    cities[i % cities.length],
    views:       150 + (i * 17) % 750,
    condition:   conditions[i % conditions.length],
    swapFor:     def.swapFor,
    swapForImage:def.swapImg,
  }
})
