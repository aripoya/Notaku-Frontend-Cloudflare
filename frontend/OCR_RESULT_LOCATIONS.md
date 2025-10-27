# 📍 Lokasi Hasil OCR dari Backend di Frontend

## ✅ 3 Lokasi Utama Tampilan OCR

---

## 🎯 **1. OCR Result Component (Upload Flow)**

### **File:**
`src/components/OCRResult.tsx`

### **Kapan Muncul:**
Setelah upload nota dan OCR selesai diproses (di halaman `/dashboard/upload`)

### **Yang Ditampilkan:**

#### **A. Informasi Utama (Besar & Menonjol):**
```typescript
// Lines 72-136
<Card className="p-6 border-2 border-blue-500">
  <h3>📋 Informasi Utama</h3>
  
  <div className="grid grid-cols-3">
    {/* TOKO */}
    <div>
      <Store /> Toko
      <div className="text-2xl font-bold">
        {extracted.merchant || "Tidak Terdeteksi"}
      </div>
    </div>
    
    {/* TANGGAL */}
    <div>
      <Calendar /> Tanggal
      <div className="text-2xl font-bold text-blue-600">
        {formatIndonesianDate(extracted.date)}
      </div>
    </div>
    
    {/* TOTAL */}
    <div>
      <DollarSign /> Total
      <div className="text-3xl font-black text-green-600">
        {formatCurrency(extracted.total_amount)}
      </div>
    </div>
  </div>
  
  {/* Status Badges */}
  <Badge>✓ Toko Terdeteksi</Badge>
  <Badge>✓ Tanggal Terdeteksi</Badge>
  <Badge>✓ Total Terdeteksi</Badge>
</Card>
```

#### **B. OCR Text (Full Text):**
```typescript
// Lines 184-192
<div>
  <label>Extracted Text</label>
  <div className="bg-gray-50 p-4 max-h-64 overflow-y-auto">
    <pre className="font-mono whitespace-pre-wrap">
      {result.ocr_text}  {/* ✅ TEKS LENGKAP OCR */}
    </pre>
  </div>
</div>
```

#### **C. OCR Confidence:**
```typescript
// Lines 163-176
<div>
  <span>Confidence Score</span>
  <Badge>{(ocr_confidence * 100).toFixed(1)}%</Badge>
  
  <div className="progress-bar">
    <div style={{ width: `${confidence}%` }} />
  </div>
</div>
```

#### **D. Warning Card (Jika Ada Data Missing):**
```typescript
// Lines 139-157
{hasMissingData && (
  <Card className="border-orange-400 bg-orange-50">
    <AlertTriangle />
    <h4>Beberapa Data Tidak Terdeteksi</h4>
    <div>
      {!extracted.merchant && "• Nama toko tidak ditemukan"}
      {!extracted.total_amount && "• Total pembelian tidak ditemukan"}
    </div>
    <p>
      Anda dapat melihat teks OCR di bawah untuk melengkapi data secara manual.
    </p>
  </Card>
)}
```

---

## 🎯 **2. Receipt Edit Form (Upload Flow)**

### **File:**
`src/components/ReceiptEditForm.tsx`

### **Kapan Muncul:**
Setelah OCR selesai, user bisa review & edit data (di halaman `/dashboard/upload`)

### **Yang Ditampilkan:**

#### **A. OCR Confidence Badge:**
```typescript
// Lines 504-517
<div className="flex items-center justify-between">
  <span>OCR Confidence</span>
  <Badge variant={confidence >= 0.8 ? "default" : "secondary"}>
    {(ocr_confidence * 100).toFixed(0)}%
  </Badge>
</div>

{/* Progress Bar */}
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="h-2 rounded-full bg-green-500"
    style={{ width: `${(ocr_confidence * 100)}%` }}
  />
</div>
```

#### **B. Show OCR Details (Collapsible):**
```typescript
// Lines 543-568
<Button onClick={() => setShowOcrInfo(!showOcrInfo)}>
  {showOcrInfo ? "Hide OCR Details" : "Show OCR Details"}
</Button>

{/* OCR Details - Hidden by Default */}
{showOcrInfo && (
  <div className="mt-4">
    <label className="text-xs font-medium">
      Raw OCR Text
    </label>
    <div className="p-3 bg-gray-50 rounded-md max-h-40 overflow-y-auto">
      {displayData?.ocr_text || "No OCR text available"}
      {/* ✅ TEKS LENGKAP OCR */}
    </div>
  </div>
)}
```

**Default State:** Collapsed (disembunyikan)  
**User Action:** Klik "Show OCR Details" untuk expand

---

## 🎯 **3. Receipt Detail Page (View Receipt)**

### **File:**
`src/app/(dashboard)/dashboard/receipts/detail/page.tsx`

### **Kapan Muncul:**
Saat user membuka detail receipt yang sudah tersimpan (di halaman `/dashboard/receipts/detail?id=xxx`)

