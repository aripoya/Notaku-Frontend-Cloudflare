"use client";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#ca8a04", "#dc2626", "#0ea5e9", "#a855f7"];

type Item = { name: string; value: number };
export default function CategoryBreakdown({ data }: { data: Item[] }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-900 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
