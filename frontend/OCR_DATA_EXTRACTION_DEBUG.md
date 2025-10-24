# OCR Data Extraction Debugging Guide

## Issue: Extracted Data Not Showing

### Symptoms
- ✅ OCR completes successfully (96% confidence)
- ✅ OCR text is visible
- ❌ Merchant shows "Tidak Terdeteksi"
- ❌ Total shows "Rp 0"
- ✅ Date shows correctly (from current date fallback)

### Root Cause
Backend OCR is not returning extracted data in the expected format, or the field names don't match what frontend expects.

---

## Debugging Steps

### 1. Check Browser Console

After uploading, look for these logs:

```javascript
[OCR] Final result: {...}
[OCR] Extracted data: {...}
[OCR] Available keys: [...]
[OCR] Extracted keys: [...]
[OCR] Merchant: undefined undefined
[OCR] Date: undefined undefined
[OCR] Total: undefined undefined undefined
```

### 2. Inspect Response Structure

**Expected structure:**
```json
{
  "job_id": "...",
  "status": "finished",
  "receipt_id": "...",
  "ocr_text": "UNIQLO\nUniqlo Plaza Ambarrukmo\n...",
  "ocr_confidence": 0.96,
  "extracted": {
    "merchant": "UNIQLO",
    "date": "2025-10-02",
    "total_amount": 265290
  }
}
```

**If `extracted` is empty or missing:**
```json
{
  "job_id": "...",
  "status": "finished",
  "ocr_text": "...",
  "ocr_confidence": 0.96,
  "extracted": {}  ← EMPTY!
}
```

### 3. Check Field Name Variations

Frontend now tries multiple field name variations:

**Merchant:**
- `merchant`
- `merchant_name`
- `store`
- `store_name`

**Date:**
- `date`
- `transaction_date`
- `receipt_date`

**Total:**
- `total_amount`
- `total`
- `grand_total`
- `amount`

---

## Common Issues

### Issue 1: `extracted` is null or undefined

**Console shows:**
```
[OCR] Extracted data: undefined
```

**Cause:** Backend is not including `extracted` field in response

**Solution:** Backend needs to add extraction logic or return empty object:
```python
# Backend should return
{
    "extracted": {
        "merchant": "UNIQLO",
        "date": "2025-10-02",
        "total_amount": 265290
    }
}
```

### Issue 2: `extracted` is empty object

**Console shows:**
```
[OCR] Extracted data: {}
[OCR] Extracted keys: []
```

**Cause:** Backend extraction logic is not working or not implemented

**Solutions:**
1. Check backend extraction code
2. Verify regex patterns for parsing
3. Check if LLM/AI extraction is enabled
4. Test with different receipt formats

### Issue 3: Field names don't match

**Console shows:**
```
[OCR] Extracted keys: ["store_name", "receipt_date", "grand_total"]
[OCR] Merchant: undefined UNIQLO
[OCR] Date: undefined 2025-10-02
[OCR] Total: undefined undefined 265290
```

**Cause:** Backend uses different field names

**Solution:** Frontend now handles this! The code tries multiple variations:
```typescript
supplier: extractedData.merchant || extractedData.merchant_name || "N/A"
date: extractedData.date || extractedData.transaction_date || ...
total: extractedData.total_amount || extractedData.total || ...
```

### Issue 4: Data types don't match

**Console shows:**
```
[OCR] Total: "265290" undefined undefined  ← String instead of number!
```

**Cause:** Backend returns string instead of number

**Solution:** Add type conversion:
```typescript
total: Number(extractedData.total_amount) || 
       Number(extractedData.total) || 0
```

---

## Testing Checklist

After uploading a receipt, verify:

- [ ] Console shows `[OCR] Final result` with full object
- [ ] `extracted` field exists and is not null
- [ ] `extracted` has keys (not empty object)
- [ ] Field names match one of the expected variations
- [ ] Data types are correct (string for text, number for amounts)
- [ ] UI displays extracted data correctly

---

## Frontend Code Changes

### 1. Added Detailed Logging

**File:** `src/app/(dashboard)/dashboard/upload/page.tsx`

```typescript
console.log("[OCR] Final result:", ocrResult);
console.log("[OCR] Extracted data:", ocrResult.extracted);
console.log("[OCR] Available keys:", Object.keys(ocrResult));
console.log("[OCR] Extracted keys:", Object.keys(extractedData));
console.log("[OCR] Merchant:", extractedData.merchant, extractedData.merchant_name);
console.log("[OCR] Date:", extractedData.date, extractedData.transaction_date);
console.log("[OCR] Total:", extractedData.total_amount, extractedData.total);
```

### 2. Try Multiple Field Names

