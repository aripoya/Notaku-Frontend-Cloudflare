"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, Crown, Sparkles, Zap } from "lucide-react";
import { SubscriptionAPI } from "@/lib/subscription-api";
import type { TiersResponse } from "@/types/subscription";
import { formatPrice } from "@/types/subscription";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  reason?: string;
}

export function UpgradeModal({ isOpen, onClose, currentTier = "free", reason }: UpgradeModalProps) {
  const [tiers, setTiers] = useState<TiersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTiers();
    }
  }, [isOpen]);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const data = await SubscriptionAPI.getTiers();
      setTiers(data);
    } catch (error) {
      console.error("[UpgradeModal] Error fetching tiers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoosePlan = (tierName: string) => {
    setSelectedTier(tierName);
    // TODO: Integrate with payment gateway
    alert(`Payment integration coming soon!\nSelected plan: ${tierName.toUpperCase()}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Upgrade Your Plan
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the perfect plan for your needs
              </p>
              {reason && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {reason}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : tiers ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Premium Tier */}
              <div className="relative">
                {/* Recommended Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    RECOMMENDED
                  </Badge>
                </div>

                <div className="h-full p-6 border-2 border-blue-500 rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {tiers.tiers.premium.name}
                    </h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(tiers.tiers.premium.price)}
                      </span>
                      <span className="text-muted-foreground">/bulan</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        <strong>{tiers.tiers.premium.monthly_limit}</strong> receipts per month
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        <strong>{tiers.tiers.premium.ai_queries}</strong> AI queries
                      </span>
                    </li>
                    {tiers.tiers.premium.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleChoosePlan("premium")}
                    disabled={currentTier === "premium"}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {currentTier === "premium" ? "Current Plan" : "Choose Premium"}
                  </Button>
                </div>
              </div>

              {/* Business Tier */}
              <div className="h-full p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {tiers.tiers.business.name}
                  </h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                      {formatPrice(tiers.tiers.business.price)}
                    </span>
                    <span className="text-muted-foreground">/bulan</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>{tiers.tiers.business.monthly_limit}</strong> receipts per month
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>{tiers.tiers.business.ai_queries}</strong> AI queries
                    </span>
                  </li>
                  {tiers.tiers.business.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleChoosePlan("business")}
                  disabled={currentTier === "business"}
                  variant="outline"
                  className="w-full"
                >
                  {currentTier === "business" ? "Current Plan" : "Choose Business"}
                </Button>
              </div>

              {/* Enterprise Tier */}
              <div className="h-full p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-6 w-6 text-amber-600" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {tiers.tiers.enterprise.name}
                  </h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                      {formatPrice(tiers.tiers.enterprise.price)}
                    </span>
                    <span className="text-muted-foreground">/bulan</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>Unlimited</strong> receipts
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>Unlimited</strong> AI queries
                    </span>
                  </li>
                  {tiers.tiers.enterprise.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleChoosePlan("enterprise")}
                  disabled={currentTier === "enterprise"}
                  variant="outline"
                  className="w-full"
                >
                  {currentTier === "enterprise" ? "Current Plan" : "Choose Enterprise"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Failed to load plans. Please try again.</p>
              <Button onClick={fetchTiers} className="mt-4">
                Retry
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-center text-sm text-muted-foreground">
            All plans include 24/7 support and regular updates. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
