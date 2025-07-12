# INSTRUKSI UPDATE GOOGLE APPS SCRIPT

## MASALAH YANG DIPERBAIKI

Fitur edit dan delete sub kategori menampilkan toast "berhasil" tapi tidak mengupdate data di Google Sheets atau UI. Ini karena Google Apps Script tidak memiliki action `updateSubCategory` dan `deleteSubCategory`.

## SOLUSI

Ganti Google Apps Script Anda dengan kode yang sudah diperbaiki di file: `google-apps-script-tournament-fixed-crud.js`

## LANGKAH-LANGKAH UPDATE

1. **Buka Google Apps Script** di browser
   - Masuk ke https://script.google.com
   - Buka project Google Apps Script Anda

2. **Backup kode lama** (opsional)
   - Copy kode lama ke file backup

3. **Replace kode dengan yang baru**
   - Hapus semua kode di file Code.gs
   - Copy seluruh isi file `google-apps-script-tournament-fixed-crud.js`
   - Paste ke Code.gs

4. **Deploy ulang**
   - Klik "Deploy" → "New deployment"
   - Atau update deployment yang sudah ada
   - Pastikan permissions sudah diberikan

## FITUR BARU YANG DITAMBAHKAN

### Sub Kategori CRUD:
- ✅ `updateSubCategory` - Update nama dan nomor urut sub kategori
- ✅ `deleteSubCategory` - Hapus sub kategori dari Google Sheets

### Athlete Group CRUD:
- ✅ `updateAthleteGroup` - Update nama, deskripsi, dan nomor pertandingan
- ✅ `deleteAthleteGroup` - Hapus kelompok atlet dari Google Sheets

### Improved Error Handling:
- ✅ Pesan error yang lebih jelas
- ✅ Validasi data yang lebih baik
- ✅ Logging yang lebih detail

## TESTING

Setelah update Google Apps Script, test fitur berikut:

1. **Edit Sub Kategori**
   - Klik three-dot menu pada card sub kategori
   - Pilih "Edit Sub Kategori"
   - Ubah nama atau nomor urut
   - Klik "Perbarui Sub Kategori"
   - ✅ Data harus berubah di UI dan Google Sheets

2. **Delete Sub Kategori**
   - Klik three-dot menu pada card sub kategori
   - Pilih "Hapus Sub Kategori"
   - Konfirmasi penghapusan
   - ✅ Card harus hilang dari UI dan baris dihapus dari Google Sheets

3. **Edit Kelompok Atlet**
   - Klik three-dot menu pada card kelompok atlet
   - Pilih "Edit Kelompok"
   - Ubah nama, deskripsi, atau nomor pertandingan
   - ✅ Data harus terupdate

4. **Delete Kelompok Atlet**
   - Klik three-dot menu pada card kelompok atlet
   - Pilih "Hapus Kelompok"
   - ✅ Kelompok harus terhapus

## TROUBLESHOOTING

Jika masih ada masalah:

1. **Cek URL Google Apps Script**
   - Pastikan URL di server/routes.ts masih benar
   - URL ada di `GOOGLE_SHEETS_CONFIG.MANAGEMENT_API`

2. **Cek Permissions**
   - Google Apps Script harus memiliki akses ke Google Sheets
   - Test dengan menjalankan function `initializeSheets()` secara manual

3. **Cek Logs**
   - Buka Google Apps Script → Executions
   - Lihat error logs jika ada

4. **Test Manual**
   - Test action di Google Apps Script console
   - Pastikan parameter diterima dengan benar

## STRUKTUR SHEETS YANG DIPERLUKAN

Pastikan Google Sheets memiliki sheet berikut:

1. **Kategori_Utama**
   - Kolom: id_kategori, nama_kategori

2. **SubKategori**
   - Kolom: id_subkategori, id_kategori_utama, Nomor, judul_subkategori

3. **Kelompok_Atlet**
   - Kolom: id_kel, id_SubKelompok, Judul, Nomor, Keterangan

4. **daftar_kelompok**
   - Kolom: id_daftarKelompok, id_kelompokAtlet, nama_atlet, Berat_badan, Tinggi_badan, sabuk, umur, MB, Nomor

5. **atlets**
   - Kolom: ID Atlet, Nama Lengkap, Gender, Tanggal Lahir, Dojang, Sabuk, Berat Badan, Tinggi Badan, Kategori, Kelas, Hadir, Status, Waktu Input

Jika sheet belum ada, function `initializeSheets()` akan membuatnya otomatis.