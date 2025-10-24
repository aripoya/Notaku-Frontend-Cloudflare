'use client';

import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { getStats } from '@/lib/ocr-api';
import { Activity, Users, Zap } from 'lucide-react';

export default function StatsCard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Cluster Statistics
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            Active Workers
          </div>
          <span className="text-lg font-bold">{stats.workers}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Zap className="w-4 h-4" />
            Capacity
          </div>
          <span className="text-lg font-bold">
            ~{stats.capacity_per_second} r/s
          </span>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Queue</span>
            <span className="font-medium">{stats.queue.pending} pending</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
