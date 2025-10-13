import SpendingChart from "@/components/dashboard/SpendingChart";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";

const trend = Array.from({ length: 30 }).map((_, i) => ({ date: `${i + 1}`, amount: Math.round(500000 + Math.random() * 1500000) }));
const cats = [
  { name: "Bahan Baku", value: 45 },
  { name: "Operasional", value: 25 },
  { name: "Gaji", value: 15 },
  { name: "Marketing", value: 10 },
  { name: "Lainnya", value: 5 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><SpendingChart data={trend} /></div>
        <div><CategoryBreakdown data={cats} /></div>
      </div>
      <div className="rounded-lg border p-6 bg-white dark:bg-slate-900">
        <h3 className="font-semibold">Heatmap Pengeluaran (placeholder)</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Akan diimplementasikan dengan kalender heatmap.</p>
      </div>
    </div>
  );
}
