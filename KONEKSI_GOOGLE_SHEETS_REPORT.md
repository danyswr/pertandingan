# Laporan Koneksi Google Sheets - Tournament Management System

## Status Koneksi Saat Ini

### 1. File `server/routes.ts`
**Status: ✅ TERHUBUNG**
- Menggunakan `callGoogleSheetsAPI()` untuk semua operasi
- URL Google Sheets: `https://script.google.com/macros/s/AKfycbypGY-NglCjtwpSrH-cH4d4ajH2BHLd1cMPgaxTX_w0zGzP_Q5_y4gHXTJoRQrOFMWZ/exec`
- Cache sistem: 30 detik untuk data umum, 5 detik untuk data atlet
- Error handling: Fallback ke local storage jika Google Sheets gagal

**Fungsi yang Terhubung:**
- `getAthletes` - Mengambil data atlet dari sheet 'atlets'
- `getMainCategories` - Mengambil kategori utama dari sheet 'Kategori_utama'
- `getSubCategories` - Mengambil sub kategori dari sheet 'SubKategori'
- `updateAttendance` - Update kehadiran atlet
- `createMainCategory` - Membuat kategori utama baru
- `updateMainCategory` - Update kategori utama
- `deleteMainCategory` - Hapus kategori utama

### 2. File `server/storage.ts`
**Status: ✅ TERHUBUNG**
- Menggunakan `syncMainCategoriesFromGoogleSheets()` untuk sync data
- Fallback ke data default jika Google Sheets kosong
- Cache management dengan Map storage

**Fungsi yang Terhubung:**
- `getAllMainCategories()` - Sync dari Google Sheets dulu, lalu return data
- `syncMainCategoriesFromGoogleSheets()` - Sync kategori utama
- `syncSubCategoriesFromGoogleSheets()` - Sync sub kategori
- `syncAthleteGroupsFromGoogleSheets()` - Sync kelompok atlet
- `syncGroupAthletesToGoogleSheets()` - Sync daftar kelompok

### 3. File `client/src/lib/api.ts`
**Status: ✅ TERHUBUNG**
- Menggunakan `apiRequest()` untuk semua HTTP calls
- Timeout: 15 detik untuk semua request
- Error handling dengan retry logic

**Fungsi yang Terhubung:**
- `getAthletes()` - GET /api/athletes
- `getMainCategories()` - GET /api/tournament/main-categories
- `getSubCategories()` - GET /api/tournament/main-categories/{id}/sub-categories
- `createMainCategory()` - POST /api/tournament/main-categories
- `updateMainCategory()` - PUT /api/tournament/main-categories/{id}
- `deleteMainCategory()` - DELETE /api/tournament/main-categories/{id}

### 4. File `google-apps-script-complete-tournament.js`
**Status: ✅ TERHUBUNG**
- Script Google Apps yang sudah di-deploy
- Menangani semua operasi CRUD
- Auto-create sheets jika tidak ada

**Sheets yang Dikelola:**
- `atlets` - Data atlet utama
- `Kategori_utama` - Kategori utama tournament
- `SubKategori` - Sub kategori tournament
- `Kelompok_Atlet` - Kelompok atlet
- `daftar_kelompok` - Daftar atlet per kelompok

## Alur Data (Data Flow)

```
[Frontend] → [api.ts] → [routes.ts] → [Google Sheets Script] → [Google Sheets]
     ↓           ↓          ↓              ↓                    ↓
[React UI] ← [apiRequest] ← [storage.ts] ← [JSON Response] ← [Spreadsheet]
```

## Konfigurasi URL Google Sheets

```javascript
const GOOGLE_SHEETS_CONFIG = {
  ATHLETES_API: "https://script.google.com/macros/s/AKfycbxBdFaCAXRAVjZYoEnWlJ7He7yeXjZrTYY11YsCjOLTmB-Ewe58jEKh97iXRdthIGhiMA/exec",
  MANAGEMENT_API: "https://script.google.com/macros/s/AKfycbypGY-NglCjtwpSrH-cH4d4ajH2BHLd1cMPgaxTX_w0zGzP_Q5_y4gHXTJoRQrOFMWZ/exec"
};
```

## Error Handling & Fallback

### 1. Jika Google Sheets Tidak Responsif:
- Routes akan fallback ke local storage
- Storage akan return data default
- Cache akan digunakan jika masih valid

### 2. Jika Data Kosong di Google Sheets:
- Script akan auto-create sheets dengan header
- Akan menambahkan data default (kyorugi, poomsae)
- Storage akan create kategori default

### 3. Jika Ada Error di API:
- Client akan retry dengan exponential backoff
- Error akan di-log di console
- User akan mendapat notifikasi error

## Cache Strategy

### 1. Server-side Cache (routes.ts):
- Default TTL: 30 detik
- Fast TTL: 5 detik (untuk data atlet)
- Auto-clear cache saat ada update

### 2. Client-side Cache (React Query):
- Query cache: 5 menit
- Stale time: 30 detik
- Auto-refetch on window focus

### 3. Storage Cache (storage.ts):
- In-memory Map storage
- Clear cache saat sync dari Google Sheets
- Fallback ke data default

## Keamanan & Performance

### 1. Request Timeout:
- 15 detik untuk Google Sheets API
- 15 detik untuk client requests
- Auto-abort jika timeout

### 2. Rate Limiting:
- Cache untuk mengurangi API calls
- Batch operations untuk bulk updates
- Debounce untuk frequent updates

### 3. Data Validation:
- Zod schema validation di server
- Form validation di client
- Type safety dengan TypeScript

## Monitoring & Logging

### 1. Request Logging:
- Semua Google Sheets API calls di-log
- Response time monitoring
- Error rate tracking

### 2. WebSocket Status:
- Real-time connection monitoring
- Auto-reconnect jika disconnect
- Broadcast updates ke semua client

### 3. Cache Performance:
- Cache hit/miss ratio
- TTL effectiveness
- Memory usage monitoring

## Rekomendasi Perbaikan

### 1. Immediate:
- ✅ Sudah ada error handling yang baik
- ✅ Sudah ada fallback mechanism
- ✅ Sudah ada cache system

### 2. Future Enhancement:
- Implementasi offline mode
- Batch sync untuk bulk operations
- Real-time collaboration features
- Advanced caching strategies

## Testing & Verification

### 1. Connection Test:
```bash
curl "https://script.google.com/macros/s/AKfycbypGY-NglCjtwpSrH-cH4d4ajH2BHLd1cMPgaxTX_w0zGzP_Q5_y4gHXTJoRQrOFMWZ/exec?action=getMainCategories"
```

### 2. API Endpoint Test:
```bash
curl "http://localhost:5000/api/tournament/main-categories"
```

### 3. WebSocket Test:
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');
ws.onmessage = (event) => console.log('Received:', event.data);
```

## Kesimpulan

Semua file sudah terhubung dengan baik ke Google Sheets:
- **routes.ts**: Menggunakan callGoogleSheetsAPI() ✅
- **storage.ts**: Menggunakan sync functions ✅  
- **api.ts**: Menggunakan apiRequest() ✅
- **google-apps-script**: Deployed dan berfungsi ✅

Sistem sudah memiliki:
- Cache yang efisien
- Error handling yang robust
- Fallback mechanism
- Real-time updates via WebSocket
- Type safety dengan TypeScript