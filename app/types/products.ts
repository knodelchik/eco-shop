// Категорії еко-магазину.
// Зберігаємо старі ID ('sharpeners' | 'stones' | 'accessories') як технічні значення
// у Supabase, але для UX вони мапляться на еко-категорії:
//   sharpeners  -> Еко-косметика
//   stones      -> Багаторазовий посуд
//   accessories -> Zero-waste аксесуари
//
// Якщо вирішите фізично переіменувати їх у БД, оновіть migration та значення тут.
export type ProductCategory = "sharpeners" | "stones" | "accessories";

export const ECO_CATEGORY_LABELS: Record<ProductCategory, { uk: string; en: string }> = {
  sharpeners: { uk: "Еко-косметика", en: "Eco Cosmetics" },
  stones: { uk: "Багаторазовий посуд", en: "Reusable Tableware" },
  accessories: { uk: "Zero-waste аксесуари", en: "Zero-waste Accessories" },
};

export type Product = {
  id: number;
  title: string;
  title_uk?: string;
  description?: string;
  description_uk?: string;
  price: number;
  images: string[];
  category: ProductCategory;
  created_at?: string;
  stock: number;
  // Еко-специфічні поля
  ecoCertification?: string; // напр. "FSC, GOTS, COSMOS Organic"
  material?: string;          // напр. "Бамбук + органічна бавовна"
  isBiodegradable?: boolean;  // 100% компостується
  isVegan?: boolean;
  isPlasticFree?: boolean;
  carbonFootprintKg?: number; // оцінка вуглецевого сліду на одиницю
  countryOfOrigin?: string;
};
