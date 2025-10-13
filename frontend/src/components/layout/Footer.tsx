export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-slate-600 dark:text-slate-400 flex items-center justify-between">
        <p>© {new Date().getFullYear()} NotaKu</p>
        <div className="space-x-4">
          <a href="/privacy">Privasi</a>
          <a href="/terms">Syarat</a>
        </div>
      </div>
    </footer>
  );
}
