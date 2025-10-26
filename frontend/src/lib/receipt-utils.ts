/**
 * Receipt utility functions
 * Formatting and calculation helpers for receipt display
 */

/**
 * Format currency to Indonesian Rupiah
 * @param amount - Amount in decimal string or number
 * @param currency - Currency code (default: IDR)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: string | number, currency: string = "IDR"): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return `${currency} 0,00`;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Format date to Indonesian readable format
 * @param dateString - ISO date string
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  options?: {
    includeYear?: boolean;
    shortMonth?: boolean;
  }
): string {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: options?.shortMonth ? "short" : "long",
  };

  if (options?.includeYear !== false) {
    formatOptions.year = "numeric";
  }

  return date.toLocaleDateString("id-ID", formatOptions);
}

/**
 * Get relative time (e.g., "2 hari lalu")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Hari ini";
  } else if (diffInDays === 1) {
    return "Kemarin";
  } else if (diffInDays < 7) {
    return `${diffInDays} hari lalu`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} minggu lalu`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} bulan lalu`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years} tahun lalu`;
  }
}

/**
 * Get category color classes
 * @param category - Category name
 * @returns Object with border and background color classes
 */
export function getCategoryColor(category: string): {
  border: string;
  bg: string;
  text: string;
} {
  const categoryLower = category.toLowerCase();

  const colorMap: Record<string, { border: string; bg: string; text: string }> = {
    "bahan baku": {
      border: "border-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    operasional: {
      border: "border-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    marketing: {
      border: "border-purple-500",
      bg: "bg-purple-50",
      text: "text-purple-700",
    },
    transportasi: {
      border: "border-orange-500",
      bg: "bg-orange-50",
      text: "text-orange-700",
    },
    "food & dining": {
      border: "border-rose-500",
      bg: "bg-rose-50",
      text: "text-rose-700",
    },
  };

  return (
    colorMap[categoryLower] || {
      border: "border-gray-400",
      bg: "bg-gray-50",
      text: "text-gray-700",
    }
  );
}

/**
 * Calculate receipt statistics
 * @param receipts - Array of receipts
 * @returns Statistics object
 */
export function calculateStats(
  receipts: Array<{ total_amount: string | number }>
): {
  totalReceipts: number;
  totalAmount: number;
  averageAmount: number;
} {
  const totalReceipts = receipts.length;

  const totalAmount = receipts.reduce((sum, receipt) => {
    const amount =
      typeof receipt.total_amount === "string"
        ? parseFloat(receipt.total_amount)
        : receipt.total_amount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const averageAmount = totalReceipts > 0 ? totalAmount / totalReceipts : 0;

  return {
    totalReceipts,
    totalAmount,
    averageAmount,
  };
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Get initials from merchant name
 * @param name - Merchant name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
