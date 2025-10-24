"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, Zap, AlertCircle, Check, X } from "lucide-react";
import { SubscriptionAPI } from "@/lib/subscription-api";
import type { QuotaInfo } from "@/types/subscription";
import {
  SubscriptionTier,
  getTierDisplayName,
  getTierColor,
  getUsagePercentage,
  getUsageColor,
  isUnlimited,
} from "@/types/subscription";

interface QuotaDisplayProps {
  userId: string;
  compact?: boolean;
  onUpgradeClick?: () => void;
}

export function QuotaDisplay({ userId, compact = false, onUpgradeClick }: QuotaDisplayProps) {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = async () => {
    try {
      setError(null);
      const data = await SubscriptionAPI.getQuota(userId);
      setQuota(data);
    } catch (err: any) {
      console.error("[QuotaDisplay] Error fetching quota:", err);
      setError(err.message || "Failed to load quota");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    
    fetchQuota();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQuota, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) {
    return (
      <Card className={compact ? "p-3" : "p-6"}>
        <CardContent className="p-0">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !quota) {
    return (
      <Card className={`${compact ? "p-3" : "p-6"} border-red-200 bg-red-50 dark:bg-red-950/20`}>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error || "Failed to load quota"}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = getUsagePercentage(quota.used, quota.monthly_limit);
  const progressColor = getUsageColor(usagePercentage);
  const isLimitReached = usagePercentage >= 100;
  const isWarning = usagePercentage >= 80 && usagePercentage < 100;
  const unlimited = isUnlimited(quota.monthly_limit);

  // Compact version for sidebar
  if (compact) {
    return (
      <Card className="p-3">
        <CardContent className="p-0 space-y-2">
          {/* Tier Badge */}
          <div className="flex items-center justify-between">
            <Badge className={`${getTierColor(quota.tier)} text-white`}>
              {getTierDisplayName(quota.tier)}
            </Badge>
            {quota.tier === SubscriptionTier.FREE && onUpgradeClick && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onUpgradeClick}
                className="h-6 px-2 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="text-xs text-muted-foreground">
            {unlimited ? (
              <span className="font-semibold text-green-600">Unlimited receipts</span>
            ) : (
              <span>
                <span className={`font-semibold ${isLimitReached ? "text-red-600" : isWarning ? "text-orange-600" : "text-green-600"}`}>
                  {quota.remaining}
                </span>{" "}
                receipts left
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full version for main pages
  return (
    <Card className={`${isLimitReached ? "border-red-300 bg-red-50 dark:bg-red-950/20" : isWarning ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" : ""}`}>
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Your Quota</h3>
              <p className="text-sm text-muted-foreground">Monthly usage tracking</p>
            </div>
          </div>
          <Badge className={`${getTierColor(quota.tier)} text-white`}>
            {getTierDisplayName(quota.tier)}
          </Badge>
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Receipts Used</span>
            <span className="font-semibold">
              {unlimited ? (
                <span className="text-green-600">Unlimited</span>
              ) : (
                <>
                  {quota.used} / {quota.monthly_limit}
                </>
              )}
            </span>
          </div>
          
          {!unlimited && (
            <>
              <Progress value={usagePercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isLimitReached ? "text-red-600" : isWarning ? "text-orange-600" : "text-green-600"}`}>
                  {quota.remaining} remaining
                </span>
                <span className="text-muted-foreground">{usagePercentage}% used</span>
              </div>
            </>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Google Vision */}
          <div className="flex items-center gap-2">
            {quota.can_use_google_vision ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm text-muted-foreground">Google Vision</span>
          </div>

          {/* AI Queries */}
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-muted-foreground">
              {isUnlimited(quota.ai_queries_limit) ? (
                "Unlimited AI"
              ) : (
                `${quota.ai_queries_limit - quota.ai_queries_used} AI queries`
              )}
            </span>
          </div>
        </div>

        {/* Warning/Error Messages */}
        {isLimitReached && (
          <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Monthly limit reached
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Upgrade your plan to continue processing receipts
              </p>
            </div>
          </div>
        )}

        {isWarning && !isLimitReached && (
          <div className="flex items-start gap-2 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Running low on quota
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                You've used {usagePercentage}% of your monthly limit
              </p>
            </div>
          </div>
        )}

        {/* Upgrade Button for FREE tier */}
        {quota.tier === SubscriptionTier.FREE && onUpgradeClick && (
          <Button
            onClick={onUpgradeClick}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
