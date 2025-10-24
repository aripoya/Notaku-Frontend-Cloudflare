/**
 * Utility functions for formatting dates, currency, and other data
 * for Indonesian locale display
 */

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format date from backend (YYYY-MM-DD) to Indonesian format (DD/MM/YYYY)
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date in DD/MM/YYYY format or '-' if null
 * @example formatIndonesianDate("2025-10-02") // "02/10/2025"
 */
export function formatIndonesianDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    // Handle ISO format (YYYY-MM-DD)
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    
    // If already in DD/MM/YYYY format, return as is
    if (dateString.includes('/')) {
      return dateString;
    }
    
    return dateString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Format date with Indonesian month names
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date like "2 Oktober 2025"
 * @example formatLongDate("2025-10-02") // "2 Oktober 2025"
 */
export function formatLongDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const day = date.getDate();
    const month = INDONESIAN_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting long date:', error);
    return dateString;
  }
}

/**
 * Format date and time together
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:MM format
 * @returns Combined format like "02/10/2025 19:28"
 * @example formatDateTime("2025-10-02", "19:28") // "02/10/2025 19:28"
 */
export function formatDateTime(
  dateString: string | null | undefined,
  timeString: string | null | undefined
): string {
  const formattedDate = formatIndonesianDate(dateString);
  
  if (!timeString) {
    return formattedDate;
  }
  
  return `${formattedDate} ${timeString}`;
}

/**
 * Format currency to Indonesian Rupiah format
 * @param amount - Number to format
 * @returns Formatted string like "Rp 100.000"
 * @example formatCurrency(100000) // "Rp 100.000"
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rp 0';
  
  try {
    // Use Indonesian locale for number formatting
    const formatted = amount.toLocaleString('id-ID');
    return `Rp ${formatted}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `Rp ${amount}`;
  }
}

/**
 * Format number with Indonesian thousand separator (dots)
 * @param value - Number to format
 * @returns Formatted string like "100.000"
 * @example formatNumber(100000) // "100.000"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  
  try {
    return value.toLocaleString('id-ID');
  } catch (error) {
    console.error('Error formatting number:', error);
    return String(value);
  }
}

/**
 * Format percentage
 * @param value - Number between 0 and 1
 * @returns Formatted string like "85%"
 * @example formatPercentage(0.85) // "85%"
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  
  try {
    const percentage = Math.round(value * 100);
    return `${percentage}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0%';
  }
}

/**
 * Format date to relative time (e.g., "2 jam yang lalu")
 * @param dateString - Date string
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    if (diffDay < 7) return `${diffDay} hari yang lalu`;
    
    return formatIndonesianDate(dateString);
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return dateString;
  }
}
