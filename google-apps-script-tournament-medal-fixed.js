// Google Apps Script yang LENGKAP dengan CRUD operations untuk Tournament Management
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

    if (params.action === 'updateMainCategory') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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

    // ============ SUB CATEGORY OPERATIONS ============
    if (params.action === 'createSubCategory') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let subCategorySheet = spreadsheet.getSheetByName('SubKategori');
      
      if (!subCategorySheet) {
        subCategorySheet = spreadsheet.insertSheet('SubKategori');
        subCategorySheet.getRange(1, 1, 1, 4).setValues([['id_subkategori', 'id_kategori_utama', 'Nomor', 'judul_subkategori']]);
      }
      
      const id = parseInt(params.id);
      const mainCategoryId = parseInt(params.mainCategoryId);
      const order = parseInt(params.order);
      const name = params.name;
      
      if (id && mainCategoryId && order && name) {
        subCategorySheet.appendRow([id, mainCategoryId, order, name]);
        console.log('Sub category created:', name);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true, 
            message: 'Sub category created successfully',
            id: id,
            name: name
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid sub category data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'updateSubCategory') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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
              .createTextOutput(JSON.stringify({
                success: true, 
                message: 'Sub category updated successfully',
                id: id,
                name: name
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Sub category not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid sub category data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'deleteSubCategory') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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
              .createTextOutput(JSON.stringify({
                success: true, 
                message: 'Sub category deleted successfully',
                id: id
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Sub category not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid sub category ID'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============ ATHLETE GROUP OPERATIONS ============
    if (params.action === 'createAthleteGroup') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
      
      if (!athleteGroupSheet) {
        athleteGroupSheet = spreadsheet.insertSheet('Kelompok_Atlet');
        athleteGroupSheet.getRange(1, 1, 1, 5).setValues([['id_kel', 'id_SubKelompok', 'Judul', 'Nomor', 'Keterangan']]);
      }
      
      const id = parseInt(params.id);
      const subCategoryId = parseInt(params.subCategoryId);
      const name = params.name;
      const description = params.description || '';
      const matchNumber = parseInt(params.matchNumber) || 1;
      
      if (id && subCategoryId && name) {
        athleteGroupSheet.appendRow([id, subCategoryId, name, matchNumber, description]);
        console.log('Athlete group created:', name);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true, 
            message: 'Athlete group created successfully',
            id: id,
            name: name
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete group data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'updateAthleteGroup') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
      
      if (!athleteGroupSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athlete group sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      const name = params.name;
      const description = params.description;
      const matchNumber = parseInt(params.matchNumber);
      
      if (id && (name || description || matchNumber)) {
        const data = athleteGroupSheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            // Update the row: id_kel, id_SubKelompok, Judul, Nomor, Keterangan
            if (name) {
              athleteGroupSheet.getRange(i + 1, 3).setValue(name); // Column C: Judul
            }
            if (matchNumber) {
              athleteGroupSheet.getRange(i + 1, 4).setValue(matchNumber); // Column D: Nomor
            }
            if (description) {
              athleteGroupSheet.getRange(i + 1, 5).setValue(description); // Column E: Keterangan
            }
            
            console.log('Athlete group updated:', id);
            
            return ContentService
              .createTextOutput(JSON.stringify({
                success: true, 
                message: 'Athlete group updated successfully',
                id: id
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athlete group not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid update data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'deleteAthleteGroup') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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
            
            return ContentService
              .createTextOutput(JSON.stringify({
                success: true, 
                message: 'Athlete group deleted successfully',
                id: id
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athlete group not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete group ID'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ============ GROUP ATHLETE OPERATIONS ============
    if (params.action === 'addAthleteToGroup') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let groupListSheet = spreadsheet.getSheetByName('daftar_kelompok');
      
      if (!groupListSheet) {
        groupListSheet = spreadsheet.insertSheet('daftar_kelompok');
        // Updated header with medal column
        groupListSheet.getRange(1, 1, 1, 10).setValues([['id_daftarKelompok', 'id_kelompokAtlet', 'nama_atlet', 'Berat_badan', 'Tinggi_badan', 'sabuk', 'umur', 'MB', 'Nomor', 'medali']]);
      }
      
      const id = parseInt(params.id);
      const groupId = parseInt(params.groupId);
      const athleteName = params.athleteName;
      const weight = parseFloat(params.weight) || 0;
      const height = parseFloat(params.height) || 0;
      const belt = params.belt || '';
      const age = parseInt(params.age) || 0;
      const position = params.position || '';
      const queueOrder = parseInt(params.queueOrder) || 1;
      const hasMedal = params.hasMedal === 'true';
      
      if (id && groupId && athleteName) {
        groupListSheet.appendRow([id, groupId, athleteName, weight, height, belt, age, position, queueOrder, hasMedal]);
        console.log('Athlete added to group:', athleteName);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true, 
            message: 'Athlete added to group successfully',
            id: id,
            athleteName: athleteName
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete group data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'updateAthleteInGroup') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let groupListSheet = spreadsheet.getSheetByName('daftar_kelompok');
      
      if (!groupListSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Group list sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      const position = params.position;
      const queueOrder = parseInt(params.queueOrder);
      const hasMedal = params.hasMedal === 'true';
      
      if (id && (position || queueOrder || params.hasMedal)) {
        const data = groupListSheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            // Update position (MB column)
            if (position) {
              groupListSheet.getRange(i + 1, 8).setValue(position);
            }
            
            // Update queue order (Nomor column)
            if (queueOrder) {
              groupListSheet.getRange(i + 1, 9).setValue(queueOrder);
            }
            
            // Update medal status (medali column)
            if (params.hasMedal) {
              groupListSheet.getRange(i + 1, 10).setValue(hasMedal);
            }
            
            console.log('Athlete in group updated:', id);
            
            return ContentService
              .createTextOutput(JSON.stringify({
                success: true, 
                message: 'Athlete in group updated successfully',
                id: id
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athlete in group not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid update data'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'removeAthleteFromGroup') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let groupListSheet = spreadsheet.getSheetByName('daftar_kelompok');
      
      if (!groupListSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Group list sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = parseInt(params.id);
      
      if (id) {
        const data = groupListSheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            groupListSheet.deleteRow(i + 1);
            console.log('Athlete removed from group:', id);
            
            return ContentService
              .createTextOutput(JSON.stringify({
                success: true, 
                message: 'Athlete removed from group successfully',
                id: id
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Athlete in group not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete ID'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ============ ATTENDANCE OPERATIONS ============
    if (params.action === 'updateAttendance') {
      const athleteId = parseInt(params.athleteId);
      const isPresent = params.isPresent === 'true';
      
      if (athleteId) {
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == athleteId) {
            sheet.getRange(i + 1, 11).setValue(isPresent);
            console.log('Attendance updated for athlete:', athleteId, 'to:', isPresent);
            
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

    if (params.action === 'updateAthlete') {
      const athleteId = parseInt(params.athleteId);
      const name = params.name;
      const gender = params.gender;
      const birthDate = params.birthDate;
      const dojang = params.dojang;
      const belt = params.belt;
      const weight = parseFloat(params.weight);
      const height = parseFloat(params.height);
      const category = params.category;
      const athleteClass = params.class;
      const status = params.status;
      
      if (athleteId) {
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == athleteId) {
            // Update the row data
            if (name) sheet.getRange(i + 1, 2).setValue(name);
            if (gender) sheet.getRange(i + 1, 3).setValue(gender);
            if (birthDate) sheet.getRange(i + 1, 4).setValue(birthDate);
            if (dojang) sheet.getRange(i + 1, 5).setValue(dojang);
            if (belt) sheet.getRange(i + 1, 6).setValue(belt);
            if (weight) sheet.getRange(i + 1, 7).setValue(weight);
            if (height) sheet.getRange(i + 1, 8).setValue(height);
            if (category) sheet.getRange(i + 1, 9).setValue(category);
            if (athleteClass) sheet.getRange(i + 1, 10).setValue(athleteClass);
            if (status) sheet.getRange(i + 1, 12).setValue(status);
            
            console.log('Athlete updated:', athleteId);
            
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
    
    // ============ BATCH DATA OPERATIONS ============
    if (params.action === 'addData' && params.rowData) {
      // Parse data dari parameter
      const rowData = JSON.parse(params.rowData);
      rowData.push(new Date().toLocaleString('id-ID')); // Tambahkan timestamp
      
      // Tambahkan data ke sheet
      sheet.appendRow(rowData);
      
      console.log('Data successfully added:', rowData);
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Data berhasil ditambahkan', data: rowData}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle batch data
    if (params.action === 'createBatch' && params.data) {
      const batchData = JSON.parse(params.data);
      console.log('Processing batch data:', batchData.length, 'items');
      
      let successCount = 0;
      for (const item of batchData) {
        try {
          const rowData = [
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
            item.hadir || false,
            item.status || 'active',
            new Date().toLocaleString('id-ID')
          ];
          
          sheet.appendRow(rowData);
          successCount++;
        } catch (error) {
          console.error('Error processing item:', error, item);
        }
      }
      
      console.log('Batch processing complete:', successCount, 'successful');
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: `Batch data processing complete: ${successCount}/${batchData.length} successful`,
          successCount: successCount,
          totalCount: batchData.length
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Default error response
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Action tidak dikenal atau parameter tidak lengkap'}))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Internal server error: ' + error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const params = e.parameter;
    console.log('Received GET params:', JSON.stringify(params));
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get all data from sheet
    if (params.action === 'getAllData') {
      let sheet = spreadsheet.getSheetByName('atlets');
      if (!sheet) {
        console.log('Sheet "atlets" not found');
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      try {
        const data = sheet.getDataRange().getValues();
        console.log('Retrieved data rows:', data.length);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: data}))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (error) {
        console.error('Error getting data:', error);
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Error retrieving data: ' + error.toString()}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Get main categories
    if (params.action === 'getMainCategories') {
      let mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
      if (!mainCategorySheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      try {
        const data = mainCategorySheet.getDataRange().getValues();
        console.log('Retrieved main categories:', data.length - 1);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: data}))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (error) {
        console.error('Error getting main categories:', error);
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Error retrieving main categories: ' + error.toString()}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Get sub categories
    if (params.action === 'getSubCategories') {
      let subCategorySheet = spreadsheet.getSheetByName('SubKategori');
      if (!subCategorySheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      try {
        const data = subCategorySheet.getDataRange().getValues();
        console.log('Retrieved sub categories:', data.length - 1);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: data}))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (error) {
        console.error('Error getting sub categories:', error);
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Error retrieving sub categories: ' + error.toString()}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Get athlete groups
    if (params.action === 'getAthleteGroups') {
      let athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
      if (!athleteGroupSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      try {
        const data = athleteGroupSheet.getDataRange().getValues();
        console.log('Retrieved athlete groups:', data.length - 1);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: data}))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (error) {
        console.error('Error getting athlete groups:', error);
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Error retrieving athlete groups: ' + error.toString()}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Get group athletes
    if (params.action === 'getGroupAthletes') {
      let groupListSheet = spreadsheet.getSheetByName('daftar_kelompok');
      if (!groupListSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      try {
        const data = groupListSheet.getDataRange().getValues();
        console.log('Retrieved group athletes:', data.length - 1);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: data}))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (error) {
        console.error('Error getting group athletes:', error);
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Error retrieving group athletes: ' + error.toString()}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Default response
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Action tidak dikenal'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Internal server error: ' + error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function initializeSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create athletes sheet
  let athletesSheet = spreadsheet.getSheetByName('atlets');
  if (!athletesSheet) {
    athletesSheet = spreadsheet.insertSheet('atlets');
    athletesSheet.getRange(1, 1, 1, 13).setValues([['id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 'hadir', 'status', 'timestamp']]);
  }
  
  // Create main categories sheet
  let mainCategorySheet = spreadsheet.getSheetByName('Kategori_utama');
  if (!mainCategorySheet) {
    mainCategorySheet = spreadsheet.insertSheet('Kategori_utama');
    mainCategorySheet.getRange(1, 1, 1, 2).setValues([['id_kategori', 'nama_kategori']]);
  }
  
  // Create sub categories sheet
  let subCategorySheet = spreadsheet.getSheetByName('SubKategori');
  if (!subCategorySheet) {
    subCategorySheet = spreadsheet.insertSheet('SubKategori');
    subCategorySheet.getRange(1, 1, 1, 4).setValues([['id_subkategori', 'id_kategori_utama', 'Nomor', 'judul_subkategori']]);
  }
  
  // Create athlete groups sheet
  let athleteGroupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
  if (!athleteGroupSheet) {
    athleteGroupSheet = spreadsheet.insertSheet('Kelompok_Atlet');
    athleteGroupSheet.getRange(1, 1, 1, 5).setValues([['id_kel', 'id_SubKelompok', 'Judul', 'Nomor', 'Keterangan']]);
  }
  
  // Create group athletes sheet with medal column
  let groupListSheet = spreadsheet.getSheetByName('daftar_kelompok');
  if (!groupListSheet) {
    groupListSheet = spreadsheet.insertSheet('daftar_kelompok');
    groupListSheet.getRange(1, 1, 1, 10).setValues([['id_daftarKelompok', 'id_kelompokAtlet', 'nama_atlet', 'Berat_badan', 'Tinggi_badan', 'sabuk', 'umur', 'MB', 'Nomor', 'medali']]);
  }
  
  console.log('All sheets initialized successfully');
}