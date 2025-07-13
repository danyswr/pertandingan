/**
 * Google Apps Script untuk Tournament Management - FIXED untuk getAllData
 * Deploy sebagai Web App dengan eksekusi sebagai diri sendiri dan akses untuk semua orang
 */

function doGet(e) {
  try {
    const params = e.parameter;
    console.log('Received GET params:', JSON.stringify(params));
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // ============ HANDLE getAllData ACTION ============
    if (params.action === 'getAllData' || !params.action) {
      const sheet = spreadsheet.getSheetByName('atlets');
      
      if (!sheet) {
        console.log('Athletes sheet not found, creating new one');
        const newSheet = spreadsheet.insertSheet('atlets');
        newSheet.getRange(1, 1, 1, 13).setValues([['id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 'hadir', 'status', 'timestamp']]);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true, 
            data: [],
            message: 'Athletes sheet created, no data found'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = sheet.getDataRange().getValues();
      const athletes = [];
      
      console.log(`Processing ${data.length} rows from athletes sheet`);
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][1]) { // Check if ID and name exist
          athletes.push({
            id: data[i][0],
            nama_lengkap: data[i][1] || '',
            gender: data[i][2] || '',
            tgl_lahir: data[i][3] || '',
            dojang: data[i][4] || '',
            sabuk: data[i][5] || '',
            berat_badan: data[i][6] || 0,
            tinggi_badan: data[i][7] || 0,
            kategori: data[i][8] || '',
            kelas: data[i][9] || '',
            hadir: data[i][10] === true || data[i][10] === 'TRUE' || data[i][10] === 'true',
            status: data[i][11] || 'available',
            timestamp: data[i][12] || new Date().toISOString()
          });
        }
      }
      
      console.log(`Returning ${athletes.length} athletes`);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          data: athletes,
          message: `Found ${athletes.length} athletes`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ HANDLE getAthletes ACTION ============
    if (params.action === 'getAthletes') {
      const sheet = spreadsheet.getSheetByName('atlets');
      
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true, 
            data: [],
            message: 'Athletes sheet not found'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = sheet.getDataRange().getValues();
      const athletes = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][1]) {
          athletes.push({
            id: data[i][0],
            nama_lengkap: data[i][1] || '',
            gender: data[i][2] || '',
            tgl_lahir: data[i][3] || '',
            dojang: data[i][4] || '',
            sabuk: data[i][5] || '',
            berat_badan: data[i][6] || 0,
            tinggi_badan: data[i][7] || 0,
            kategori: data[i][8] || '',
            kelas: data[i][9] || '',
            hadir: data[i][10] === true || data[i][10] === 'TRUE' || data[i][10] === 'true',
            status: data[i][11] || 'available',
            timestamp: data[i][12] || new Date().toISOString()
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          data: athletes,
          message: `Found ${athletes.length} athletes`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ HANDLE getMainCategories ACTION ============
    if (params.action === 'getMainCategories') {
      const mainCategorySheet = spreadsheet.getSheetByName('kategori_utama');
      
      if (!mainCategorySheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = mainCategorySheet.getDataRange().getValues();
      const categories = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) {
          categories.push({
            id: data[i][0],
            name: data[i][1]
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: categories}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ DEFAULT RESPONSE ============
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Tournament Management API is working',
        timestamp: new Date().toISOString(),
        availableActions: ['getAllData', 'getAthletes', 'getMainCategories']
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        message: 'Internal server error',
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const params = e.parameter;
    console.log('Received POST params:', JSON.stringify(params));
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // ============ ATTENDANCE UPDATE ============
    if (params.action === 'updateAttendance') {
      const sheet = spreadsheet.getSheetByName('atlets');
      
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athletes sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      const isPresent = params.isPresent === 'true';
      
      if (id) {
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            sheet.getRange(i + 1, 11).setValue(isPresent);
            console.log('Attendance updated for athlete:', id, isPresent);
            
            return ContentService
              .createTextOutput(JSON.stringify({success: true, message: 'Attendance updated successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athlete not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete ID'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ UPDATE ATHLETE ============
    if (params.action === 'updateAthlete') {
      const sheet = spreadsheet.getSheetByName('atlets');
      
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athletes sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      
      if (id) {
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            // Update fields based on what was provided
            if (params.nama_lengkap) sheet.getRange(i + 1, 2).setValue(params.nama_lengkap);
            if (params.gender) sheet.getRange(i + 1, 3).setValue(params.gender);
            if (params.tgl_lahir) sheet.getRange(i + 1, 4).setValue(params.tgl_lahir);
            if (params.dojang) sheet.getRange(i + 1, 5).setValue(params.dojang);
            if (params.sabuk) sheet.getRange(i + 1, 6).setValue(params.sabuk);
            if (params.berat_badan) sheet.getRange(i + 1, 7).setValue(parseFloat(params.berat_badan));
            if (params.tinggi_badan) sheet.getRange(i + 1, 8).setValue(parseFloat(params.tinggi_badan));
            if (params.kategori) sheet.getRange(i + 1, 9).setValue(params.kategori);
            if (params.kelas) sheet.getRange(i + 1, 10).setValue(params.kelas);
            if (params.hadir !== undefined) sheet.getRange(i + 1, 11).setValue(params.hadir === 'true');
            if (params.status) sheet.getRange(i + 1, 12).setValue(params.status);
            
            console.log('Athlete updated:', id);
            
            return ContentService
              .createTextOutput(JSON.stringify({success: true, message: 'Athlete updated successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athlete not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete ID'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ DELETE ATHLETE ============
    if (params.action === 'deleteAthlete') {
      const sheet = spreadsheet.getSheetByName('atlets');
      
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athletes sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      
      if (id) {
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            sheet.deleteRow(i + 1);
            console.log('Athlete deleted:', id);
            
            return ContentService
              .createTextOutput(JSON.stringify({success: true, message: 'Athlete deleted successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athlete not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete ID'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Unknown action'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        message: 'Internal server error',
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper function untuk inisialisasi semua sheet
function initializeSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Initialize atlets sheet
  let atletsSheet = spreadsheet.getSheetByName('atlets');
  if (!atletsSheet) {
    atletsSheet = spreadsheet.insertSheet('atlets');
    atletsSheet.getRange(1, 1, 1, 13).setValues([['id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 'hadir', 'status', 'timestamp']]);
  }
  
  // Initialize kategori_utama sheet
  let mainCategorySheet = spreadsheet.getSheetByName('kategori_utama');
  if (!mainCategorySheet) {
    mainCategorySheet = spreadsheet.insertSheet('kategori_utama');
    mainCategorySheet.getRange(1, 1, 1, 2).setValues([['id_kategori', 'nama_kategori']]);
  }
  
  console.log('All sheets initialized successfully');
}

// Fungsi untuk testing
function testScript() {
  console.log('Testing Google Apps Script...');
  
  // Test getAllData
  const testEvent = {
    parameter: {
      action: 'getAllData'
    }
  };
  
  const result = doGet(testEvent);
  console.log('Test result:', result.getContent());
}

// Fungsi untuk menambahkan data test
function addTestData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('atlets');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('atlets');
    sheet.getRange(1, 1, 1, 13).setValues([['id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 'hadir', 'status', 'timestamp']]);
  }
  
  // Add test data
  const testData = [
    [1, 'Muhammad Azka Satria', 'Laki-laki', '2003-11-03', 'Pamulang', 'Kuning', 113, 175, 'Kyorugi', 'Pemula', true, 'available', '2025-01-13T14:31:45'],
    [2, 'Siti Aisyah', 'Perempuan', '2001-05-15', 'Jakarta', 'Merah', 55, 160, 'Poomsae', 'Junior', true, 'available', '2025-01-13T14:31:46'],
    [3, 'Joko Widodo', 'Laki-laki', '1999-12-08', 'Bandung', 'Hitam', 70, 175, 'Kyorugi', 'Senior', false, 'available', '2025-01-13T14:31:47']
  ];
  
  // Clear existing data (except header)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  // Add test data
  for (let i = 0; i < testData.length; i++) {
    sheet.appendRow(testData[i]);
  }
  
  console.log('Test data added successfully');
}