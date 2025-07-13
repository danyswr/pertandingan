/**
 * Google Apps Script yang LENGKAP dengan SEMUA CRUD operations untuk Tournament Management
 * Deploy sebagai Web App dengan eksekusi sebagai diri sendiri dan akses untuk semua orang
 */

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

    // ============ MAIN CATEGORY OPERATIONS ============
    if (params.action === 'createMainCategory') {
      let mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
      
      if (!mainCategorySheet) {
        mainCategorySheet = spreadsheet.insertSheet('Kategori_utama');
        mainCategorySheet.getRange(1, 1, 1, 2).setValues([['id_kategori', 'nama_kategori']]);
      }
      
      const id = parseInt(params.id);
      const name = params.name;
      
      if (id && name) {
        mainCategorySheet.appendRow([id, name]);
        console.log('Main category created:', name);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true, 
            message: 'Main category created successfully',
            id: id,
            name: name
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid main category data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'updateMainCategory') {
      const mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
      
      if (!mainCategorySheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Main category sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      const name = params.name;
      
      if (id && name) {
        const data = mainCategorySheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            mainCategorySheet.getRange(i + 1, 2).setValue(name);
            console.log('Main category updated:', name);
            
            return ContentService
              .createTextOutput(JSON.stringify({
                success: true, 
                message: 'Main category updated successfully',
                id: id,
                name: name
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Main category not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid main category data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'deleteMainCategory') {
      const mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
      
      if (!mainCategorySheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Main category sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      
      if (id) {
        const data = mainCategorySheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            mainCategorySheet.deleteRow(i + 1);
            console.log('Main category deleted:', id);
            
            return ContentService
              .createTextOutput(JSON.stringify({
                success: true, 
                message: 'Main category deleted successfully',
                id: id
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Main category not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid main category ID'}))
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

function doGet(e) {
  try {
    const params = e.parameter;
    console.log('Received GET params:', JSON.stringify(params));
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // ============ HANDLE getAllData ACTION ============
    if (params.action === 'getAllData' || params.action === 'getAthletes' || !params.action) {
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

    // ============ HANDLE getMainCategories ACTION ============
    if (params.action === 'getMainCategories') {
      let mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
      
      if (!mainCategorySheet) {
        // Try alternative sheet names
        mainCategorySheet = spreadsheet.getSheetByName('kategori_utama');
      }
      
      if (!mainCategorySheet) {
        console.log('Creating new Kategori_utama sheet');
        mainCategorySheet = spreadsheet.insertSheet('Kategori_utama');
        mainCategorySheet.getRange(1, 1, 1, 2).setValues([['id_kategori', 'nama_kategori']]);
        
        // Add default data
        mainCategorySheet.appendRow([1, 'kyorugi']);
        mainCategorySheet.appendRow([2, 'poomsae']);
        
        console.log('Added default categories to Kategori_utama sheet');
      }
      
      const data = mainCategorySheet.getDataRange().getValues();
      const categories = [];
      
      console.log(`Processing ${data.length} rows from main categories sheet`);
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][1]) {
          categories.push({
            id: data[i][0],
            name: data[i][1]
          });
        }
      }
      
      console.log(`Returning ${categories.length} main categories`);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          data: categories,
          message: `Found ${categories.length} main categories`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ HANDLE getSubCategories ACTION ============
    if (params.action === 'getSubCategories') {
      const mainCategoryId = parseInt(params.mainCategoryId);
      
      let subCategorySheet = spreadsheet.getSheetByName('SubKategori');
      
      if (!subCategorySheet) {
        console.log('Creating new SubKategori sheet');
        subCategorySheet = spreadsheet.insertSheet('SubKategori');
        subCategorySheet.getRange(1, 1, 1, 4).setValues([['id_subkategori', 'id_kategori_utama', 'Nomor', 'judul_subkategori']]);
      }
      
      const data = subCategorySheet.getDataRange().getValues();
      const subCategories = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][1] && (!mainCategoryId || data[i][1] == mainCategoryId)) {
          subCategories.push({
            id: data[i][0],
            mainCategoryId: data[i][1],
            order: data[i][2],
            name: data[i][3]
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          data: subCategories,
          message: `Found ${subCategories.length} sub categories`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ DEFAULT RESPONSE ============
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Tournament Management API is working',
        timestamp: new Date().toISOString(),
        availableActions: ['getAllData', 'getAthletes', 'getMainCategories', 'getSubCategories']
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

// Helper function untuk inisialisasi semua sheet
function initializeSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Initialize atlets sheet
  initializeAtletsSheet(spreadsheet);
  
  // Initialize main category sheet
  initializeMainCategorySheet(spreadsheet);
  
  // Initialize sub category sheet
  initializeSubCategorySheet(spreadsheet);
  
  // Initialize athlete group sheet
  initializeAthleteGroupSheet(spreadsheet);
  
  // Initialize group athlete sheet
  initializeGroupAthleteSheet(spreadsheet);
  
  console.log('All sheets initialized successfully');
}

function initializeAtletsSheet(spreadsheet) {
  let atletsSheet = spreadsheet.getSheetByName('atlets');
  if (!atletsSheet) {
    atletsSheet = spreadsheet.insertSheet('atlets');
    atletsSheet.getRange(1, 1, 1, 13).setValues([['id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 'hadir', 'status', 'timestamp']]);
  }
  console.log('Athletes sheet initialized');
}

function initializeMainCategorySheet(spreadsheet) {
  let mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
  if (!mainCategorySheet) {
    mainCategorySheet = spreadsheet.insertSheet('Kategori_utama');
    mainCategorySheet.getRange(1, 1, 1, 2).setValues([['id_kategori', 'nama_kategori']]);
    
    // Add default data
    mainCategorySheet.appendRow([1, 'kyorugi']);
    mainCategorySheet.appendRow([2, 'poomsae']);
  }
  console.log('Main category sheet initialized');
}

function initializeSubCategorySheet(spreadsheet) {
  let subCategorySheet = spreadsheet.getSheetByName('SubKategori');
  if (!subCategorySheet) {
    subCategorySheet = spreadsheet.insertSheet('SubKategori');
    subCategorySheet.getRange(1, 1, 1, 4).setValues([['id_subkategori', 'id_kategori_utama', 'Nomor', 'judul_subkategori']]);
  }
  console.log('Sub category sheet initialized');
}

function initializeAthleteGroupSheet(spreadsheet) {
  let athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
  if (!athleteGroupSheet) {
    athleteGroupSheet = spreadsheet.insertSheet('Kelompok_Atlet');
    athleteGroupSheet.getRange(1, 1, 1, 5).setValues([['id_kel', 'id_SubKelompok', 'Judul', 'Nomor', 'Keterangan']]);
  }
  console.log('Athlete group sheet initialized');
}

function initializeGroupAthleteSheet(spreadsheet) {
  let groupAthleteSheet = spreadsheet.getSheetByName('daftar_kelompok');
  if (!groupAthleteSheet) {
    groupAthleteSheet = spreadsheet.insertSheet('daftar_kelompok');
    groupAthleteSheet.getRange(1, 1, 1, 11).setValues([['id_daftarKelompok', 'id_kelompokAtlet', 'nama_atlet', 'Berat_badan', 'Tinggi_badan', 'sabuk', 'umur', 'M/B', 'Nomor', 'Juara', 'Mendali']]);
  }
  console.log('Group athlete sheet initialized');
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
  
  // Test getMainCategories
  const testMainCategories = {
    parameter: {
      action: 'getMainCategories'
    }
  };
  
  const mainCategoriesResult = doGet(testMainCategories);
  console.log('Main categories result:', mainCategoriesResult.getContent());
}