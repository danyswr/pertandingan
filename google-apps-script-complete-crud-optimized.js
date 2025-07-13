// Google Apps Script LENGKAP dan OPTIMIZED untuk Tournament Management
// Deploy sebagai Web App dengan akses untuk semua orang

function doPost(e) {
  try {
    const params = e.parameter;
    console.log('Received POST params:', JSON.stringify(params));
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // ============ ATTENDANCE UPDATE ============
    if (params.action === 'updateAttendance') {
      const id = parseInt(params.id);
      const isPresent = params.isPresent === 'true';
      
      let sheet = spreadsheet.getSheetByName('atlets');
      if (!sheet) {
        sheet = initializeAtletsSheet(spreadsheet);
      }
      
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
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Athlete not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ ATHLETE OPERATIONS ============
    if (params.action === 'updateAthlete') {
      const id = parseInt(params.id);
      let sheet = spreadsheet.getSheetByName('atlets');
      if (!sheet) {
        sheet = initializeAtletsSheet(spreadsheet);
      }
      
      if (id) {
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
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
            
            return ContentService
              .createTextOutput(JSON.stringify({success: true, message: 'Athlete updated successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Athlete not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'deleteAthlete') {
      const id = parseInt(params.id);
      let sheet = spreadsheet.getSheetByName('atlets');
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athletes sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
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
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Athlete not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ MAIN CATEGORY OPERATIONS ============
    if (params.action === 'createMainCategory') {
      let mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
      if (!mainCategorySheet) {
        mainCategorySheet = initializeMainCategorySheet(spreadsheet);
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
              .createTextOutput(JSON.stringify({success: true, message: 'Main category updated successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Main category not found'}))
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
              .createTextOutput(JSON.stringify({success: true, message: 'Main category deleted successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Main category not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ SUB CATEGORY OPERATIONS ============
    if (params.action === 'createSubCategory') {
      let subCategorySheet = spreadsheet.getSheetByName('SubKategori');
      if (!subCategorySheet) {
        subCategorySheet = initializeSubCategorySheet(spreadsheet);
      }
      
      const id = parseInt(params.id);
      const mainCategoryId = parseInt(params.mainCategoryId);
      const order = parseInt(params.order);
      const name = params.name;
      
      if (id && mainCategoryId && order && name) {
        subCategorySheet.appendRow([id, mainCategoryId, order, name]);
        console.log('Sub category created:', name);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, message: 'Sub category created successfully'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid sub category data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'updateSubCategory') {
      const subCategorySheet = spreadsheet.getSheetByName('SubKategori');
      
      if (!subCategorySheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Sub category sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      const mainCategoryId = parseInt(params.mainCategoryId);
      const order = parseInt(params.order);
      const name = params.name;
      
      if (id && mainCategoryId && order && name) {
        const data = subCategorySheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            subCategorySheet.getRange(i + 1, 2).setValue(mainCategoryId);
            subCategorySheet.getRange(i + 1, 3).setValue(order);
            subCategorySheet.getRange(i + 1, 4).setValue(name);
            console.log('Sub category updated:', name);
            
            return ContentService
              .createTextOutput(JSON.stringify({success: true, message: 'Sub category updated successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Sub category not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'deleteSubCategory') {
      const subCategorySheet = spreadsheet.getSheetByName('SubKategori');
      
      if (!subCategorySheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Sub category sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      
      if (id) {
        const data = subCategorySheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            subCategorySheet.deleteRow(i + 1);
            console.log('Sub category deleted:', id);
            
            return ContentService
              .createTextOutput(JSON.stringify({success: true, message: 'Sub category deleted successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Sub category not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ ATHLETE GROUP OPERATIONS ============
    if (params.action === 'createAthleteGroup') {
      let athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
      if (!athleteGroupSheet) {
        athleteGroupSheet = initializeAthleteGroupSheet(spreadsheet);
      }
      
      const id = parseInt(params.id);
      const subCategoryId = parseInt(params.subCategoryId);
      const name = params.name;
      const matchNumber = parseInt(params.matchNumber) || 1;
      const description = params.description || '';
      
      if (id && subCategoryId && name) {
        athleteGroupSheet.appendRow([id, subCategoryId, name, matchNumber, description]);
        console.log('Athlete group created:', name);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, message: 'Athlete group created successfully'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete group data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'updateAthleteGroup') {
      const athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
      
      if (!athleteGroupSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athlete group sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      const subCategoryId = parseInt(params.subCategoryId);
      const name = params.name;
      const matchNumber = parseInt(params.matchNumber) || 1;
      const description = params.description || '';
      
      if (id && subCategoryId && name) {
        const data = athleteGroupSheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            athleteGroupSheet.getRange(i + 1, 2).setValue(subCategoryId);
            athleteGroupSheet.getRange(i + 1, 3).setValue(name);
            athleteGroupSheet.getRange(i + 1, 4).setValue(matchNumber);
            athleteGroupSheet.getRange(i + 1, 5).setValue(description);
            console.log('Athlete group updated:', name);
            
            return ContentService
              .createTextOutput(JSON.stringify({success: true, message: 'Athlete group updated successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Athlete group not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'deleteAthleteGroup') {
      const athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
      
      if (!athleteGroupSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athlete group sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      
      if (id) {
        const data = athleteGroupSheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            athleteGroupSheet.deleteRow(i + 1);
            console.log('Athlete group deleted:', id);
            
            // Also delete related group athletes
            const groupAthleteSheet = spreadsheet.getSheetByName('daftar_kelompok');
            if (groupAthleteSheet) {
              const groupData = groupAthleteSheet.getDataRange().getValues();
              for (let j = groupData.length - 1; j >= 1; j--) {
                if (groupData[j][1] == id) {
                  groupAthleteSheet.deleteRow(j + 1);
                }
              }
            }
            
            return ContentService
              .createTextOutput(JSON.stringify({success: true, message: 'Athlete group deleted successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Athlete group not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ GROUP ATHLETE OPERATIONS ============
    if (params.action === 'addAthleteToGroup') {
      let groupAthleteSheet = spreadsheet.getSheetByName('daftar_kelompok');
      if (!groupAthleteSheet) {
        groupAthleteSheet = initializeGroupAthleteSheet(spreadsheet);
      }
      
      const id = parseInt(params.id);
      const groupId = parseInt(params.groupId);
      const athleteName = params.athleteName;
      const weight = parseFloat(params.weight) || 0;
      const height = parseFloat(params.height) || 0;
      const belt = params.belt || '';
      const position = params.position || '';
      const matchNumber = parseInt(params.matchNumber) || 1;
      const age = parseInt(params.age) || 0;
      const medal = params.medal || '';
      const winner = params.winner || '';
      
      if (id && groupId && athleteName) {
        groupAthleteSheet.appendRow([id, groupId, athleteName, weight, height, belt, position, matchNumber, age, medal, winner]);
        console.log('Athlete added to group:', athleteName);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, message: 'Athlete added to group successfully'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid group athlete data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'updateAthletePosition') {
      const groupAthleteSheet = spreadsheet.getSheetByName('daftar_kelompok');
      
      if (!groupAthleteSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Group athlete sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      const position = params.position;
      
      if (id && position) {
        const data = groupAthleteSheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            // Update position in M/B column (column 7)
            let positionText = '';
            if (position === 'red') positionText = 'merah';
            else if (position === 'blue') positionText = 'biru';
            else if (position === 'queue') positionText = 'antri';
            
            groupAthleteSheet.getRange(i + 1, 7).setValue(positionText);
            console.log('Athlete position updated:', id, position);
            
            return ContentService
              .createTextOutput(JSON.stringify({success: true, message: 'Athlete position updated successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Group athlete not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'deleteGroupAthlete') {
      const groupAthleteSheet = spreadsheet.getSheetByName('daftar_kelompok');
      
      if (!groupAthleteSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Group athlete sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      
      if (id) {
        const data = groupAthleteSheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            groupAthleteSheet.deleteRow(i + 1);
            console.log('Group athlete deleted:', id);
            
            return ContentService
              .createTextOutput(JSON.stringify({success: true, message: 'Group athlete deleted successfully'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Group athlete not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Invalid action'}))
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
    
    // ============ GET ALL ATHLETES ============
    if (params.action === 'getAthletes') {
      let sheet = spreadsheet.getSheetByName('atlets');
      if (!sheet) {
        sheet = initializeAtletsSheet(spreadsheet);
      }
      
      const data = sheet.getDataRange().getValues();
      const athletes = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) {
          athletes.push({
            id: data[i][0],
            name: data[i][1],
            gender: data[i][2],
            birthDate: data[i][3],
            dojang: data[i][4],
            belt: data[i][5],
            weight: data[i][6],
            height: data[i][7],
            category: data[i][8],
            class: data[i][9],
            isPresent: data[i][10],
            status: data[i][11],
            timestamp: data[i][12]
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: athletes}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ GET MAIN CATEGORIES ============
    if (params.action === 'getMainCategories') {
      let mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
      if (!mainCategorySheet) {
        mainCategorySheet = initializeMainCategorySheet(spreadsheet);
      }
      
      const data = mainCategorySheet.getDataRange().getValues();
      const mainCategories = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) {
          mainCategories.push({
            id: data[i][0],
            name: data[i][1]
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: mainCategories}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ GET SUB CATEGORIES ============
    if (params.action === 'getSubCategories') {
      let subCategorySheet = spreadsheet.getSheetByName('SubKategori');
      if (!subCategorySheet) {
        subCategorySheet = initializeSubCategorySheet(spreadsheet);
      }
      
      const mainCategoryId = params.mainCategoryId;
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
      let athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
      if (!athleteGroupSheet) {
        athleteGroupSheet = initializeAthleteGroupSheet(spreadsheet);
      }
      
      const subCategoryId = params.subCategoryId;
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
      let groupAthleteSheet = spreadsheet.getSheetByName('daftar_kelompok');
      if (!groupAthleteSheet) {
        groupAthleteSheet = initializeGroupAthleteSheet(spreadsheet);
      }
      
      const groupId = params.groupId;
      const data = groupAthleteSheet.getDataRange().getValues();
      const groupAthletes = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && (!groupId || data[i][1] == groupId)) {
          groupAthletes.push({
            id: data[i][0],
            groupId: data[i][1],
            athleteName: data[i][2],
            weight: data[i][3],
            height: data[i][4],
            belt: data[i][5],
            position: data[i][6],
            matchNumber: data[i][7],
            age: data[i][8],
            medal: data[i][9],
            winner: data[i][10]
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: groupAthletes}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Default response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Tournament Management API is working',
        timestamp: new Date().toISOString()
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

// Helper functions for sheet initialization
function initializeAtletsSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('atlets');
  sheet.getRange(1, 1, 1, 13).setValues([['id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 'hadir', 'status', 'timestamp']]);
  return sheet;
}

function initializeMainCategorySheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Kategori_utama');
  sheet.getRange(1, 1, 1, 2).setValues([['id_kategori', 'nama_kategori']]);
  return sheet;
}

function initializeSubCategorySheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('SubKategori');
  sheet.getRange(1, 1, 1, 4).setValues([['id_subkategori', 'id_kategori_utama', 'Nomor', 'judul_subkategori']]);
  return sheet;
}

function initializeAthleteGroupSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Kelompok_Atlet');
  sheet.getRange(1, 1, 1, 5).setValues([['id_kel', 'id_SubKelompok', 'Judul', 'Nomor', 'Keterangan']]);
  return sheet;
}

function initializeGroupAthleteSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('daftar_kelompok');
  sheet.getRange(1, 1, 1, 11).setValues([['id_daftarKelompok', 'id_kelompokAtlet', 'nama_atlet', 'Berat_badan', 'Tinggi_badan', 'sabuk', 'M/B', 'Nomor', 'umur', 'Mendali', 'Juara']]);
  return sheet;
}

function initializeSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  initializeAtletsSheet(spreadsheet);
  initializeMainCategorySheet(spreadsheet);
  initializeSubCategorySheet(spreadsheet);
  initializeAthleteGroupSheet(spreadsheet);
  initializeGroupAthleteSheet(spreadsheet);
  
  console.log('All sheets initialized successfully');
  return 'All sheets initialized successfully';
}

function testScript() {
  const testParams = {
    parameter: {
      action: 'getAthletes'
    }
  };
  
  const result = doGet(testParams);
  console.log('Test result:', result.getContent());
  return result.getContent();
}