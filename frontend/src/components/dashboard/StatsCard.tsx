type Props = { title: string; value: string; subtitle?: string };
export default function StatsCard({ title, value, subtitle }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-900">
      <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
      <h3 className="mt-2 text-2xl font-bold">{value}</h3>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );
}
