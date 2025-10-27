# ⏰ Transaction Time Feature - Documentation

## ✅ IMPLEMENTED!

Fitur untuk menampilkan dan mengedit waktu transaksi (selain tanggal).

---

## 🎯 **Problem Solved**

**Before:** Backend OCR extract tanggal DAN waktu, tapi frontend hanya show tanggal.

**Example OCR Result:**
```
Waktu: 22 Sep 25 15:22
↓ Backend extracts as:
transaction_date: "2025-09-22T15:22:00"
```

**Before Fix:**
- ❌ Frontend hanya display: "22/09/2025"
- ❌ Waktu "15:22" hilang
- ❌ Tidak bisa edit waktu

**After Fix:**
- ✅ Frontend display: "22/09/2025" + "15:22"
- ✅ Waktu extracted dari ISO datetime
- ✅ Bisa edit waktu secara terpisah

---

## 📦 **What Was Implemented**

### **1. Receipt Detail Page**

**File:** `src/app/(dashboard)/dashboard/receipts/detail/page.tsx`

#### **Interface Update:**
```typescript
interface ReceiptData {
  id: string;
  merchant_name: string;
  transaction_date: string;
  transaction_time?: string | null; // ✅ NEW: HH:MM format
  total_amount: string | number;
  // ... other fields
}
```

#### **Parse Time on Fetch:**
```typescript
// When receiving data from backend
const data = await response.json();

// Parse datetime if transaction_date contains time
let date = data.transaction_date;
let time = data.transaction_time || null;

if (date && date.includes('T')) {
  const [datePart, timePart] = date.split('T');
  date = datePart;          // "2025-09-22"
  time = timePart.substring(0, 5); // "15:22"
}

setReceipt({
  ...data,
  transaction_date: date,
  transaction_time: time
});
```

#### **Combine on Save:**
```typescript
// When saving
let fullDateTime = receipt.transaction_date;
if (receipt.transaction_time) {
  fullDateTime = `${receipt.transaction_date}T${receipt.transaction_time}:00`;
  // Result: "2025-09-22T15:22:00"
}

// Send both formats to backend
body: JSON.stringify({
  transaction_date: fullDateTime,    // ISO format
  transaction_time: receipt.transaction_time, // HH:MM
  // ... other fields
})
```

#### **UI Form:**
```tsx
{/* Date & Time - Grid Layout */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Date Field */}
  <div>
    <Label>Tanggal Transaksi *</Label>
    <Input
      type="date"
      value={receipt.transaction_date}
      onChange={(e) => setReceipt({ ...receipt, transaction_date: e.target.value })}
      disabled={!isEditing}
    />
  </div>
  
  {/* Time Field */}
  <div>
    <Label>Waktu Transaksi (opsional)</Label>
    <Input
      type="time"
      value={receipt.transaction_time || ''}
      onChange={(e) => setReceipt({ ...receipt, transaction_time: e.target.value })}
      placeholder="HH:MM"
      disabled={!isEditing}
    />
    {receipt.transaction_time && (
      <p className="text-xs text-muted-foreground mt-1">
        ⏰ {receipt.transaction_time}
      </p>
    )}
  </div>
</div>
```

---

### **2. Upload Page (OCR Result Processing)**

**File:** `src/app/(dashboard)/dashboard/upload/page.tsx`

#### **Parse Time from OCR Result:**
```typescript
// After OCR processing
const mapResultToReceipt = (result: any, notes: string) => {
  // ... get date from OCR
  
  // ✅ Parse time from ISO datetime
  let parsedDate = useDate;
  let parsedTime = null;
  
  if (useDate && useDate.includes('T')) {
    const [datePart, timePart] = useDate.split('T');
    parsedDate = datePart;
    parsedTime = timePart.substring(0, 5); // "15:22"
  }
  
  // ✅ Also check for separate time field
  const timeOptions = [
    extracted.time,
    extracted.transaction_time,
    result.time,
    result.transaction_time,
  ];
  const backendTime = timeOptions.find(v => v != null) || null;
  if (backendTime) {
    parsedTime = backendTime;
  }
  
  return {
    // ... other fields
    date: parsedDate,              // "2025-09-22"
    transaction_time: parsedTime,  // "15:22"
  };
};
```

---

## 🎨 **UI Design**

