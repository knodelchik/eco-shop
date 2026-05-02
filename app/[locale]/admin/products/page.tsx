'use client';

import { useEffect, useState, useMemo } from 'react';
import { Trash2, Plus, Search, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import ProductForm from '@/app/[locale]/admin/ProductForm';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export default function AdminProductsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Стан для сортування
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error('Load products failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Видалити цей товар?')) return;
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
        toast.success('Товар успішно видалено');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(`Помилка видалення: ${data.error || 'unknown'}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Помилка видалення');
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsSheetOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsSheetOpen(true);
  };

  const handleFormSaved = () => {
    setIsSheetOpen(false);
    loadProducts();
  };

  // --- ЛОГІКА СОРТУВАННЯ ---

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';

    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
  };

  // Спочатку фільтруємо, потім сортуємо
  const sortedProducts = useMemo(() => {
    const filtered = products.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Перевірка на числа
        if (typeof aValue === 'number' && typeof bValue === 'number') {
           return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Перевірка на рядки
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return 0;
      });
    }

    return filtered;
  }, [products, searchTerm, sortConfig]);

  // Допоміжний компонент для заголовка таблиці
  const SortableHeader = ({ label, sortKey, width }: { label: string; sortKey: string; width?: string }) => {
    const isActive = sortConfig?.key === sortKey;
    
    return (
      <th 
        className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors select-none ${width || ''}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-2">
          {label}
          {isActive ? (
            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          ) : (
            <ArrowUpDown size={14} className="opacity-30" />
          )}
        </div>
      </th>
    );
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Завантаження товарів...
      </div>
    );

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Товари
        </h1>

        <button
          onClick={handleAddNew}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity active:scale-95"
        >
          <Plus size={18} /> Додати товар
        </button>
      </div>

      <div className="mb-6 relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Пошук за назвою..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 text-sm uppercase font-semibold">
              <tr>
                <th className="p-4 w-24">Фото</th>
                
                {/* Сортувальні заголовки */}
                <SortableHeader label="Назва" sortKey="title" />
                <SortableHeader label="Ціна" sortKey="price" width="w-32" />
                <SortableHeader label="Stock" sortKey="stock" width="w-24" />
                <SortableHeader label="Категорія" sortKey="category" width="w-32" />

                <th className="pr-6 text-right w-24">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Товарів не знайдено
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => handleEdit(product)}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex-shrink-0">
                        {product.images && product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                            No img
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                      {product.title}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                      {product.price} $
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {product.stock > 0 ? (
                        <span className="text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-xs font-bold">
                          {product.stock} шт.
                        </span>
                      ) : (
                        <span className="text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-xs font-bold">
                          Out
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded-full text-xs">
                        {product.category}
                      </span>
                    </td>
                    <td className="pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(product);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors md:hidden group-hover:block"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Видалити"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white dark:bg-neutral-950 border-l dark:border-neutral-800 p-0">
          <SheetHeader className="px-6 py-4 border-b dark:border-neutral-800">
            <SheetTitle>
              {editingProduct ? 'Редагування товару' : 'Створення товару'}
            </SheetTitle>
          </SheetHeader>

          <div className="px-6 py-6">
            <ProductForm
              product={editingProduct}
              onSaved={handleFormSaved}
              onCancel={() => setIsSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}