# Form Auto-Populate Testing Guide

## 🎯 Tujuan
Mencari tahu kenapa form fields tidak auto-populate setelah OCR selesai.

---

## 📋 Langkah Testing

### 1. Buka Browser Console
- Tekan **F12** atau **Cmd+Option+I** (Mac)
- Pilih tab **Console**
- Clear console (klik icon 🚫 atau ketik `clear()`)

### 2. Upload Receipt
- Klik "Upload File" atau "Ambil Foto"
- Pilih gambar receipt
- Klik "Proses Nota"
- Tunggu OCR selesai

### 3. Cek Console Logs

Anda harus melihat logs dalam urutan ini:

#### A. Upload & OCR Logs
```
[Upload] 🚀 Starting upload process
[Upload] ✅ Upload response received
[Poll] 🔄 Starting to poll job status
[Poll] ✅ Job finished! Fetching result...
[Poll] ✨ Result data received
```

#### B. Mapping Logs (PENTING!)
```
[MapResult] 🗺️ Mapping result to Receipt format
[MapResult] Input result: {job_id: "...", extracted: {...}}
[MapResult] Result type: object
[MapResult] Result keys: ["job_id", "extracted", "ocr_text", ...]
[MapResult] 📦 Extracted object: {merchant: "...", total_amount: ...}
[MapResult] Extracted keys: ["merchant", "total_amount", "date"]
[MapResult] 🔍 Trying merchant from: ["UNIQLO", null, null, ...]
[MapResult] 🔍 Trying amount from: [259000, null, null, ...]
[MapResult] 🔍 Trying date from: ["2025-10-25", null, ...]
[MapResult] ✅ Final values selected:
[MapResult]   - merchant: UNIQLO
[MapResult]   - total_amount: 259000
[MapResult]   - date: 2025-10-25
[MapResult] Full mapped object: {
  "id": "9bacfaca-...",
  "merchant": "UNIQLO",
  "total_amount": 259000,
  "date": "2025-10-25",
  ...
}
```

#### C. Form Component Logs (PENTING!)
```
[ReceiptEditForm] 🎬 Component mounted/re-rendered
[ReceiptEditForm] Props received:
[ReceiptEditForm]   - receiptId: 9bacfaca-...
[ReceiptEditForm]   - initialData: {merchant: "UNIQLO", ...}
[ReceiptEditForm] Initial form state:
[ReceiptEditForm]   - merchant: UNIQLO
[ReceiptEditForm]   - totalAmount: 259000
[ReceiptEditForm]   - date: 2025-10-25
[ReceiptEditForm] 🔄 useEffect triggered - initialData dependency
[ReceiptEditForm] initialData value: {merchant: "UNIQLO", ...}
[ReceiptEditForm] initialData type: object
[ReceiptEditForm] initialData is null? false
[ReceiptEditForm] initialData is undefined? false
[ReceiptEditForm] ✅ initialData exists, extracting fields...
[ReceiptEditForm] Full initialData object: {
  "merchant": "UNIQLO",
  "total_amount": 259000,
  "date": "2025-10-25",
  ...
}
[ReceiptEditForm] Extracted values:
[ReceiptEditForm]   - merchant: UNIQLO (type: string)
[ReceiptEditForm]   - totalAmount: 259000 (type: string)
[ReceiptEditForm]   - date: 2025-10-25 (type: string)
[ReceiptEditForm] 📝 Setting form state...
[ReceiptEditForm] ✅ Form state updated!
[ReceiptEditForm] 🔍 Verifying state after update:
[ReceiptEditForm]   - Current merchant state should be: UNIQLO
[ReceiptEditForm]   - Current amount state should be: 259000
```

---

## 🔍 Diagnosis

### Scenario 1: Logs Berhenti di MapResult
**Symptom:**
```
[MapResult] ✅ Final values selected:
[MapResult]   - merchant: null
[MapResult]   - total_amount: null
[MapResult]   - date: null
```

**Masalah:** OCR result tidak punya data yang diharapkan

**Solusi:**
1. Cek `[MapResult] Result keys:` - apa saja keys yang ada?
2. Cek `[MapResult] Extracted object:` - apakah ada data?
3. Kemungkinan format response OCR berbeda
4. Share full result object

### Scenario 2: initialData Null/Undefined
**Symptom:**
```
[ReceiptEditForm] initialData value: null
[ReceiptEditForm] initialData is null? true
[ReceiptEditForm] ⚠️ initialData is null/undefined, skipping population
```

