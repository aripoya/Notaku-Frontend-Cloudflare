// Utility to clear localStorage when quota exceeded
// This helps fix QuotaExceededError caused by large base64 images

export function getLocalStorageSize(): { totalKB: number; items: Array<{key: string, sizeKB: number}> } {
  let totalBytes = 0;
  const items: Array<{key: string, sizeKB: number}> = [];
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key) || '';
      const bytes = new Blob([value]).size;
      totalBytes += bytes;
      items.push({
        key,
        sizeKB: Math.round(bytes / 1024 * 100) / 100
      });
    }
  }
  
  return {
    totalKB: Math.round(totalBytes / 1024 * 100) / 100,
    items: items.sort((a, b) => b.sizeKB - a.sizeKB)
  };
}

export function clearLargeStorageItems(minSizeKB: number = 1000): void {
  const { items } = getLocalStorageSize();
  
  console.log('[Storage] Checking for large items...');
  
  items.forEach(item => {
    if (item.sizeKB > minSizeKB) {
      console.log(`[Storage] Removing large item: ${item.key} (${item.sizeKB}KB)`);
      localStorage.removeItem(item.key);
    }
  });
}

export function clearReceiptsWithImages(): void {
  try {
    const receipts = JSON.parse(localStorage.getItem('notaku_receipts') || '[]');
    console.log(`[Storage] Found ${receipts.length} receipts in localStorage`);
    
    // Remove image_base64 from all receipts to save space
    const cleanedReceipts = receipts.map((r: any) => {
      const { image_base64, ...rest } = r;
      return rest;
    });
    
    localStorage.setItem('notaku_receipts', JSON.stringify(cleanedReceipts));
    console.log(`[Storage] Cleaned ${receipts.length} receipts (removed base64 images)`);
    
    const before = getLocalStorageSize();
    console.log(`[Storage] New size: ${before.totalKB}KB`);
  } catch (error) {
    console.error('[Storage] Error cleaning receipts:', error);
  }
}

export function clearAllReceipts(): void {
  localStorage.removeItem('notaku_receipts');
  console.log('[Storage] Cleared all receipts from localStorage');
}

export function showStorageInfo(): void {
  const { totalKB, items } = getLocalStorageSize();
  
  console.group('📊 LocalStorage Info');
  console.log(`Total size: ${totalKB}KB / ~5120KB (5MB limit)`);
  console.log(`Usage: ${((totalKB / 5120) * 100).toFixed(1)}%`);
  console.log('\nLargest items:');
  items.slice(0, 5).forEach(item => {
    console.log(`  ${item.key}: ${item.sizeKB}KB`);
  });
  console.groupEnd();
}

// Auto-fix function for QuotaExceededError
export function handleQuotaExceeded(): boolean {
  console.warn('[Storage] QuotaExceededError detected! Attempting to free space...');
  
  try {
    // Step 1: Remove images from receipts
    clearReceiptsWithImages();
    
    // Step 2: If still over quota, remove other large items
    const { totalKB } = getLocalStorageSize();
    if (totalKB > 4000) { // Still near limit
      clearLargeStorageItems(500);
    }
    
    // Step 3: Check if we freed enough space
    const finalSize = getLocalStorageSize();
    if (finalSize.totalKB < 4000) {
      console.log('[Storage] ✅ Successfully freed space:', {
        before: `${totalKB}KB`,
        after: `${finalSize.totalKB}KB`,
        freed: `${(totalKB - finalSize.totalKB).toFixed(0)}KB`
      });
      return true;
    }
    
    // Step 4: Last resort - clear all receipts
    console.warn('[Storage] ⚠️ Still over quota, clearing all receipts...');
    clearAllReceipts();
    return true;
    
  } catch (error) {
    console.error('[Storage] ❌ Failed to free space:', error);
    return false;
  }
}
