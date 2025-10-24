"use client";

import { Activity, Zap, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  workers?: number;
  requestsPerSecond?: number;
  activeJobs?: number;
}

export default function StatsCard({
  workers = 15,
  requestsPerSecond = 21,
  activeJobs = 0,
}: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Cluster Stats</h3>
        </div>

        <div className="space-y-3">
          {/* Workers */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Workers</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{workers}</span>
          </div>

          {/* Requests per Second */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Requests/s</span>
            </div>
            <span className="text-2xl font-bold text-green-600">~{requestsPerSecond}</span>
          </div>

          {/* Active Jobs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Jobs</span>
            </div>
            <span className="text-2xl font-bold text-orange-600">{activeJobs}</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">OCR Service Online</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
