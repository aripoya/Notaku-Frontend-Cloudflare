import Image from "next/image";
import Link from "next/link";

type Receipt = { id: string; imageUrl: string; total: number; supplier?: string; date: string };
export default function ReceiptCard({ r }: { r: Receipt }) {
  return (
    <Link href={`/dashboard/receipts/${r.id}`} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900 flex gap-3">
      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
        <Image src={r.imageUrl} alt="Nota" fill className="object-cover" />
      </div>
      <div className="text-sm">
        <p className="font-medium">{r.supplier ?? "Tanpa Supplier"}</p>
        <p className="text-slate-600 dark:text-slate-400">{new Date(r.date).toLocaleDateString("id-ID")}</p>
        <p className="mt-1 font-semibold">Rp {r.total.toLocaleString("id-ID")}</p>
      </div>
    </Link>
  );
}
