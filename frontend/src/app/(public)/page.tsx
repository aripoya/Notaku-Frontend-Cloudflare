import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Camera, MessageSquare, BarChart3, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-white">
            <div className="max-w-3xl">
              <span className="inline-block text-xs uppercase tracking-wider bg-white/10 py-1 px-2 rounded-full mb-4">Untuk UMKM Indonesia</span>
              <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight">
                Ngobrol dengan Nota Anda
              </h1>
              <p className="mt-5 text-lg text-white/90 max-w-2xl">
                Platform kecerdasan finansial berbasis AI untuk UMKM Indonesia. Upload nota, dapatkan OCR otomatis, dan tanya apa saja tentang pengeluaran Anda.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-white text-slate-900 hover:bg-white/90">
                  <Link href="/register">Coba Gratis 14 Hari</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/25 text-white hover:bg-white/10">
                  <Link href="/pricing" className="inline-flex items-center gap-2">
                    <PlayCircle className="w-5 h-5" /> Lihat Demo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          {/* soft blob */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold">Fitur Utama</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
              icon: Camera,
              title: "OCR Otomatis",
              desc: "Ambil foto atau upload nota. Sistem mengekstrak data dengan akurat.",
              href: "/about"
            },{
              icon: MessageSquare,
              title: "Chat AI",
              desc: "Tanya: 'Berapa total belanja bulan ini?' atau pertanyaan lainnya.",
              href: "/dashboard/chat"
            },{
              icon: BarChart3,
              title: "Analytics",
              desc: "Grafik tren, kategori, supplier, hingga heatmap harian.",
              href: "/dashboard/analytics"
            }].map(({ icon: Icon, title, desc, href }) => (
              <Card key={title} className="group hover:shadow-lg transition">
                <CardHeader>
                  <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center group-hover:scale-105 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="mt-2 text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
                  <Button asChild variant="link" className="px-0 mt-2 text-blue-600">
                    <Link href={href}>Pelajari Lebih Lanjut →</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold">Cara Kerja</h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {["Upload Nota", "Proses OCR & AI", "Dapatkan Insight"].map((t, i) => (
                <div key={t} className="relative rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow">{i+1}</div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {i === 0 && "Ambil foto atau drag & drop file nota Anda."}
                    {i === 1 && "Sistem mengekstrak data dan menganalisis secara otomatis."}
                    {i === 2 && "Lihat ringkasan, grafik, dan tanya AI untuk detail."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold">Paket Harga</h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Basic", price: "Rp 99K/bulan", features: ["Upload nota", "Analitik dasar"], popular: false },
                { name: "Starter", price: "Rp 199K/bulan", features: ["Semua fitur Basic", "Chat AI"], popular: true },
                { name: "Pro", price: "Rp 399K/bulan", features: ["Semua fitur Starter", "Insight lanjutan"], popular: false },
              ].map((t) => (
                <Card key={t.name} className={`relative rounded-2xl transition ${t.popular ? "border-blue-600 shadow-lg scale-[1.01]" : ""}`}>
                  {t.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white shadow">PALING POPULER</Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-extrabold mt-2">{t.price}</p>
                    <ul className="mt-4 text-sm space-y-2">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-blue-600"/> {f}</li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <Button asChild className={`${t.popular ? "bg-blue-600 text-white hover:shadow" : ""}`} variant={t.popular ? "default" : "outline"}>
                        <Link href="/register">Mulai</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-16">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-900" />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">Mulai kelola pengeluaran Anda dengan lebih cerdas</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Daftar untuk mendapatkan akses uji coba gratis 14 hari. Tidak perlu kartu kredit.</p>
            <form className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Input type="email" required placeholder="Email bisnis Anda" className="w-full sm:w-96" />
              <Button type="submit" className="px-6">Daftar Sekarang</Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
