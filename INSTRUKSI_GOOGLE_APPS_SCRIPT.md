# Instruksi Konfigurasi Google Apps Script untuk Transfer Data

## Status Masalah
✅ **Teridentifikasi**: Google Apps Script mengembalikan "Action tidak dikenal" yang berarti kode belum dikonfigurasi dengan benar untuk menerima data dari sistem.

## Masalah yang Terjadi
Data berhasil dikirim dari website tapi tidak tersimpan di Google Spreadsheet karena Google Apps Script belum dikonfigurasi dengan benar.

## Solusi Langkah Demi Langkah

### 1. Buka Google Spreadsheet Manajemen Anda
- Buka spreadsheet yang sudah Anda siapkan untuk manajemen atlet
- URL: https://script.google.com/macros/s/AKfycbypGY-NglCjtwpSrH-cH4d4ajH2BHLd1cMPgaxTX_w0zGzP_Q5_y4gHXTJoRQrOFMWZ/exec

### 2. Buka Google Apps Script
- Di spreadsheet, klik menu "Extensions" > "Apps Script"
- Atau buka https://script.google.com/

### 3. PENTING: Hapus Kode yang Ada dan Ganti dengan Kode Lengkap Ini

**CATATAN:** Kode ini sudah dibuat khusus untuk menangani data dari sistem. Pastikan menggunakan kode yang LENGKAP dari file `google-apps-script-management.js`

```javascript
function doPost(e) {
  try {
    const params = e.parameter;
    console.log('Received POST:', params);
    
    // Buat atau ambil sheet atlets
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName('atlets');
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet('atlets');
      // Tambahkan header
      sheet.getRange(1, 1, 1, 13).setValues([[
        'ID Atlet', 'Nama Lengkap', 'Gender', 'Tanggal Lahir', 'Dojang', 
        'Sabuk', 'Berat Badan', 'Tinggi Badan', 'Kategori', 'Kelas', 
        'Hadir', 'Status', 'Waktu Input'
      ]]);
    }
    
    if (params.action === 'addData' && params.rowData) {
      // Parse data dari parameter
      const rowData = JSON.parse(params.rowData);
      rowData.push(new Date().toLocaleString('id-ID')); // Tambahkan timestamp
      
      // Tambahkan data ke sheet
      sheet.appendRow(rowData);
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Data berhasil ditambahkan'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Action tidak dikenal'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const params = e.parameter;
    
    if (params.action === 'test') {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Google Apps Script bekerja dengan baik'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Google Apps Script aktif'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 4. Deploy Script sebagai Web App
1. Klik tombol "Deploy" > "New deployment"
2. Pilih type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone" (atau sesuai kebutuhan)
5. Klik "Deploy"
6. Copy URL yang diberikan dan pastikan sama dengan yang ada di sistem

### 5. Izinkan Akses
- Saat pertama kali deploy, Google akan meminta izin
- Klik "Review permissions" dan berikan izin yang diperlukan

### 6. Test Koneksi
- Setelah deploy, coba transfer data atlet dari website
- Periksa apakah data muncul di spreadsheet

## Alternatif Jika Masih Bermasalah

### Opsi 1: Gunakan Google Forms
1. Buat Google Form dengan field yang sesuai
2. Ambil URL form dan ubah konfigurasi di sistem
3. Data akan masuk ke spreadsheet yang terhubung dengan form

### Opsi 2: Manual Copy-Paste
1. Export data dari website dalam format CSV/Excel
2. Copy-paste ke spreadsheet manajemen

### Opsi 3: Google Sheets API
1. Setup Google Sheets API credentials
2. Gunakan API key untuk akses langsung ke spreadsheet

## Troubleshooting

### Jika Error "Script function not found"
- Pastikan nama fungsi doPost dan doGet ditulis dengan benar
- Save script sebelum deploy

### Jika Error "Permission denied"
- Pastikan akses script diset ke "Anyone"
- Coba deploy ulang dengan permission yang benar

### Jika Data Tidak Masuk
- Cek log di Apps Script untuk melihat error
- Pastikan format data yang dikirim sesuai dengan yang diharapkan

## Kontak Support
Jika masih ada masalah, silakan hubungi developer atau periksa log error di Google Apps Script console.