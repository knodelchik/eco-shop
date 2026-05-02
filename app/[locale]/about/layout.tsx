/**
 * About / Журнал — мінімалістичний layout без sidebar-ів.
 * Простий контейнер, що дозволяє кожній статті/сторінці використовувати
 * власну розкладку.
 */
export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
