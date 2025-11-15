# 🔧 Troubleshooting OCR Integration

## Error: Upload Failed 500 - Integration API

### Penyebab
Environment variable `NEXT_PUBLIC_INTEGRATION_URL` tidak dikonfigurasi dengan benar.

### Solusi

**1. Pastikan `.env.local` memiliki konfigurasi berikut:**

```bash
# Integration Service (OCR + Vision + RAG Pipeline)
NEXT_PUBLIC_INTEGRATION_URL=https://upload.notaku.cloud

# RAG Service (Chat)
NEXT_PUBLIC_RAG_URL=https://api.notaku.cloud

# Compression Service (optional)
NEXT_PUBLIC_COMPRESSION_URL=https://compress.notaku.cloud

# Debug Mode
NEXT_PUBLIC_DEBUG=true
```

**2. Restart Next.js Development Server:**

```bash
# Stop server (CTRL+C)
# Then restart:
npm run dev
```

**3. Verifikasi di Browser Console:**

Buka halaman upload, tekan F12, dan ketik:

```javascript
console.log('Integration URL:', process.env.NEXT_PUBLIC_INTEGRATION_URL);
// Expected: https://upload.notaku.cloud
```

**4. Test Backend Health:**

```bash
# Test Integration Service
curl https://upload.notaku.cloud/health

# Expected response:
# {"integration_service":"healthy","ocr_service":"healthy","vision_service":"healthy","rag_service":"healthy"}
```

## Checklist Debugging

- [ ] Environment variable sudah ditambahkan ke `.env.local`
- [ ] Development server sudah direstart
- [ ] Browser console menampilkan URL yang benar
- [ ] Backend service merespon dengan status 200
- [ ] Cache browser sudah di-clear (CTRL+SHIFT+R)

## Error Lainnya

### CORS Error
**Gejala:** `Access-Control-Allow-Origin` error

**Solusi:** Backend harus mengizinkan origin dari `http://localhost:3000`

### Connection Refused
**Gejala:** `ERR_CONNECTION_REFUSED`

**Solusi:** 
1. Cek apakah Cloudflare Tunnel berjalan
2. Cek apakah backend service berjalan
3. Test dengan `curl https://upload.notaku.cloud/health`

### Timeout
**Gejala:** Upload memakan waktu > 60 detik

**Solusi:**
1. Compress gambar sebelum upload
2. Gunakan gambar dengan ukuran < 2MB
3. Cek koneksi internet

## Kontak Support

Jika masalah berlanjut, hubungi tim development dengan:
- Screenshot error dari browser console
- Output dari `curl https://upload.notaku.cloud/health`
- File `.env.local` (tanpa credential)
