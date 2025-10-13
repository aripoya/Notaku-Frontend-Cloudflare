import StatsCard from "@/components/dashboard/StatsCard";
import SpendingChart from "@/components/dashboard/SpendingChart";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";

const mockTrend = [
  { date: "Sen", amount: 1200000 },
  { date: "Sel", amount: 900000 },
  { date: "Rab", amount: 1500000 },
  { date: "Kam", amount: 800000 },
  { date: "Jum", amount: 1700000 },
  { date: "Sab", amount: 600000 },
  { date: "Min", amount: 1100000 },
];
const mockCats = [
  { name: "Bahan Baku", value: 45 },
  { name: "Operasional", value: 25 },
  { name: "Gaji", value: 15 },
  { name: "Marketing", value: 10 },
  { name: "Lainnya", value: 5 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Bulan Ini" value="Rp 12.450.000" subtitle="+8% dari bulan lalu" />
        <StatsCard title="Jumlah Nota" value="37" subtitle="5 baru" />
        <StatsCard title="Kategori Teratas" value="Bahan Baku" />
        <StatsCard title="Penghematan" value="Rp 650.000" subtitle="vs minggu lalu" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SpendingChart data={mockTrend} />
        </div>
        <div>
          <CategoryBreakdown data={mockCats} />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-900">
        <h3 className="font-semibold">Nota Terbaru</h3>
        <ul className="mt-3 text-sm space-y-2">
          {[
            { id: "1", supplier: "Toko Sumber Rezeki", total: 250000 },
            { id: "2", supplier: "Gudang Bahan", total: 780000 },
            { id: "3", supplier: "PT Kertas", total: 120000 },
            { id: "4", supplier: "CV Plastik Jaya", total: 450000 },
            { id: "5", supplier: "PT Transport", total: 330000 },
          ].map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{r.supplier}</span>
              <span className="font-medium">Rp {r.total.toLocaleString("id-ID")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
