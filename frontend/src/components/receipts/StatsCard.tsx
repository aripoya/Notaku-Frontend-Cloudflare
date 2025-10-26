"use client";

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-blue-600",
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {value}
          </p>
        </div>
        <div className={`${iconColor} opacity-80`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