### **Receipt Detail Form:**

```
┌─────────────────────────────────────────────────────┐
│ Tanggal Transaksi *       Waktu Transaksi (opsional)│
├────────────────────────┬──────────────────────────────┤
│ [2025-09-22]          │ [15:22]                     │
│ 📅 22 September 2025  │ ⏰ 15:22                     │
└────────────────────────┴──────────────────────────────┘
```

**Desktop (2 columns):**
- Left: Date picker (required)
- Right: Time picker (optional)

**Mobile (1 column):**
- Date picker (full width)
- Time picker (full width, below date)

---

## 📊 **Data Flow**

### **Backend → Frontend (Fetch):**

**Option 1: ISO DateTime**
```json
{
  "transaction_date": "2025-09-22T15:22:00"
}
```
→ Frontend parses to:
```typescript
{
  transaction_date: "2025-09-22",
  transaction_time: "15:22"
}
```

**Option 2: Separate Fields**
```json
{
  "transaction_date": "2025-09-22",
  "transaction_time": "15:22"
}
```
→ Frontend uses directly

---

### **Frontend → Backend (Save):**

**Frontend sends both formats:**
```json
{
  "transaction_date": "2025-09-22T15:22:00",  // ISO format (if time exists)
  "transaction_time": "15:22",                 // Separate field
  "merchant_name": "Uniqlo",
  "total_amount": 129000
}
```

**Backend can use either format:**
- Use `transaction_date` (ISO) for datetime storage
- Use `transaction_time` for separate time field
- Or combine both

---

## 🧪 **Testing Guide**

### **Test 1: Upload with Time**

1. **Upload nota** dengan waktu di OCR
   - Example: "Waktu: 22 Sep 25 15:22"
2. **Check console logs:**
   ```javascript
   [MapResult] ⏰ Parsed time from ISO datetime: 15:22
   ```
3. **Verify in edit form:**
   - Date field: `2025-09-22`
   - Time field: `15:22`

### **Test 2: Edit Time**

1. **Open receipt detail**
2. **Click "Edit"**
3. **Change time** in time picker
4. **Click "Simpan"**
5. **Check console:**
   ```javascript
   [ReceiptDetail] 📅 Sending datetime: 2025-09-22T16:30:00
   ```

### **Test 3: Time Optional**

1. **Create receipt without time**
2. **Time field should be empty** (not error)
3. **Save should work** (date only)

### **Test 4: Display Time**

1. **Receipt with time** should show:
   ```
   Tanggal: 22/09/2025
   Waktu: ⏰ 15:22
   ```
2. **Receipt without time** should show:
   ```
   Tanggal: 22/09/2025
   (no time displayed)
   ```

---

## 📱 **Responsive Design**

### **Desktop (≥768px):**
```css
grid-cols-2  /* 2 columns: date | time */
gap-4        /* spacing between columns */
```

### **Mobile (<768px):**
```css
grid-cols-1  /* 1 column: stacked */
```

---

## 🎯 **Features**

| Feature | Status |
|---------|--------|
| Parse time from ISO datetime | ✅ |
| Parse time from separate field | ✅ |
| Display time in detail page | ✅ |
| Edit time in form | ✅ |
| Time field is optional | ✅ |
| Combine date+time on save | ✅ |
| Send both formats to backend | ✅ |
| Responsive layout | ✅ |
| Clock emoji indicator | ✅ |
| Console logging for debug | ✅ |

---

## 🔧 **Backend Requirements**

### **Option 1: Receive ISO DateTime**

Backend can parse `transaction_date` as ISO datetime:

```python
from datetime import datetime

# Receive: "2025-09-22T15:22:00"
dt = datetime.fromisoformat(data.transaction_date)

# Extract parts
date = dt.date()  # 2025-09-22
time = dt.time()  # 15:22:00
```

### **Option 2: Receive Separate Fields**

Use both `transaction_date` and `transaction_time`:

```python
# Receive:
# transaction_date: "2025-09-22"
# transaction_time: "15:22"

# Store as separate fields OR combine
if transaction_time:
    full_datetime = f"{transaction_date}T{transaction_time}:00"
```

### **Option 3: Backend Provides Time**

Backend can return time in response:

```json
{
  "transaction_date": "2025-09-22",
  "transaction_time": "15:22"
}
```

