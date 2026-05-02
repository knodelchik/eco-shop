'use client';

import { useRef, useState } from 'react';
import { Loader2, Star, Trash2, Plus, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import RichTextEditor from '@/app/Components/RichTextEditor';
import { cloudinaryConfigured, uploadMany } from '@/lib/cloudinary';

interface ProductFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product?: any | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ProductForm({
  product,
  onSaved,
  onCancel,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);

  // Ініціалізація стану форми
  const [formData, setFormData] = useState({
    title: product?.title || '',
    title_uk: product?.title_uk || '',
    price: product?.price || '',
    stock: product?.stock !== undefined ? product.stock : 0,
    category: product?.category || 'sharpeners',
    description: product?.description || '',
    description_uk: product?.description_uk || '',
  });

  const [images, setImages] = useState<string[]>(
    Array.isArray(product?.images) ? product.images : []
  );
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!cloudinaryConfigured) {
      toast.error(
        'Cloudinary не налаштований. Додайте NEXT_PUBLIC_CLOUDINARY_* у .env.local'
      );
      return;
    }
    setUploading(true);
    try {
      const urls = await uploadMany(files);
      setImages((prev) => [...prev, ...urls]);
      toast.success(`Завантажено: ${urls.length}`);
    } catch (e) {
      console.error('Cloudinary upload error:', e);
      toast.error(e instanceof Error ? e.message : 'Помилка завантаження');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- ЛОГІКА РОБОТИ З ФОТО ---
  // У Neon немає вбудованого Storage, тому додаємо зображення за URL
  // (наприклад, із зовнішнього CDN, Cloudinary, Imgur тощо).
  const addImageByUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//.test(url) && !url.startsWith('/')) {
      toast.error('URL має починатися з http(s):// або /');
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrlInput('');
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const makeMain = (indexToMain: number) => {
    const newImages = [...images];
    const [selectedImage] = newImages.splice(indexToMain, 1);
    newImages.unshift(selectedImage);
    setImages(newImages);
    toast.success('Головне фото змінено');
  };

  // --- ЗБЕРЕЖЕННЯ ФОРМИ ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        title: formData.title,
        title_uk: formData.title_uk,
        price: parseFloat(formData.price),
        stock: formData.stock === '' ? 0 : parseInt(formData.stock.toString()),
        category: formData.category,
        description: formData.description,
        description_uk: formData.description_uk,
        images: images,
      };

      let res: Response;
      if (product?.id) {
        res = await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: product.id, ...productData }),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Невідома помилка');
      }

      toast.success(product ? 'Товар оновлено!' : 'Товар створено!');
      onSaved();
    } catch (error) {
      console.error('Save error:', error);
      const msg = error instanceof Error ? error.message : 'Невідома помилка';
      toast.error('Помилка збереження: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      {/* === БЛОК ФОТОГРАФІЙ === */}
      <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 dark:border-neutral-800">
        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
          Фотографії ({images.length})
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-neutral-700 group bg-white"
            >
              <Image
                src={url}
                alt={`Product ${index}`}
                fill
                className="object-cover"
                sizes="100px"
              />

              {index === 0 && (
                <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                  Лицьова
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeMain(index)}
                    className="p-1.5 bg-white text-yellow-500 rounded-full hover:scale-110 transition shadow-lg"
                    title="Зробити головним"
                  >
                    <Star size={14} fill="currentColor" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1.5 bg-white text-red-500 rounded-full hover:scale-110 transition shadow-lg"
                  title="Видалити"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

        </div>

        {/* Drag-drop / file picker — Cloudinary upload (якщо налаштований) */}
        {cloudinaryConfigured && (
          <div className="mt-4">
            <label
              htmlFor="product-images-upload"
              className={`block border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                uploading
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-muted'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-primary text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Завантажуємо у Cloudinary…
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-sm text-foreground">
                    Перетягніть фото сюди або натисніть, щоб обрати
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG / PNG / WebP, до 5 МБ
                  </p>
                </div>
              )}
            </label>
            <input
              id="product-images-upload"
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>
        )}

        {/* Додавання зображення за URL — fallback */}
        <div className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
              URL зображення (можна Cloudinary, Imgur, або /images/...)
            </label>
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 outline-none text-sm"
            />
          </div>
          <button
            type="button"
            onClick={addImageByUrl}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm font-semibold"
          >
            <Plus size={16} /> Додати
          </button>
        </div>
      </div>

      {/* === ПОЛЯ ВВОДУ === */}
      <div className="space-y-4">
        {/* Назва (Multilingual) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Назва товару (EN) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Stone Holder PRO"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Назва товару (UK)
            </label>
            <input
              type="text"
              placeholder="Тримач каменів PRO"
              value={formData.title_uk}
              onChange={(e) =>
                setFormData({ ...formData, title_uk: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Ціна, Сток, Категорія */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Ціна ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Сток (шт)
            </label>
            <input
              type="number"
              min="0"
              required
              placeholder="0"
              value={formData.stock}
              onChange={(e) => {
                const val = e.target.value;
                // @ts-ignore
                setFormData({ ...formData, stock: val === '' ? '' : parseInt(val) });
              }}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Категорія
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none appearance-none transition-all cursor-pointer"
              >
                <option value="sharpeners">Еко-косметика</option>
                <option value="stones">Багаторазовий посуд</option>
                <option value="accessories">Zero-waste аксесуари</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>


        {/* Опис (Multilingual) за допомогою RichTextEditor */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Опис (EN)
              </label>
            </div>
            <RichTextEditor
              value={formData.description}
              // ✅ ВИПРАВЛЕНО: використовуємо (prev) => ...
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Product description in English..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Опис (UK)
              </label>
            </div>
            <RichTextEditor
              value={formData.description_uk}
              // ✅ ВИПРАВЛЕНО: використовуємо (prev) => ...
              onChange={(value) => setFormData(prev => ({ ...prev, description_uk: value }))}
              placeholder="Опис товару українською..."
            />
          </div>
        </div>
      </div>

      {/* === КНОПКИ ДІЙ === */}
      <div className="flex justify-end gap-3 pt-4 border-t dark:border-neutral-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-white font-medium transition-colors flex items-center gap-2"
        >
          <X size={18} />
          Скасувати
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95 shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : null}
          {product ? 'Оновити' : 'Створити'}
        </button>
      </div>
    </form>
  );
}