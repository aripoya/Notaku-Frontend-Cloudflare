import { useState } from "react";
import {
  FileText,
  Receipt,
  HardDrive,
  TrendingUp,
  Plus,
  Upload,
  MessageSquare,
  Calendar,
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useNotes, useReceipts, useApiHealth } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "./components/Spinner";

/**
 * Complete dashboard combining multiple features
 * Features: stats cards, recent activity, quick actions, API health
 */
export default function DashboardExample() {
  const { user } = useAuth();
  const { data: notesData, loading: notesLoading } = useNotes({ pageSize: 5 });
  const { data: receiptsData, loading: receiptsLoading } = useReceipts({
    pageSize: 5,
  });
  const { healthy, checking } = useApiHealth();

  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">(
    "30d"
  );

  // Calculate stats
  const totalNotes = notesData?.total || 0;
  const totalReceipts = receiptsData?.total || 0;
  const totalAmount =
    receiptsData?.items.reduce((sum, r) => sum + r.totalAmount, 0) || 0;

  const stats = [
    {
      label: "Total Notes",
      value: totalNotes,
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "blue",
    },
    {
      label: "Receipts",
      value: totalReceipts,
      change: "+8%",
      trend: "up",
      icon: Receipt,
      color: "green",
    },
    {
      label: "Total Spending",
      value: `Rp ${(totalAmount / 1000000).toFixed(1)}M`,
      change: "+15%",
      trend: "up",
      icon: DollarSign,
      color: "purple",
    },
    {
      label: "Storage Used",
      value: "2.4 GB",
      change: "of 10 GB",
      trend: "neutral",
      icon: HardDrive,
      color: "orange",
    },
  ];

  const quickActions = [
    {
      label: "Create Note",
      icon: Plus,
      color: "blue",
      action: () => console.log("Create note"),
    },
    {
      label: "Upload Receipt",
      icon: Upload,
      color: "green",
      action: () => console.log("Upload receipt"),
    },
    {
      label: "Chat with AI",
      icon: MessageSquare,
      color: "purple",
      action: () => console.log("Chat AI"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.username || "User"}!
              </h1>
              <p className="text-blue-100">
                Here's what's happening with your account today
              </p>
            </div>

            {/* API Health Indicator */}
            <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              {checking ? (
                <Spinner size="sm" />
              ) : healthy ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm font-medium">API Healthy</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-300" />
                  <span className="text-sm font-medium">API Down</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} />
          ))}
        </div>

        {/* Period Selector */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {(["7d", "30d", "90d"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {period === "7d" && "Last 7 days"}
                {period === "30d" && "Last 30 days"}
                {period === "90d" && "Last 90 days"}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className={`p-4 rounded-xl border-2 border-${action.color}-200 bg-${action.color}-50 hover:bg-${action.color}-100 transition-colors text-left group`}
              >
                <div
                  className={`w-12 h-12 bg-${action.color}-100 group-hover:bg-${action.color}-200 rounded-xl flex items-center justify-center mb-3 transition-colors`}
                >
                  <action.icon
                    className={`h-6 w-6 text-${action.color}-600`}
                  />
                </div>
                <h3 className="font-semibold text-slate-900">{action.label}</h3>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Notes
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {notesLoading ? (
                <div className="p-8 text-center">
                  <Spinner text="Loading notes..." />
                </div>
              ) : notesData && notesData.items.length > 0 ? (
                notesData.items.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <h3 className="font-medium text-slate-900 mb-1 line-clamp-1">
                      {note.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      {note.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{note.tags.length} tags</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-600">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p>No notes yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Receipts */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Receipts
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {receiptsLoading ? (
                <div className="p-8 text-center">
                  <Spinner text="Loading receipts..." />
                </div>
              ) : receiptsData && receiptsData.items.length > 0 ? (
                receiptsData.items.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-slate-900">
                        {receipt.merchantName}
                      </h3>
                      <span className="text-sm font-semibold text-green-600">
                        Rp {receipt.totalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(receipt.transactionDate).toLocaleDateString()}
                      </span>
                      {receipt.ocrData.confidence && (
                        <>
                          <span>•</span>
                          <span>
                            {(receipt.ocrData.confidence * 100).toFixed(0)}%
                            confidence
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-600">
                  <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p>No receipts yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Last synced: {new Date().toLocaleTimeString()} • API Status:{" "}
            {healthy ? (
              <span className="text-green-600 font-medium">Operational</span>
            ) : (
              <span className="text-red-600 font-medium">Down</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  stat,
}: {
  stat: {
    label: string;
    value: string | number;
    change: string;
    trend: "up" | "down" | "neutral";
    icon: any;
    color: string;
  };
}) {
  const Icon = stat.icon;

  const getTrendColor = () => {
    if (stat.trend === "neutral") return "text-slate-600";
    return stat.trend === "up" ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}
        >
          <Icon className={`h-6 w-6 text-${stat.color}-600`} />
        </div>
        {stat.trend !== "neutral" && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            <TrendingUp
              className={`h-4 w-4 ${
                stat.trend === "down" ? "rotate-180" : ""
              }`}
            />
            <span className="text-sm font-medium">{stat.change}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>

      {stat.trend === "neutral" && (
        <p className="text-xs text-slate-500 mt-2">{stat.change}</p>
      )}
    </div>
  );
}
