import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold">Tentang Expense AI</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl">
          Expense AI membantu UMKM Indonesia mengelola pengeluaran dengan OCR, chat AI, dan analitik yang mudah dipahami.
        </p>
      </main>
      <Footer />
    </div>
  );
}
