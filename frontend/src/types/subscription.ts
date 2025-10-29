// Subscription Types

export enum SubscriptionTier {
  FREE = "free",
  PREMIUM = "premium",
  BUSINESS = "business",
  ENTERPRISE = "enterprise",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  TRIAL = "trial",
}

export interface TierFeature {
  name: string;
  price: number;
  monthly_limit: number;
  ai_premium: boolean;
  ai_queries: number;
  features: string[];
}

export interface TiersResponse {
  success: boolean;
  tiers: {
    free: TierFeature;
    premium: TierFeature;
    business: TierFeature;
    enterprise: TierFeature;
  };
}

export interface QuotaInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  monthly_limit: number;
  used: number;
  remaining: number;
  can_use_ai_premium: boolean;
  ai_queries_used: number;
  ai_queries_limit: number;
  total_cost: number;
  price: number;
}

export interface QuotaResponse {
  success: boolean;
  quota: QuotaInfo;
}

export interface PermissionResult {
  allowed: boolean;
  provider?: "paddle" | "google";
  reason?: string;
  message?: string;
  quota_info?: QuotaInfo;
}

export interface PermissionResponse {
  success: boolean;
  permission: PermissionResult;
}

export interface AIPermissionResult {
  allowed: boolean;
  remaining: number;
  quota_info?: QuotaInfo;
  message?: string;
}

export interface AIPermissionResponse {
  success: boolean;
  permission: AIPermissionResult;
}

export interface CheckPermissionRequest {
  user_id: string;
  provider: "paddle" | "google";
}

// Helper functions
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    [SubscriptionTier.FREE]: "Free",
    [SubscriptionTier.PREMIUM]: "Premium",
    [SubscriptionTier.BUSINESS]: "Business",
    [SubscriptionTier.ENTERPRISE]: "Enterprise",
  };
  return names[tier];
}

export function getTierColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    [SubscriptionTier.FREE]: "bg-gray-500",
    [SubscriptionTier.PREMIUM]: "bg-blue-600",
    [SubscriptionTier.BUSINESS]: "bg-purple-600",
    [SubscriptionTier.ENTERPRISE]: "bg-amber-600",
  };
  return colors[tier];
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function getUsagePercentage(used: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited
  if (limit === 0) return 100;
  return Math.min(Math.round((used / limit) * 100), 100);
}

export function getUsageColor(percentage: number): string {
  if (percentage >= 100) return "bg-red-500";
  if (percentage >= 80) return "bg-orange-500";
  return "bg-green-500";
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}