### **Yang Ditampilkan:**

#### **A. OCR Text (Read-Only Textarea):**
```typescript
// Lines 535-543
{receipt.ocr_text && (
  <div>
    <Label>OCR Text</Label>
    <Textarea
      className="mt-1 font-mono text-xs"
      rows={6}
      value={receipt.ocr_text}  {/* ✅ TEKS LENGKAP OCR */}
      readOnly
    />
  </div>
)}
```

#### **B. OCR Confidence:**
```typescript
// Lines 544-550
{receipt.ocr_confidence && (
  <div className="flex items-center justify-between text-sm mt-2">
    <span className="text-muted-foreground">
      Confidence: {(receipt.ocr_confidence * 100).toFixed(1)}%
    </span>
  </div>
)}
```

**Note:** Hanya muncul jika `receipt.ocr_text` ada (tidak null)

---

## 📊 **Data Structure dari Backend**

### **OCR Response Schema:**

```typescript
interface OCRResult {
  receipt_id: string;
  job_id: string;
  
  // ✅ EXTRACTED DATA (Structured)
  extracted: {
    merchant: string;         // Nama toko
    date: string;            // Tanggal transaksi
    total_amount: number;    // Total pembelian
  };
  
  // ✅ RAW OCR TEXT (Full text)
  ocr_text: string;         // Teks lengkap hasil OCR
  
  // ✅ CONFIDENCE SCORE
  ocr_confidence: number;   // 0.00 - 1.00 (e.g., 0.97 = 97%)
  
  // Metadata
  processing_time_ms: number;
  created_at: string;
}
```

---

## 🎨 **Visual Layout**

### **1. OCRResult Component (Halaman Upload):**

```
┌─────────────────────────────────────────────────────┐
│ ✓ Nota Berhasil Diproses!          [97% Confidence]│
├─────────────────────────────────────────────────────┤
│                  📋 Informasi Utama                  │
│                                                      │
│  [🏪 Toko]        [📅 Tanggal]      [💰 Total]      │
│  Gramedia       30/09/2025        Rp 202.516       │
│  [2xl bold]    [2xl blue]       [3xl green]        │
│                                                      │
│  [✓ Toko Terdeteksi] [✓ Tanggal] [✓ Total]         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Confidence Score                           [97.0%] │
│ ████████████████████████████████████░░░░░░         │
│                                                      │
│ Processing Time                              234ms │
│                                                      │
│ Extracted Text                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ GRAMEDIA YOGYA SUDIRMAN                     │    │
│ │ Jl. Jendral Sudirman No.11                  │    │
│ │ Yogyakarta 55223                            │    │
│ │                                             │    │
│ │ Tanggal: 30/09/2025 15:22                   │    │
│ │ Kasir: KASIR 01                             │    │
│ │                                             │    │
│ │ ITEM                    QTY    HARGA        │    │
│ │ Buku Novel               2     50.000       │    │
│ │ Pensil 2B                5     7.500        │    │
│ │ ...                                         │    │
│ │                                             │    │
│ │ TOTAL:                         Rp 202.516   │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ [Copy Text]              [Download JSON]           │
│ [Upload Another Receipt]                           │
└─────────────────────────────────────────────────────┘
```

---

### **2. ReceiptEditForm (Halaman Upload - Review):**

```
┌──────────────────┬───────────────────────────────────┐
│ Receipt Image    │ Receipt Details                   │
│                  │                                   │
│ [📷 Thumbnail]   │ Merchant: [Gramedia Yogya...]     │
│                  │ Total: [Rp 202.516]               │
│ OCR Confidence   │ Date: [30/09/2025]                │
│ [97%]           │ Category: [Office Supplies]       │
│ ████████████░   │                                   │
│                  │ Notes: [Optional...]              │
│ [Show OCR Details]                                  │
│                  │ [Cancel] [Save Receipt]           │
│ ▼ (Expanded)     │                                   │
│                  │                                   │
│ Raw OCR Text:    │                                   │
│ ┌──────────────┐ │                                   │
│ │ GRAMEDIA ... │ │                                   │
│ │ Jl. Jendral..│ │                                   │
│ │ ...          │ │                                   │
│ └──────────────┘ │                                   │
└──────────────────┴───────────────────────────────────┘
```

---

### **3. Receipt Detail Page (View Saved Receipt):**

```
┌─────────────────────────────────────────────────────┐
│ Receipt Detail                           [Edit] [🗑️]│
├─────────────────────────────────────────────────────┤
│                                                      │
│ Merchant: Gramedia Yogya Sudirman                   │
│ Date: 30/09/2025                                    │
│ Total: Rp 202.516                                   │
│ Category: Office Supplies                           │
│ Notes: Pembelian buku untuk kantor                  │
│                                                      │
│ OCR Text:                                           │
│ ┌─────────────────────────────────────────────┐    │
│ │ GRAMEDIA YOGYA SUDIRMAN                     │    │
│ │ Jl. Jendral Sudirman No.11                  │    │
│ │ ...                                         │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ Confidence: 97.0%                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 **Console Logs untuk Debug**

### **Saat Upload & OCR:**

```javascript
// Upload page
[Upload] 📦 Image ready, size: 976 KB
[Upload] 📤 Sending to OCR API...