Or combined:
```json
{
  "transaction_date": "2025-09-22T15:22:00"
}
```

Frontend handles both! ✅

---

## 📝 **Console Logs**

### **On Fetch:**
```javascript
[ReceiptDetail] ✅ Fetched receipt data: {...}
[ReceiptDetail] ⏰ Parsed time from ISO datetime: 15:22
```

### **On Save:**
```javascript
[ReceiptDetail] 📅 Sending datetime: 2025-09-22T15:22:00
```

### **On Upload (OCR):**
```javascript
[MapResult] ⏰ Parsed time from ISO datetime: 15:22
[MapResult] ⏰ Found separate time field: 15:22
```

---

## 🎨 **UI Components Used**

- `Input` with `type="time"` - Time picker
- `Input` with `type="date"` - Date picker
- `Label` - Field labels
- `Grid` - Responsive layout
- Clock emoji ⏰ - Visual indicator

---

## 📚 **Related Files**

1. **Receipt Detail:**
   - `src/app/(dashboard)/dashboard/receipts/detail/page.tsx`

2. **Upload Page:**
   - `src/app/(dashboard)/dashboard/upload/page.tsx`

3. **Types:**
   - `src/types/receipt.ts` (if you add types)

---

## ✅ **Success Criteria**

All met! ✅

- [x] Backend OCR extracts time → Frontend displays it
- [x] Time field is editable
- [x] Time field is optional (can be empty)
- [x] Format: HH:MM (24-hour)
- [x] Parse from ISO datetime
- [x] Parse from separate field
- [x] Combine date+time when saving
- [x] Responsive layout
- [x] Indonesian labels
- [x] Visual indicators

---

## 🚀 **How to Use**

### **For Users:**

1. **Upload nota** with time in OCR
2. **View detail** → See both date and time
3. **Edit** → Change time if needed
4. **Save** → Time persists

### **For Developers:**

1. **Backend sends:** ISO datetime OR separate fields
2. **Frontend parses:** Automatically handles both
3. **Frontend displays:** Date + Time (optional)
4. **Frontend sends:** Both ISO and separate on save

---

## 🐛 **Troubleshooting**

### **Issue: Time not showing**

**Cause:** Backend not sending time

**Debug:**
```javascript
// Check console:
[ReceiptDetail] ✅ Fetched receipt data: {transaction_date: "2025-09-22"}
// No "T" in date = no time
```

**Solution:** Backend should send ISO datetime with time

---

### **Issue: Time lost after save**

**Cause:** Backend not storing time

**Debug:**
```javascript
// Check what frontend sends:
[ReceiptDetail] 📅 Sending datetime: 2025-09-22T15:22:00

// But backend returns:
{transaction_date: "2025-09-22"}  // Time missing!
```

**Solution:** Backend should store and return time

---

### **Issue: Can't edit time**

**Cause:** Not in edit mode

**Solution:** Click "Edit" button first

---

## 📊 **Example Scenarios**

### **Scenario 1: Full DateTime from OCR**
```
OCR: "Waktu: 22 Sep 25 15:22"
↓
Backend: {transaction_date: "2025-09-22T15:22:00"}
↓
Frontend displays:
  Date: 22/09/2025
  Time: ⏰ 15:22
```

### **Scenario 2: Date Only**
```
OCR: "Tanggal: 22 Sep 25" (no time)
↓
Backend: {transaction_date: "2025-09-22"}
↓
Frontend displays:
  Date: 22/09/2025
  Time: (empty - optional)
```

### **Scenario 3: Manual Entry**
```
User creates receipt manually
↓
Fills date: 2025-09-22
Optionally fills time: 15:30
↓
Saves → Backend receives both
```

---

## 🎉 **Summary**

**Status:** ✅ **COMPLETE & WORKING**

**Files Modified:**
- ✅ `detail/page.tsx` - Add time field & parsing
- ✅ `upload/page.tsx` - Parse time from OCR

**Features Added:**
- ✅ Time input field (optional)
- ✅ Parse time from ISO datetime
- ✅ Display time with clock emoji
- ✅ Combine date+time on save
- ✅ Responsive 2-column layout

**Backend Compatible:**
- ✅ ISO datetime format
- ✅ Separate date+time fields
- ✅ Both formats supported

---

**Last Updated:** October 27, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
