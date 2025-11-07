# Receipt Save - Full Data Fix

## Problem

When saving receipt after OCR processing, backend was returning mock data instead of the actual OCR results:

```json
{
  "id": "dd766076-aa37-44d7-85c8-58a0ae54f338",
  "merchant_name": "Supermarket XYZ",  // <- Mock data
  "total_amount": "250000.00",          // <- Mock data
  "image_path": null,                   // <- Missing image
  "ocr_data": null,                     // <- Missing OCR data
  "items": []                           // <- Missing items
}
```

## Root Cause

Frontend was only sending minimal data to backend:
```javascript
// OLD - Missing important data
const apiData = {
  merchant_name: merchantName,
  total_amount: totalAmount,
  currency: "IDR",
  transaction_date: transactionDate,
  category: receipt.category || null,
  notes: receipt.notes || null,
  // ❌ Missing: OCR data, image, items
};
```

Backend needs complete data including:
- OCR extracted text and confidence
- Original image (base64 or path)
- Line items from receipt
- Receipt ID from OCR service

## Solution

Updated `handleSaveReceipt` to send complete receipt data:

```javascript
// NEW - Include all data
const apiData = {
  merchant_name: merchantName,
  total_amount: totalAmount,
  currency: receipt.currency || "IDR",
  transaction_date: transactionDate,
  category: receipt.category || null,
  notes: receipt.notes || null,
  // ✅ Include OCR data
  ocr_text: receipt.ocr_text || null,
  ocr_confidence: receipt.ocr_confidence || null,
  // ✅ Include image (base64 or path)
  image_base64: receipt.image_base64 || imageBase64 || null,
  image_path: receipt.image_path || null,
  // ✅ Include items array
  items: receipt.items || [],
  // ✅ Include receipt_id from OCR result
  receipt_id: editReceiptId || receipt.id || result?.receipt_id || null,
};
```

## Updated API Interface

Updated `ReceiptsAPI.createReceipt()` interface to accept full data:

```typescript
static async createReceipt(data: { 
  merchant_name: string; 
  total_amount: number; 
  currency?: string; 
  transaction_date: string; 
  category?: string; 
  notes?: string;
  // ✅ OCR data
  ocr_text?: string | null;
  ocr_confidence?: number | null;
  // ✅ Image data
  image_base64?: string | null;
  image_path?: string | null;
  // ✅ Items
  items?: any[];
  // ✅ Receipt ID from OCR
  receipt_id?: string | null;
}): Promise<Receipt>
```

## Backend Requirements

Backend `POST /api/v1/receipts` endpoint should:

1. **Accept optional fields**:
   - `ocr_text` (string, nullable)
   - `ocr_confidence` (float, nullable)
   - `image_base64` (string, nullable)
   - `image_path` (string, nullable)
   - `items` (array, nullable)
   - `receipt_id` (string, nullable)

2. **Store complete data**:
   - Save OCR text and confidence to `ocr_data` field
   - Store image (base64 or save to storage and get path)
   - Store items as JSON array or related table
   - Link to OCR receipt_id if provided

3. **Return saved data** (not mock):
   ```json
   {
     "id": "uuid-from-database",
     "merchant_name": "Actual merchant from OCR",
     "total_amount": 150000,
     "ocr_data": {
       "text": "Full OCR text...",
       "confidence": 0.95
     },
     "image_path": "/uploads/receipts/abc123.jpg",
     "items": [
       {"name": "Item 1", "price": 50000, "quantity": 1},
       {"name": "Item 2", "price": 100000, "quantity": 1}
     ]
   }
   ```

## Expected Flow

1. **User uploads receipt** → OCR processing
2. **OCR returns**:
   ```javascript
   {
     receipt_id: "receipt_1234567",
     results: {
       merchant: "Indomaret",
       total: 50000,
       items: [...],
       ocr_text: "Full extracted text",
       confidence: 0.92
     },
     image_base64: "data:image/jpeg;base64,/9j/4AAQ..."
   }
   ```

3. **User reviews/edits** in ReceiptEditForm
4. **User clicks save** → `handleSaveReceipt` called
5. **Frontend sends** complete data to backend
6. **Backend saves** and returns actual saved receipt
7. **Frontend shows** success and redirects

## Testing

### Test 1: Verify Full Data is Sent