// OCR API response
[OCR] ✅ Response received
[OCR] Extracted data: {merchant: "Gramedia", total: 202516, ...}
[OCR] OCR text length: 1234 chars
[OCR] Confidence: 0.97

// Mapping to receipt
[MapResult] 🏪 Merchant: Gramedia Yogya Sudirman
[MapResult] 💰 Total: 202516
[MapResult] 📅 Date: 2025-09-30
[MapResult] 📝 OCR text: (full text...)
[MapResult] 📊 Confidence: 0.97
```

---

## 📋 **Summary: Di Mana OCR Ditampilkan**

| Lokasi | File | Komponen | Data Ditampilkan |
|--------|------|----------|------------------|
| **1. Upload - Result** | `OCRResult.tsx` | Full page | ✅ Extracted data (besar)<br>✅ OCR text (full)<br>✅ Confidence<br>✅ Warning |
| **2. Upload - Edit** | `ReceiptEditForm.tsx` | Left sidebar | ✅ OCR text (collapsible)<br>✅ Confidence badge |
| **3. Detail Page** | `detail/page.tsx` | Bottom section | ✅ OCR text (textarea)<br>✅ Confidence |

---

## 🎯 **Field Mapping dari Backend**

### **Backend Response → Frontend Display:**

```typescript
// Backend sends:
{
  "ocr_text": "GRAMEDIA YOGYA SUDIRMAN\nJl. Jendral...",
  "ocr_confidence": 0.97,
  "extracted": {
    "merchant": "Gramedia Yogya Sudirman",
    "date": "2025-09-30",
    "total_amount": 202516
  }
}

// Frontend displays:
OCRResult.tsx:
  - Merchant: "Gramedia Yogya Sudirman" (2xl bold)
  - Date: "30 September 2025" (formatted)
  - Total: "Rp 202.516" (formatted)
  - OCR Text: "GRAMEDIA YOGYA..." (full text in <pre>)
  - Confidence: "97%" (badge + progress bar)

ReceiptEditForm.tsx:
  - Confidence: "97%" (badge)
  - OCR Text: "GRAMEDIA YOGYA..." (in collapsible div)

detail/page.tsx:
  - OCR Text: "GRAMEDIA YOGYA..." (readonly textarea)
  - Confidence: "97.0%" (text display)
```

---

## ✅ **Checklist: OCR Data Flow**

- [x] Backend return `ocr_text` → Frontend display di 3 lokasi
- [x] Backend return `ocr_confidence` → Frontend show badge & progress bar
- [x] Backend return `extracted.merchant` → Frontend show besar & bold
- [x] Backend return `extracted.total_amount` → Frontend show hijau & besar
- [x] Backend return `extracted.date` → Frontend format Indonesian
- [x] Missing data → Frontend show warning card
- [x] Full OCR text → Frontend show in monospace font
- [x] Confidence score → Frontend show percentage & color-coded

---

## 🎨 **Color Coding**

### **Confidence Levels:**

```typescript
// OCRResult.tsx - Line 21-26
const getConfidenceColor = (confidence: number) => {
  if (conf >= 95) return 'confidence-excellent';  // Green
  if (conf >= 85) return 'confidence-good';       // Blue
  if (conf >= 75) return 'confidence-fair';       // Yellow
  return 'confidence-poor';                        // Red
}
```

### **Badge Colors:**

| Confidence | Color | Badge Class |
|------------|-------|-------------|
| ≥ 95% | Green | `bg-green-100 text-green-700` |
| 85-94% | Blue | `bg-blue-100 text-blue-700` |
| 75-84% | Yellow | `bg-yellow-100 text-yellow-700` |
| < 75% | Red | `bg-red-100 text-red-700` |

---

## 📝 **Notes Penting**

1. **OCR Text Format:**
   - Ditampilkan dalam `<pre>` tag dengan `whitespace-pre-wrap`
   - Font: `font-mono` untuk readability
   - Max height dengan scrollbar untuk teks panjang

2. **Extracted Data:**
   - Merchant: 2xl bold gray-900
   - Date: 2xl bold blue-600
   - Total: 3xl font-black green-600

3. **Confidence Display:**
   - Badge dengan percentage
   - Progress bar dengan gradient
   - Color-coded berdasarkan score

4. **Collapsible Sections:**
   - OCR text di ReceiptEditForm default hidden
   - User klik "Show OCR Details" untuk expand

---

**Last Updated:** October 27, 2025  
**Version:** 1.0.0
