'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Динамічний імпорт з нової бібліотеки
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="h-48 bg-gray-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
  ),
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  // Розширене налаштування панелі інструментів
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }], // Заголовки H1, H2, H3
      ['bold', 'italic', 'underline', 'strike'], // Жирний, курсив, підкреслений, закреслений
      [{ color: [] }, { background: [] }], // Колір тексту та фону
      [{ align: [] }], // Вирівнювання тексту
      [{ list: 'ordered' }, { list: 'bullet' }], // Списки
      ['clean'], // Очистити форматування
    ],
  };

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="bg-white dark:bg-neutral-800 text-black dark:text-white rounded-xl overflow-hidden"
      />
    </div>
  );
}