**Masalah:** Data tidak di-pass ke component

**Solusi:**
1. Cek apakah `mapResultToReceipt()` dipanggil
2. Cek apakah `<ReceiptEditForm>` di-render dengan `initialData` prop
3. Cek upload page line 544-549

### Scenario 3: initialData Ada Tapi Fields Kosong
**Symptom:**
```
[ReceiptEditForm] initialData value: {merchant: null, total_amount: null, ...}
[ReceiptEditForm] Extracted values:
[ReceiptEditForm]   - merchant:  (type: string)
[ReceiptEditForm]   - totalAmount:  (type: string)
```

**Masalah:** Mapping berhasil tapi values null

**Solusi:**
1. Cek `[MapResult]` logs - apakah final values null?
2. Cek format OCR response
3. Mungkin field names berbeda

### Scenario 4: State Set Tapi Form Tetap Kosong
**Symptom:**
```
[ReceiptEditForm] ✅ Form state updated!
[ReceiptEditForm] 🔍 Verifying state after update:
[ReceiptEditForm]   - Current merchant state should be: UNIQLO
```
Tapi form tetap kosong di UI

**Masalah:** React state update issue atau input value binding

**Solusi:**
1. Cek apakah ada error React di console
2. Cek React DevTools - apakah state benar-benar update?
3. Kemungkinan input `value` prop tidak terhubung

---

## 📸 Screenshot Yang Dibutuhkan

Jika masih error, ambil screenshot:

1. **Console Logs** - Semua logs dari [MapResult] sampai [ReceiptEditForm]
2. **Network Tab** - Request ke `/api/v1/ocr/result/{job_id}`
3. **React DevTools** - State dari ReceiptEditForm component
4. **Form UI** - Screenshot form yang kosong

---

## 🎯 Yang Harus Dicek

### Checklist Console Logs
- [ ] `[MapResult] Result keys:` - ada keys apa saja?
- [ ] `[MapResult] Extracted object:` - ada data?
- [ ] `[MapResult] Final values selected:` - values tidak null?
- [ ] `[ReceiptEditForm] initialData value:` - bukan null?
- [ ] `[ReceiptEditForm] Extracted values:` - ada values?
- [ ] `[ReceiptEditForm] Form state updated!` - muncul?

### Checklist Visual
- [ ] Success card muncul dengan confidence 96%
- [ ] ReceiptEditForm component muncul
- [ ] Form fields kosong (masalah kita)
- [ ] Tidak ada error merah di console

---

## 🚀 Quick Fix Attempts

### Fix 1: Hard Refresh
```bash
# Clear cache dan reload
Cmd+Shift+R (Mac) atau Ctrl+Shift+R (Windows)
```

### Fix 2: Check .env.local
```bash
# Pastikan ada
NEXT_PUBLIC_API_URL=https://api.notaku.cloud

# Restart dev server
npm run dev
```

### Fix 3: Manual Test
Buka React DevTools:
1. Find `ReceiptEditForm` component
2. Check props → `initialData`
3. Check state → `merchant`, `totalAmount`, `date`
4. Manually set state (untuk test):
   ```javascript
   // Di console
   $r.setState({merchant: "TEST"})
   ```

---

## 📊 Expected vs Actual

### ✅ Expected (Seharusnya)
```
Form Fields:
- Merchant: "Gramedia Yogya Sudirman" ✅
- Total Amount: "Rp 0" (dari screenshot) ✅
- Date: "25/10/2025" ✅
```

### ❌ Actual (Sekarang)
```
Form Fields:
- Merchant: "" (kosong) ❌
- Total Amount: "Rp 0" (kosong) ❌
- Date: "" (kosong) ❌
```

---

## 🔧 Next Steps

1. **Upload receipt baru**
2. **Copy SEMUA console logs**
3. **Paste di sini atau share screenshot**
4. **Saya akan analisa dan fix**

---

## 💡 Kemungkinan Root Cause

Berdasarkan screenshot, kemungkinan:

1. **OCR result format berbeda** - Field names tidak match
2. **initialData tidak di-pass** - Component mount tanpa data
3. **useEffect tidak trigger** - Dependency array issue
4. **State update race condition** - State di-set tapi belum render

Dengan logs yang super detail sekarang, kita akan tahu persis mana yang jadi masalah!

---

**Commit:** `47c9868` - debug: Add ultra-detailed logging for form auto-population issue
