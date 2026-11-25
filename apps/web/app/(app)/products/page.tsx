import { ProductManagementView } from '@/components/ProductManagementView';

export const metadata = {
  title: 'Menu Products & Recipe Studio | Nitsuh Foods & Cafe',
};

export default function ProductsPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar bg-[#F8F9FA] text-stone-900 font-sans">
      <div className="max-w-7xl mx-auto pb-16">
        <ProductManagementView />
      </div>
    </div>
  );
}
