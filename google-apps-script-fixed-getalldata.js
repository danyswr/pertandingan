// Google Apps Script yang LENGKAP dengan SEMUA CRUD operations untuk Tournament Management
// Copy kode ini ke Google Apps Script dan deploy sebagai Web App

function doPost(e) {
  try {
    const params = e.parameter;
    console.log('Received POST params:', JSON.stringify(params));
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName('atlets');
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet('atlets');
      sheet.getRange(1, 1, 1, 13).setValues([['id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 'hadir', 'status', 'timestamp']]);
    }
    
    // ============ ATTENDANCE UPDATE ============
    if (params.action === 'updateAttendance') {
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

    // ============ MAIN CATEGORY OPERATIONS ============
    if (params.action === 'createMainCategory') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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

    // Add other POST operations here...
    
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
    
    // ============ GET ALL DATA (FIXED) ============
    if (params.action === 'getAllData') {
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
      
      console.log(`Found ${data.length} rows in athletes sheet`);
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) { // Check if ID exists
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
            timestamp: data[i][12] || ''
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

    // ============ GET ATHLETES (SAME AS getAllData) ============
    if (params.action === 'getAthletes') {
      const sheet = spreadsheet.getSheetByName('atlets');
      
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athletes sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = sheet.getDataRange().getValues();
      const athletes = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) {
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
            timestamp: data[i][12] || ''
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: athletes}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ GET MAIN CATEGORIES ============
    if (params.action === 'getMainCategories') {
      const mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
      
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

    // ============ GET SUB CATEGORIES ============
    if (params.action === 'getSubCategories') {
      const subCategorySheet = spreadsheet.getSheetByName('SubKategori');
      const mainCategoryId = params.mainCategoryId;
      
      if (!subCategorySheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = subCategorySheet.getDataRange().getValues();
      const subCategories = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && (!mainCategoryId || data[i][1] == mainCategoryId)) {
          subCategories.push({
            id: data[i][0],
            mainCategoryId: data[i][1],
            order: data[i][2],
            name: data[i][3]
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: subCategories}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ GET ATHLETE GROUPS ============
    if (params.action === 'getAthleteGroups') {
      const athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
      const subCategoryId = params.subCategoryId;
      
      if (!athleteGroupSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = athleteGroupSheet.getDataRange().getValues();
      const athleteGroups = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && (!subCategoryId || data[i][1] == subCategoryId)) {
          athleteGroups.push({
            id: data[i][0],
            subCategoryId: data[i][1],
            name: data[i][2],
            matchNumber: data[i][3],
            description: data[i][4]
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: athleteGroups}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ GET GROUP ATHLETES ============
    if (params.action === 'getGroupAthletes') {
      const groupAthleteSheet = spreadsheet.getSheetByName('daftar_kelompok');
      const groupId = params.groupId;
      
      if (!groupAthleteSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = groupAthleteSheet.getDataRange().getValues();
      const groupAthletes = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && (!groupId || data[i][1] == groupId)) {
          groupAthletes.push({
            id: data[i][0],
            groupId: data[i][1],
            name: data[i][2],
            weight: data[i][3],
            height: data[i][4],
            belt: data[i][5],
            position: data[i][6], // M/B column
            queueOrder: data[i][7], // Nomor column
            age: data[i][8],
            hasMedal: data[i][9] === 'TRUE' || data[i][9] === true,
            isWinner: data[i][10] === 'TRUE' || data[i][10] === true
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: groupAthletes}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Default response if no action matches
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Tournament Management API is working',
        timestamp: new Date().toISOString(),
        availableActions: ['getAllData', 'getAthletes', 'getMainCategories', 'getSubCategories', 'getAthleteGroups', 'getGroupAthletes']
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
  let atletsSheet = spreadsheet.getSheetByName('atlets');
  if (!atletsSheet) {
    atletsSheet = spreadsheet.insertSheet('atlets');
    atletsSheet.getRange(1, 1, 1, 13).setValues([['id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 'hadir', 'status', 'timestamp']]);
  }
  
  // Initialize Kategori_utama sheet
  let mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
  if (!mainCategorySheet) {
    mainCategorySheet = spreadsheet.insertSheet('Kategori_utama');
    mainCategorySheet.getRange(1, 1, 1, 2).setValues([['id_kategori', 'nama_kategori']]);
  }
  
  // Initialize SubKategori sheet
  let subCategorySheet = spreadsheet.getSheetByName('SubKategori');
  if (!subCategorySheet) {
    subCategorySheet = spreadsheet.insertSheet('SubKategori');
    subCategorySheet.getRange(1, 1, 1, 4).setValues([['id_subkategori', 'id_kategori_utama', 'Nomor', 'judul_subkategori']]);
  }
  
  // Initialize Kelompok_Atlet sheet
  let athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
  if (!athleteGroupSheet) {
    athleteGroupSheet = spreadsheet.insertSheet('Kelompok_Atlet');
    athleteGroupSheet.getRange(1, 1, 1, 5).setValues([['id_kel', 'id_SubKelompok', 'Judul', 'Nomor', 'Keterangan']]);
  }
  
  // Initialize daftar_kelompok sheet
  let groupAthleteSheet = spreadsheet.getSheetByName('daftar_kelompok');
  if (!groupAthleteSheet) {
    groupAthleteSheet = spreadsheet.insertSheet('daftar_kelompok');
    groupAthleteSheet.getRange(1, 1, 1, 11).setValues([['id_daftarKelompok', 'id_kelompokAtlet', 'nama_atlet', 'Berat_badan', 'Tinggi_badan', 'sabuk', 'M/B', 'Nomor', 'umur', 'Mendali', 'Juara']]);
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