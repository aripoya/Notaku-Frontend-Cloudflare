"use client";
import { useParams } from "next/navigation";

export default function ReceiptDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Detail Nota #{id}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <img src={`https://picsum.photos/seed/${id}/600/400`} alt="Nota" className="rounded-md border" />
        <div className="rounded-md border p-4 space-y-3">
          <h3 className="font-semibold">Data Terekstrak</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="space-y-1">
              <span>Supplier</span>
              <input className="border rounded-md px-2 py-1 w-full" defaultValue="Toko Contoh" />
            </label>
            <label className="space-y-1">
              <span>Tanggal</span>
              <input className="border rounded-md px-2 py-1 w-full" defaultValue={new Date().toISOString().slice(0,10)} />
            </label>
            <label className="space-y-1 col-span-2">
              <span>Total</span>
              <input className="border rounded-md px-2 py-1 w-full" defaultValue="250000" />
            </label>
          </div>
          <button className="px-4 py-2 rounded-md bg-blue-600 text-white">Simpan Koreksi</button>
        </div>
      </div>
    </div>
  );
}