```typescript
const transformedResult = {
  supplier: extractedData.merchant || 
            extractedData.merchant_name || 
            "N/A",
            
  date: extractedData.date || 
        extractedData.transaction_date || 
        new Date().toISOString(),
        
  total: extractedData.total_amount || 
         extractedData.total || 
         extractedData.grand_total || 
         0,
};
```

### 3. Updated Type Definitions

**File:** `src/types/ocr.ts`

```typescript
export interface ExtractedData {
  // Multiple possible field names
  merchant?: string;
  merchant_name?: string;
  
  total_amount?: number;
  total?: number;
  grand_total?: number;
  
  date?: string;
  transaction_date?: string;
  
  // Allow any other fields
  [key: string]: any;
}
```

---

## Backend Requirements

For extraction to work, backend must:

### 1. Return `extracted` Field

```python
# In OCR result
return {
    "job_id": job_id,
    "status": "finished",
    "ocr_text": text,
    "ocr_confidence": confidence,
    "extracted": {  # ← MUST INCLUDE THIS
        "merchant": "UNIQLO",
        "date": "2025-10-02",
        "total_amount": 265290
    }
}
```

### 2. Implement Extraction Logic

Options:
- **Regex patterns** for common receipt formats
- **LLM/AI extraction** (GPT, Claude, etc.)
- **Template matching** for known stores
- **Rule-based parsing** for structured data

### 3. Handle Edge Cases

```python
# Return empty dict if extraction fails
"extracted": {
    "merchant": None,  # or ""
    "date": None,
    "total_amount": None
}
```

### 4. Use Consistent Field Names

Recommended field names:
```python
{
    "merchant": str,        # Store/merchant name
    "date": str,           # ISO format: "2025-10-02"
    "total_amount": float, # Total amount as number
    "tax": float,          # Optional
    "subtotal": float,     # Optional
    "items": list,         # Optional: line items
}
```

---

## Example API Response

### Good Response (With Extraction)
```json
{
  "job_id": "50dacc65-28f5-4755-a202-a01996c47b43",
  "status": "finished",
  "receipt_id": "rec_123",
  "ocr_text": "UNIQLO\nUniqlo Plaza Ambarrukmo\nJl.Laksda Adisucipto No.80Ambarrukmo,\nYogyakarta 55281\nTel:0274-8000033\n0032755191012000000051\n** Receipt **\n02/10/2025\n<1553>",
  "ocr_confidence": 0.96,
  "processing_time_ms": 1234,
  "extracted": {
    "merchant": "UNIQLO",
    "date": "2025-10-02",
    "total_amount": 265290,
    "tax": 0,
    "subtotal": 265290
  }
}
```

### Bad Response (No Extraction)
```json
{
  "job_id": "50dacc65-28f5-4755-a202-a01996c47b43",
  "status": "finished",
  "receipt_id": "rec_123",
  "ocr_text": "...",
  "ocr_confidence": 0.96,
  "extracted": {}  ← EMPTY!
}
```

---

## Next Steps

### For Frontend (Already Done):
1. ✅ Added detailed logging
2. ✅ Try multiple field name variations
3. ✅ Updated type definitions
4. ✅ Better error handling

### For Backend (Needs Implementation):
1. ⚠️ Implement extraction logic
2. ⚠️ Return `extracted` field in response
3. ⚠️ Use consistent field names
4. ⚠️ Handle edge cases gracefully

### For Testing:
1. Upload receipt
2. Open browser console (F12)
3. Look for `[OCR]` logs
4. Check if `extracted` has data
5. Report findings to backend team

---

## Quick Test

**Upload a receipt and check console:**

```javascript
// Should see:
[OCR] Final result: {extracted: {merchant: "UNIQLO", ...}}
[OCR] Extracted data: {merchant: "UNIQLO", date: "2025-10-02", total_amount: 265290}
[OCR] Extracted keys: ["merchant", "date", "total_amount"]
[OCR] Merchant: "UNIQLO" undefined
[OCR] Date: "2025-10-02" undefined
[OCR] Total: 265290 undefined undefined
```

**If you see all `undefined`:**
```javascript
[OCR] Extracted data: {}
[OCR] Extracted keys: []
[OCR] Merchant: undefined undefined
[OCR] Date: undefined undefined
[OCR] Total: undefined undefined undefined
```

→ **Backend is not extracting data!** Contact backend team.

---

## Summary

**Current Status:**
- ✅ Frontend ready to receive extracted data
- ✅ Handles multiple field name variations
- ✅ Detailed logging for debugging
- ⚠️ Backend needs to implement extraction

**Action Required:**
- Backend team: Implement extraction logic
- Frontend team: Check console logs after upload
- Report findings to coordinate fix

**Expected Timeline:**
- Frontend changes: ✅ Complete
- Backend changes: ⏳ Pending
- Testing: ⏳ After backend fix
