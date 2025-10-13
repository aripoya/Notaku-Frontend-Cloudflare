import ReceiptList from "@/components/receipt/ReceiptList";

const items = Array.from({ length: 6 }).map((_, i) => ({
  id: `${i + 1}`,
  imageUrl: `https://picsum.photos/seed/${i + 1}/200/200`,
  total: 100000 + i * 25000,
  supplier: ["Toko A", "Toko B", "Toko C"][i % 3],
  date: new Date().toISOString(),
}));

export default function ReceiptsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Daftar Nota</h1>
      <ReceiptList items={items} />
    </div>
  );
}
