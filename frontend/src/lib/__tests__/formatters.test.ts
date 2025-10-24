import { describe, it, expect } from 'vitest';
import {
  formatIndonesianDate,
  formatLongDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
} from '../formatters';

describe('formatIndonesianDate', () => {
  it('should format YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatIndonesianDate('2025-10-02')).toBe('02/10/2025');
    expect(formatIndonesianDate('2025-01-15')).toBe('15/01/2025');
    expect(formatIndonesianDate('2024-12-31')).toBe('31/12/2024');
  });

  it('should handle ISO datetime strings', () => {
    expect(formatIndonesianDate('2025-10-02T19:28:00')).toBe('02/10/2025');
  });

  it('should return "-" for null/undefined', () => {
    expect(formatIndonesianDate(null)).toBe('-');
    expect(formatIndonesianDate(undefined)).toBe('-');
  });

  it('should return original string for invalid format', () => {
    expect(formatIndonesianDate('invalid')).toBe('invalid');
  });
});

describe('formatLongDate', () => {
  it('should format date with Indonesian month names', () => {
    expect(formatLongDate('2025-10-02')).toBe('2 Oktober 2025');
    expect(formatLongDate('2025-01-15')).toBe('15 Januari 2025');
    expect(formatLongDate('2025-12-31')).toBe('31 Desember 2025');
  });

  it('should return "-" for null/undefined', () => {
    expect(formatLongDate(null)).toBe('-');
    expect(formatLongDate(undefined)).toBe('-');
  });
});

describe('formatDateTime', () => {
  it('should combine date and time', () => {
    expect(formatDateTime('2025-10-02', '19:28')).toBe('02/10/2025 19:28');
  });

  it('should return only date if time is null', () => {
    expect(formatDateTime('2025-10-02', null)).toBe('02/10/2025');
  });

  it('should handle null date', () => {
    expect(formatDateTime(null, '19:28')).toBe('- 19:28');
  });
});

describe('formatCurrency', () => {
  it('should format numbers to Indonesian Rupiah', () => {
    expect(formatCurrency(100000)).toBe('Rp 100.000');
    expect(formatCurrency(1000000)).toBe('Rp 1.000.000');
    expect(formatCurrency(265290)).toBe('Rp 265.290');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('Rp 0');
  });

  it('should return "Rp 0" for null/undefined', () => {
    expect(formatCurrency(null)).toBe('Rp 0');
    expect(formatCurrency(undefined)).toBe('Rp 0');
  });

  it('should handle decimal numbers', () => {
    expect(formatCurrency(1234.56)).toBe('Rp 1.235'); // Rounded
  });
});

describe('formatNumber', () => {
  it('should format numbers with Indonesian separators', () => {
    expect(formatNumber(1000)).toBe('1.000');
    expect(formatNumber(1000000)).toBe('1.000.000');
  });

  it('should return "0" for null/undefined', () => {
    expect(formatNumber(null)).toBe('0');
    expect(formatNumber(undefined)).toBe('0');
  });
});

describe('formatPercentage', () => {
  it('should format decimal to percentage', () => {
    expect(formatPercentage(0.85)).toBe('85%');
    expect(formatPercentage(0.5)).toBe('50%');
    expect(formatPercentage(1)).toBe('100%');
  });

  it('should return "0%" for null/undefined', () => {
    expect(formatPercentage(null)).toBe('0%');
    expect(formatPercentage(undefined)).toBe('0%');
  });

  it('should round to nearest integer', () => {
    expect(formatPercentage(0.856)).toBe('86%');
    expect(formatPercentage(0.854)).toBe('85%');
  });
});

describe('formatRelativeTime', () => {
  it('should return "Baru saja" for recent times', () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
    expect(formatRelativeTime(recent.toISOString())).toBe('Baru saja');
  });

  it('should return "-" for null/undefined', () => {
    expect(formatRelativeTime(null)).toBe('-');
    expect(formatRelativeTime(undefined)).toBe('-');
  });
});
