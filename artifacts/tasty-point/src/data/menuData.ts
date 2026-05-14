export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  available: boolean;
  isFeatured: boolean;
  categoryId: string;
  imageUrl: null;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: "m1",  name: "Butter Chicken",         description: "Rich, creamy tomato curry with tender chicken",      price: 320, isVeg: false, available: true, isFeatured: true,  categoryId: "mains",    imageUrl: null },
  { id: "m2",  name: "Paneer Tikka Masala",     description: "Grilled paneer in aromatic spiced gravy",           price: 280, isVeg: true,  available: true, isFeatured: true,  categoryId: "mains",    imageUrl: null },
  { id: "m3",  name: "Dal Makhani",             description: "Slow-cooked black lentils, butter and cream",       price: 220, isVeg: true,  available: true, isFeatured: false, categoryId: "mains",    imageUrl: null },
  { id: "m4",  name: "Grilled Fish Tikka",      description: "Marinated fish grilled to perfection",              price: 380, isVeg: false, available: true, isFeatured: true,  categoryId: "mains",    imageUrl: null },
  { id: "m5",  name: "Chicken Biryani",         description: "Fragrant basmati rice with spiced chicken",         price: 350, isVeg: false, available: true, isFeatured: true,  categoryId: "mains",    imageUrl: null },
  { id: "m6",  name: "Garlic Naan",             description: "Soft leavened bread with garlic butter",            price: 60,  isVeg: true,  available: true, isFeatured: false, categoryId: "breads",   imageUrl: null },
  { id: "m7",  name: "Tandoori Roti",           description: "Whole wheat bread from the clay oven",              price: 40,  isVeg: true,  available: true, isFeatured: false, categoryId: "breads",   imageUrl: null },
  { id: "m8",  name: "Butter Naan",             description: "Fluffy naan brushed with melted butter",            price: 55,  isVeg: true,  available: true, isFeatured: false, categoryId: "breads",   imageUrl: null },
  { id: "m9",  name: "Onion Bhaji",             description: "Crispy golden fried onion fritters",                price: 150, isVeg: true,  available: true, isFeatured: false, categoryId: "starters", imageUrl: null },
  { id: "m10", name: "Seekh Kebab",             description: "Minced lamb skewers, smoky and spiced",             price: 240, isVeg: false, available: true, isFeatured: true,  categoryId: "starters", imageUrl: null },
  { id: "m11", name: "Samosa (2 pcs)",          description: "Crispy pastry filled with spiced potato",           price: 80,  isVeg: true,  available: true, isFeatured: false, categoryId: "starters", imageUrl: null },
  { id: "m12", name: "Mango Lassi",             description: "Chilled yoghurt drink with fresh mango",            price: 120, isVeg: true,  available: true, isFeatured: false, categoryId: "drinks",   imageUrl: null },
  { id: "m13", name: "Masala Chai",             description: "Spiced Indian milk tea",                            price: 60,  isVeg: true,  available: true, isFeatured: false, categoryId: "drinks",   imageUrl: null },
  { id: "m14", name: "Cold Coffee",             description: "Iced coffee with milk and sugar",                   price: 110, isVeg: true,  available: true, isFeatured: false, categoryId: "drinks",   imageUrl: null },
  { id: "m15", name: "Gulab Jamun",             description: "Soft milk-solid dumplings in rose syrup",           price: 100, isVeg: true,  available: true, isFeatured: false, categoryId: "desserts", imageUrl: null },
  { id: "m16", name: "Kheer",                   description: "Rice pudding with cardamom and pistachios",         price: 110, isVeg: true,  available: true, isFeatured: false, categoryId: "desserts", imageUrl: null },
];

export const CATEGORIES = [
  { id: "mains",    name: "Mains" },
  { id: "breads",   name: "Breads" },
  { id: "starters", name: "Starters" },
  { id: "drinks",   name: "Drinks" },
  { id: "desserts", name: "Desserts" },
];

export const MENU_MAP: Record<string, MenuItem> = Object.fromEntries(MENU_ITEMS.map((i) => [i.id, i]));
