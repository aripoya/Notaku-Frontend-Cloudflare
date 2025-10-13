import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold">Paket Harga</h1>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Basic", price: "Rp 99K/bulan", features: ["Upload nota", "Analitik dasar"] },
            { name: "Starter", price: "Rp 199K/bulan", features: ["Semua fitur Basic", "Chat AI"] },
            { name: "Pro", price: "Rp 399K/bulan", features: ["Semua fitur Starter", "Insight lanjutan"] },
          ].map((t) => (
            <div key={t.name} className="rounded-lg border p-6 bg-white dark:bg-slate-900">
              <h3 className="font-semibold">{t.name}</h3>
              <p className="text-lg font-bold mt-2">{t.price}</p>
              <ul className="mt-3 text-sm list-disc pl-5 space-y-1">
                {t.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white">Pilih</button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
