// Google Apps Script Sederhana untuk Spreadsheet Manajemen
// Salin kode ini ke Google Apps Script di spreadsheet manajemen Anda

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

// Fungsi untuk menginisialisasi sheet jika diperlukan
function initializeSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('atlets');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('atlets');
    sheet.getRange(1, 1, 1, 13).setValues([[
      'ID Atlet', 'Nama Lengkap', 'Gender', 'Tanggal Lahir', 'Dojang', 
      'Sabuk', 'Berat Badan', 'Tinggi Badan', 'Kategori', 'Kelas', 
      'Hadir', 'Status', 'Waktu Input'
    ]]);
  }
  
  return sheet;
}