1. Upload receipt and process with OCR
2. Open DevTools → Console
3. Click "Simpan Nota"
4. Look for log:
   ```
   [Save] 📦 Full receipt data: {
     "merchant": "Indomaret",
     "total_amount": 50000,
     "ocr_text": "INDOMARET...",
     "ocr_confidence": 0.92,
     "image_base64": "[10234 chars]",
     "items": [...]
   }
   ```

5. Check Network tab → POST request payload includes all fields

### Test 2: Verify Backend Saves Correctly

1. Save receipt
2. Go to /dashboard/receipts
3. Click on saved receipt
4. **Verify**:
   - Merchant name matches OCR result (not "Supermarket XYZ")
   - Total amount matches OCR result (not "250000.00")
   - Image is displayed
   - Items list shows actual items
   - OCR confidence is shown

### Test 3: Backend Response Check

Check backend response in Network tab:
```json
{
  "id": "real-uuid-from-db",
  "user_id": "user-uuid",
  "merchant_name": "Indomaret",      // ✅ Real data
  "total_amount": 50000,             // ✅ Real data
  "image_path": "/path/to/image",    // ✅ Real path
  "ocr_data": {                      // ✅ Real OCR data
    "text": "INDOMARET...",
    "confidence": 0.92
  },
  "items": [...]                     // ✅ Real items
}
```

## Backend Implementation Example

If backend is using FastAPI/Python:

```python
@router.post("/receipts")
async def create_receipt(
    merchant_name: str,
    total_amount: float,
    currency: str = "IDR",
    transaction_date: str,
    category: Optional[str] = None,
    notes: Optional[str] = None,
    # New fields
    ocr_text: Optional[str] = None,
    ocr_confidence: Optional[float] = None,
    image_base64: Optional[str] = None,
    image_path: Optional[str] = None,
    items: Optional[List[dict]] = None,
    receipt_id: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    # Save image if base64 provided
    if image_base64:
        image_path = save_base64_image(image_base64, receipt_id)
    
    # Create receipt in database
    receipt = Receipt(
        user_id=current_user.id,
        merchant_name=merchant_name,
        total_amount=total_amount,
        currency=currency,
        transaction_date=transaction_date,
        category=category,
        notes=notes,
        image_path=image_path,
        ocr_data={
            "text": ocr_text,
            "confidence": ocr_confidence
        } if ocr_text else None,
        receipt_id=receipt_id
    )
    
    db.add(receipt)
    db.commit()
    
    # Save items if provided
    if items:
        for item in items:
            receipt_item = ReceiptItem(
                receipt_id=receipt.id,
                name=item.get("name"),
                quantity=item.get("quantity", 1),
                price=item.get("price", 0)
            )
            db.add(receipt_item)
        db.commit()
    
    return receipt
```

## Troubleshooting

### Issue: Still getting mock data

**Possible causes:**
1. Backend not updated to accept new fields
2. Backend ignoring extra fields and returning default mock
3. Backend validation rejecting request

**Debug:**
- Check backend logs for errors
- Check if backend receives all fields
- Verify backend schema/models accept new fields
- Test with curl/Postman directly

### Issue: Image too large

**Solution:**
- Frontend already compresses images
- Backend should validate max size (5MB recommended)
- Consider storing in object storage (S3/Cloudflare R2)
- Store URL instead of base64

### Issue: Items not saving

**Check:**
- Backend accepts `items` as array
- Backend has proper schema for items
- Foreign key constraints are satisfied
- Items data format matches backend expectation

## Files Modified

- `frontend/src/app/(dashboard)/dashboard/upload/page.tsx`
  - Updated `handleSaveReceipt` to include full data
  
- `frontend/src/lib/receipts-api.ts`
  - Updated `createReceipt` interface to accept new fields

## Next Steps

1. **Deploy frontend** with this fix
2. **Update backend** to accept and store new fields
3. **Test end-to-end** flow
4. **Verify** no more mock data
5. **Monitor** for errors in production

## Verification Checklist

After deployment:
- [ ] Upload receipt with OCR
- [ ] Edit if needed
- [ ] Click "Simpan Nota"
- [ ] Check console: Full data logged
- [ ] Check Network tab: Full data sent
- [ ] Backend responds with real data (not mock)
- [ ] Receipt appears in list with correct data
- [ ] Image is displayed
- [ ] Items are shown
- [ ] OCR confidence is visible
