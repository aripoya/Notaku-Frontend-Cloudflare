# Indonesian Formatters Guide

## Overview
Utility functions untuk memformat data (tanggal, mata uang, angka) sesuai dengan standar Indonesia.

## Installation
Tidak perlu instalasi library tambahan. Semua fungsi menggunakan native JavaScript/TypeScript.

## Usage

### Import
```typescript
import {
  formatIndonesianDate,
  formatLongDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
} from '@/lib/formatters';
```

## Functions

### 1. formatIndonesianDate()
Format tanggal dari backend (YYYY-MM-DD) ke format Indonesia (DD/MM/YYYY)

**Signature:**
```typescript
formatIndonesianDate(dateString: string | null | undefined): string
```

**Examples:**
```typescript
formatIndonesianDate('2025-10-02')           // "02/10/2025"
formatIndonesianDate('2025-01-15')           // "15/01/2025"
formatIndonesianDate('2025-10-02T19:28:00')  // "02/10/2025" (handles ISO)
formatIndonesianDate(null)                   // "-"
formatIndonesianDate(undefined)              // "-"
```

**Use Cases:**
- Display tanggal transaksi
- Display tanggal nota/receipt
- Display tanggal di tabel/list

---

### 2. formatLongDate()
Format tanggal dengan nama bulan Indonesia

**Signature:**
```typescript
formatLongDate(dateString: string | null | undefined): string
```

**Examples:**
```typescript
formatLongDate('2025-10-02')  // "2 Oktober 2025"
formatLongDate('2025-01-15')  // "15 Januari 2025"
formatLongDate('2025-12-31')  // "31 Desember 2025"
formatLongDate(null)          // "-"
```

**Use Cases:**
- Secondary date display (lebih readable)
- Headers/titles
- Print/export documents

---

### 3. formatDateTime()
Gabungkan tanggal dan waktu

**Signature:**
```typescript
formatDateTime(
  dateString: string | null | undefined,
  timeString: string | null | undefined
): string
```

**Examples:**
```typescript
formatDateTime('2025-10-02', '19:28')  // "02/10/2025 19:28"
formatDateTime('2025-10-02', null)     // "02/10/2025"
formatDateTime(null, '19:28')          // "- 19:28"
```

**Use Cases:**
- Display timestamp lengkap
- Log entries
- Activity history

---

### 4. formatCurrency()
Format angka ke Rupiah Indonesia

**Signature:**
```typescript
formatCurrency(amount: number | null | undefined): string
```

**Examples:**
```typescript
formatCurrency(100000)    // "Rp 100.000"
formatCurrency(1000000)   // "Rp 1.000.000"
formatCurrency(265290)    // "Rp 265.290"
formatCurrency(1234.56)   // "Rp 1.235" (rounded)
formatCurrency(0)         // "Rp 0"
formatCurrency(null)      // "Rp 0"
```

**Use Cases:**
- Display harga/total
- Display subtotal/tax
- Financial summaries

---

### 5. formatNumber()
Format angka dengan separator Indonesia (titik)

**Signature:**
```typescript
formatNumber(value: number | null | undefined): string
```

**Examples:**
```typescript
formatNumber(1000)      // "1.000"
formatNumber(1000000)   // "1.000.000"
formatNumber(0)         // "0"
formatNumber(null)      // "0"
```

**Use Cases:**
- Display quantity
- Display counts
- Display statistics

---

### 6. formatPercentage()
Format desimal ke persentase

**Signature:**
```typescript
formatPercentage(value: number | null | undefined): string
```

**Examples:**
```typescript
formatPercentage(0.85)   // "85%"
formatPercentage(0.5)    // "50%"
formatPercentage(1)      // "100%"
formatPercentage(0.856)  // "86%" (rounded)
formatPercentage(null)   // "0%"
```

**Use Cases:**
- Confidence scores
- Progress indicators
- Statistics/analytics

---

### 7. formatRelativeTime()
Format tanggal ke relative time (e.g., "2 jam yang lalu")

**Signature:**
```typescript
formatRelativeTime(dateString: string | null | undefined): string
```

**Examples:**
```typescript
formatRelativeTime('2025-10-24T01:00:00')  // "Baru saja" (if < 1 min)
formatRelativeTime('2025-10-24T00:30:00')  // "30 menit yang lalu"
formatRelativeTime('2025-10-23T20:00:00')  // "5 jam yang lalu"
formatRelativeTime('2025-10-23T00:00:00')  // "1 hari yang lalu"
formatRelativeTime('2025-10-10T00:00:00')  // "10/10/2025" (if > 7 days)
```

**Use Cases:**
- Activity feeds
- Notifications
- Last updated timestamps

---

## Component Examples

### OCR Result Display
```typescript
import { formatIndonesianDate, formatLongDate, formatCurrency } from '@/lib/formatters';

function OCRResult({ result }) {
  return (
    <div>
      {/* Date Display */}
      <div>
        <p className="text-sm text-gray-500">Tanggal</p>
        <p className="font-semibold text-lg text-blue-600">
          {formatIndonesianDate(result.date)}
        </p>
        <p className="text-xs text-gray-500">
          {formatLongDate(result.date)}
        </p>
      </div>

      {/* Currency Display */}
      <div>
        <p className="text-sm text-gray-500">Total</p>
        <p className="text-3xl font-bold text-blue-600">
          {formatCurrency(result.total)}
        </p>
      </div>
    </div>
  );
}
```

