import ReceiptCard from "./ReceiptCard";

type Receipt = { id: string; imageUrl: string; total: number; supplier?: string; date: string };
export default function ReceiptList({ items }: { items: Receipt[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((r) => (
        <ReceiptCard key={r.id} r={r} />
      ))}
    </div>
  );
}
