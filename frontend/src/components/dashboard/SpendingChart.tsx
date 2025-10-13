"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Point = { date: string; amount: number };
export default function SpendingChart({ data }: { data: Point[] }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-900 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