### Copy to Clipboard
```typescript
import { formatIndonesianDate, formatCurrency } from '@/lib/formatters';

function copyToClipboard(result) {
  const text = `
Toko: ${result.merchant_name}
Tanggal: ${formatIndonesianDate(result.date)}
Waktu: ${result.time || '-'}
Total: ${formatCurrency(result.total)}
  `.trim();
  
  navigator.clipboard.writeText(text);
}
```

### Stats Card
```typescript
import { formatNumber, formatCurrency } from '@/lib/formatters';

function StatsCard({ stats }) {
  return (
    <div>
      <p>Total Transaksi: {formatNumber(stats.count)}</p>
      <p>Total Nilai: {formatCurrency(stats.total)}</p>
    </div>
  );
}
```

---

## Design Principles

### 1. User-First
- Format sesuai ekspektasi user Indonesia
- DD/MM/YYYY lebih familiar daripada YYYY-MM-DD
- Rupiah dengan separator titik (Rp 100.000)

### 2. Defensive Programming
- Handle null/undefined gracefully
- Return fallback values ("-", "Rp 0", "0%")
- Try-catch untuk error handling

### 3. Consistency
- Semua fungsi return string
- Semua fungsi accept null/undefined
- Naming convention yang jelas

### 4. Performance
- No external dependencies
- Simple string operations
- Native JavaScript functions

---

## Testing

Run tests:
```bash
npm run test src/lib/__tests__/formatters.test.ts
```

Test coverage:
- ✅ Valid inputs
- ✅ Null/undefined inputs
- ✅ Invalid formats
- ✅ Edge cases (zero, negative, decimal)
- ✅ ISO datetime strings

---

## Backend vs Frontend

### Backend (API)
- Stores dates as: `YYYY-MM-DD` (ISO 8601)
- Stores amounts as: `number` (265290)
- **Reason**: Standard format, sortable, database-friendly

### Frontend (Display)
- Shows dates as: `DD/MM/YYYY` (Indonesian)
- Shows amounts as: `Rp 265.290` (Indonesian)
- **Reason**: User-friendly, familiar format

**Important**: Never modify backend data format. Only convert for display.

---

## Common Patterns

### Date Display Hierarchy
```typescript
// Primary: Short format (easy to scan)
<p className="text-lg font-bold">{formatIndonesianDate(date)}</p>

// Secondary: Long format (additional context)
<p className="text-xs text-gray-500">{formatLongDate(date)}</p>

// Tertiary: Relative time (if applicable)
<p className="text-xs text-gray-400">{formatRelativeTime(date)}</p>
```

### Currency Display
```typescript
// Large amounts: Emphasize with size/color
<p className="text-3xl font-bold text-blue-600">
  {formatCurrency(total)}
</p>

// Small amounts: Regular size
<p className="text-sm">{formatCurrency(subtotal)}</p>

// Right-align for better scanning
<div className="text-right">{formatCurrency(amount)}</div>
```

---

## Troubleshooting

### Issue: Date shows as "-"
**Cause**: Backend returned null or invalid format
**Solution**: Check API response, ensure backend sends valid YYYY-MM-DD

### Issue: Currency shows "Rp NaN"
**Cause**: Amount is not a number
**Solution**: Ensure backend sends numeric values, not strings

### Issue: Wrong date format
**Cause**: Backend sends DD/MM/YYYY instead of YYYY-MM-DD
**Solution**: Standardize backend to ISO format (YYYY-MM-DD)

### Issue: Timezone issues
**Cause**: Date conversion uses local timezone
**Solution**: Backend should send dates without time (YYYY-MM-DD only)

---

## Future Enhancements

Potential additions:
- [ ] formatShortDate() - "02 Okt 2025"
- [ ] formatTime() - "19:28 WIB"
- [ ] formatDateRange() - "01/10/2025 - 31/10/2025"
- [ ] formatCompactCurrency() - "Rp 1,2 jt"
- [ ] parseIndonesianDate() - Convert DD/MM/YYYY back to YYYY-MM-DD

---

## Migration Guide

### Before
```typescript
// Old way
<p>{new Date(date).toLocaleDateString("id-ID")}</p>
<p>Rp {amount.toLocaleString("id-ID")}</p>
```

### After
```typescript
// New way
import { formatIndonesianDate, formatCurrency } from '@/lib/formatters';

<p>{formatIndonesianDate(date)}</p>
<p>{formatCurrency(amount)}</p>
```

**Benefits:**
- ✅ Consistent formatting across app
- ✅ Null-safe (no crashes)
- ✅ Easier to maintain
- ✅ Better TypeScript support

---

## Summary

✅ **Created**: `src/lib/formatters.ts` with 7 utility functions
✅ **Updated**: Upload page to use Indonesian formats
✅ **Tested**: Comprehensive test coverage
✅ **Documented**: Complete usage guide

**Result**: All dates now show as DD/MM/YYYY, all currency shows as Rp 100.000! 🎉
