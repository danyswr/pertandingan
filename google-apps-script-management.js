// Google Apps Script untuk Spreadsheet Manajemen Turnamen
// URL: https://script.google.com/macros/s/AKfycbypGY-NglCjtwpSrH-cH4d4ajH2BHLd1cMPgaxTX_w0zGzP_Q5_y4gHXTJoRQrOFMWZ/exec

function doPost(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    
    console.log('Received POST request:', params);
    
    if (action === 'createData') {
      return handleCreateData(params);
    } else if (action === 'createBatch') {
      return handleCreateBatch(params);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({error: 'Unknown action: ' + action}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    
    if (action === 'getAllData') {
      return handleGetAllData(params);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({error: 'Unknown action: ' + action}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleCreateData(params) {
  try {
    const sheetName = params.sheetName || 'atlets';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Buat sheet jika belum ada
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      // Tambahkan header
      const headers = [
        'id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 
        'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 
        'isPresent', 'status', 'timestamp'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Parse data yang dikirim
    const data = JSON.parse(params.data);
    
    // Tambahkan timestamp
    data.push(new Date().toISOString());
    
    // Tambahkan data ke sheet
    sheet.appendRow(data);
    
    console.log('Data added successfully:', data);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Data added successfully',
        data: data
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in handleCreateData:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleCreateBatch(params) {
  try {
    const sheetName = params.sheetName || 'atlets';
    const data = JSON.parse(params.data);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Buat sheet jika belum ada
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      // Tambahkan header
      const headers = [
        'id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 
        'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 
        'isPresent', 'status', 'timestamp'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Konversi data ke format array
    const rows = data.map(item => [
      item.id_atlet,
      item.nama_lengkap,
      item.gender,
      item.tgl_lahir,
      item.dojang,
      item.sabuk,
      item.berat_badan,
      item.tinggi_badan,
      item.kategori,
      item.kelas,
      item.isPresent,
      item.status,
      new Date().toISOString()
    ]);
    
    // Tambahkan semua data sekaligus
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    
    console.log('Batch data added successfully:', rows.length, 'rows');
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Batch data added successfully',
        count: rows.length
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in handleCreateBatch:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetAllData(params) {
  try {
    const sheetName = params.sheetName || 'atlets';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Sheet not found: ' + sheetName
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: data
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in handleGetAllData:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi helper untuk inisialisasi sheet jika diperlukan
function initializeSheets() {
  const sheets = [
    "atlets",
    "categories", 
    "groups",
    "matches",
    "results"
  ];

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  sheets.forEach(sheetName => {
    if (!spreadsheet.getSheetByName(sheetName)) {
      const sheet = spreadsheet.insertSheet(sheetName);
      
      // Tambahkan header khusus untuk setiap sheet
      if (sheetName === 'atlets') {
        const headers = [
          'id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 
          'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 
          'isPresent', 'status', 'timestamp'
        ];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
    }
  });
}