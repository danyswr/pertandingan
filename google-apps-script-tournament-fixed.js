// Google Apps Script yang sudah diperbaiki untuk Spreadsheet Manajemen Tournament
// Copy kode ini ke Google Apps Script dan deploy sebagai Web App

function doPost(e) {
  try {
    const params = e.parameter;
    console.log('Received POST params:', JSON.stringify(params));
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Handle Main Category actions
    if (params.action === 'createMainCategory') {
      let sheet = spreadsheet.getSheetByName('kategori_utama');
      if (!sheet) {
        sheet = spreadsheet.insertSheet('kategori_utama');
        sheet.getRange(1, 1, 1, 2).setValues([['id_kategori', 'nama_kategori']]);
      }
      
      // Use the ID provided by the application
      const categoryId = parseInt(params.id);
      const rowData = [categoryId, params.name];
      sheet.appendRow(rowData);
      
      console.log('Main category created:', params.name, 'with ID:', categoryId);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: 'Main category created successfully',
          id: categoryId,
          name: params.name
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle Update Main Category
    if (params.action === 'updateMainCategory') {
      const sheet = spreadsheet.getSheetByName('kategori_utama');
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'kategori_utama sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const categoryId = parseInt(params.id);
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == categoryId) {
          sheet.getRange(i + 1, 2).setValue(params.name);
          console.log('Main category updated:', categoryId, params.name);
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true, 
              message: 'Main category updated successfully',
              id: categoryId,
              name: params.name
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Category not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle Delete Main Category
    if (params.action === 'deleteMainCategory') {
      const sheet = spreadsheet.getSheetByName('kategori_utama');
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'kategori_utama sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const categoryId = parseInt(params.id);
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == categoryId) {
          sheet.deleteRow(i + 1);
          console.log('Main category deleted:', categoryId);
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true, 
              message: 'Main category deleted successfully'
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Category not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Handle Sub Category actions
    if (params.action === 'createSubCategory') {
      let sheet = spreadsheet.getSheetByName('SubKategori');
      if (!sheet) {
        sheet = spreadsheet.insertSheet('SubKategori');
        sheet.getRange(1, 1, 1, 4).setValues([['id_subkategori', 'id_kategori_utama', 'Nomor', 'judul_subkategori']]);
      }
      
      // Use the ID provided by the application
      const subCategoryId = parseInt(params.id);
      const rowData = [subCategoryId, parseInt(params.mainCategoryId), parseInt(params.order), params.name];
      sheet.appendRow(rowData);
      
      console.log('Sub category created:', params.name, 'with ID:', subCategoryId);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: 'Sub category created successfully',
          id: subCategoryId,
          mainCategoryId: parseInt(params.mainCategoryId),
          order: parseInt(params.order),
          name: params.name
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle Update Sub Category
    if (params.action === 'updateSubCategory') {
      const sheet = spreadsheet.getSheetByName('SubKategori');
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'SubKategori sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const subCategoryId = parseInt(params.id);
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == subCategoryId) {
          sheet.getRange(i + 1, 2).setValue(parseInt(params.mainCategoryId));
          sheet.getRange(i + 1, 3).setValue(parseInt(params.order));
          sheet.getRange(i + 1, 4).setValue(params.name);
          console.log('Sub category updated:', subCategoryId, params.name);
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true, 
              message: 'Sub category updated successfully',
              id: subCategoryId,
              name: params.name
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Sub category not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle Delete Sub Category
    if (params.action === 'deleteSubCategory') {
      const sheet = spreadsheet.getSheetByName('SubKategori');
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'SubKategori sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const subCategoryId = parseInt(params.id);
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == subCategoryId) {
          sheet.deleteRow(i + 1);
          console.log('Sub category deleted:', subCategoryId);
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true, 
              message: 'Sub category deleted successfully'
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Sub category not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle Athlete Group actions
    if (params.action === 'createAthleteGroup') {
      let sheet = spreadsheet.getSheetByName('Kelompok_Atlet');
      if (!sheet) {
        sheet = spreadsheet.insertSheet('Kelompok_Atlet');
        sheet.getRange(1, 1, 1, 5).setValues([['id_kel', 'id_SubKelompok', 'Judul', 'Nomor', 'Keterangan']]);
      }
      
      // Use the ID provided by the application
      const groupId = parseInt(params.id);
      const matchNumber = parseInt(params.matchNumber) || 1;
      const rowData = [groupId, parseInt(params.subCategoryId), params.name, matchNumber, params.description || ''];
      sheet.appendRow(rowData);
      
      console.log('Athlete group created:', params.name, 'with ID:', groupId);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: 'Athlete group created successfully',
          id: groupId,
          subCategoryId: parseInt(params.subCategoryId),
          name: params.name,
          matchNumber: matchNumber,
          description: params.description || ''
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle Group Athletes actions
    if (params.action === 'addAthleteToGroup') {
      let sheet = spreadsheet.getSheetByName('daftar_kelompok');
      if (!sheet) {
        sheet = spreadsheet.insertSheet('daftar_kelompok');
        sheet.getRange(1, 1, 1, 9).setValues([['id_daftarKelompok', 'id_kelompokAtlet', 'nama_atlet', 'Berat_badan', 'Tinggi_badan', 'sabuk', 'umur', 'MB', 'Nomor']]);
      }
      
      const data = sheet.getDataRange().getValues();
      const nextId = data.length; // Header row is 1, so next ID starts from data.length
      
      const rowData = [
        nextId, 
        parseInt(params.groupId), 
        params.athleteName, 
        parseFloat(params.weight) || 0, 
        parseFloat(params.height) || 0, 
        params.belt || '', 
        parseInt(params.age) || 0, 
        params.position || 'queue', 
        parseInt(params.queueOrder) || 1
      ];
      sheet.appendRow(rowData);
      
      console.log('Athlete added to group:', params.athleteName);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: 'Athlete added to group successfully',
          id: nextId,
          groupId: parseInt(params.groupId),
          athleteName: params.athleteName
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle attendance update for athletes sheet
    const sheet = spreadsheet.getSheetByName('atlets');
    if (params.action === 'updateAttendance' && sheet) {
      const athleteId = parseInt(params.athleteId);
      const isPresent = params.isPresent === 'true';
      
      if (athleteId && athleteId > 0) {
        const rowIndex = athleteId + 1; // +1 because row 1 is header, athlete ID 1 is row 2
        const attendanceColumn = 11; // Column K (Hadir)
        
        const data = sheet.getDataRange().getValues();
        if (data.length > rowIndex - 1) {
          sheet.getRange(rowIndex, attendanceColumn).setValue(isPresent);
          
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true, 
              message: 'Attendance updated successfully',
              athleteId: athleteId,
              isPresent: isPresent
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // Handle other athlete actions (existing functionality)
    if (params.action === 'updateAthlete' && sheet) {
      const athleteId = parseInt(params.athleteId);
      
      if (athleteId && athleteId > 0) {
        const rowIndex = athleteId + 1;
        const data = sheet.getDataRange().getValues();
        if (data.length > rowIndex - 1) {
          const updateData = [
            [
              athleteId,
              params.name || data[rowIndex - 1][1],
              params.gender || data[rowIndex - 1][2],
              params.birthDate || data[rowIndex - 1][3],
              params.dojang || data[rowIndex - 1][4],
              params.belt || data[rowIndex - 1][5],
              parseFloat(params.weight) || data[rowIndex - 1][6],
              parseFloat(params.height) || data[rowIndex - 1][7],
              params.category || data[rowIndex - 1][8],
              params.class || data[rowIndex - 1][9],
              data[rowIndex - 1][10],
              params.status || data[rowIndex - 1][11],
              new Date().toLocaleString('id-ID')
            ]
          ];
          
          sheet.getRange(rowIndex, 1, 1, 13).setValues(updateData);
          
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true, 
              message: 'Athlete data updated successfully',
              athleteId: athleteId,
              updatedData: updateData[0]
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    if (params.action === 'addData' && params.rowData && sheet) {
      const rowData = JSON.parse(params.rowData);
      rowData.push(new Date().toLocaleString('id-ID'));
      sheet.appendRow(rowData);
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Data berhasil ditambahkan', data: rowData}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (params.action === 'createBatch' && params.data && sheet) {
      const batchData = JSON.parse(params.data);
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
            item.isPresent,
            item.status,
            new Date().toLocaleString('id-ID')
          ];
          
          sheet.appendRow(rowData);
          successCount++;
        } catch (error) {
          console.error('Error adding athlete:', item.nama_lengkap, error);
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: `Batch transfer berhasil: ${successCount}/${batchData.length} atlet`,
          count: successCount
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Action tidak dikenal atau parameter tidak lengkap'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const params = e.parameter;
    console.log('Received GET params:', JSON.stringify(params));
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (params.action === 'test') {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Google Apps Script bekerja dengan baik'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get main categories
    if (params.action === 'getMainCategories') {
      const sheet = spreadsheet.getSheetByName('kategori_utama');
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = sheet.getDataRange().getValues();
      const categories = [];
      
      // Skip header row (index 0)
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][1]) { // Check if ID and name exist
          categories.push({
            id: data[i][0],
            name: data[i][1]
          });
        }
      }
      
      console.log('Found', categories.length, 'main categories from kategori_utama sheet');
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: categories}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (params.action === 'getAllData') {
      const sheet = spreadsheet.getSheetByName('atlets');
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Sheet atlets tidak ditemukan'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = sheet.getDataRange().getValues();
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: data}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'GET request berhasil'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function initializeSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create kategori_utama sheet
  let mainCatSheet = spreadsheet.getSheetByName('kategori_utama');
  if (!mainCatSheet) {
    mainCatSheet = spreadsheet.insertSheet('kategori_utama');
    mainCatSheet.getRange(1, 1, 1, 2).setValues([['id_kategori', 'nama_kategori']]);
  }
  
  // Create SubKategori sheet
  let subCatSheet = spreadsheet.getSheetByName('SubKategori');
  if (!subCatSheet) {
    subCatSheet = spreadsheet.insertSheet('SubKategori');
    subCatSheet.getRange(1, 1, 1, 4).setValues([['id_subkategori', 'id_kategori_utama', 'Nomor', 'judul_subkategori']]);
  }
  
  // Create Kelompok_Atlet sheet
  let groupSheet = spreadsheet.getSheetByName('Kelompok_Atlet');
  if (!groupSheet) {
    groupSheet = spreadsheet.insertSheet('Kelompok_Atlet');
    groupSheet.getRange(1, 1, 1, 5).setValues([['id_kel', 'id_SubKelompok', 'Judul', 'Nomor', 'Keterangan']]);
  }
  
  // Create daftar_kelompok sheet
  let memberSheet = spreadsheet.getSheetByName('daftar_kelompok');
  if (!memberSheet) {
    memberSheet = spreadsheet.insertSheet('daftar_kelompok');
    memberSheet.getRange(1, 1, 1, 9).setValues([['id_daftarKelompok', 'id_kelompokAtlet', 'nama_atlet', 'Berat_badan', 'Tinggi_badan', 'sabuk', 'umur', 'MB', 'Nomor']]);
  }
  
  // Create atlets sheet if not exists
  let athleteSheet = spreadsheet.getSheetByName('atlets');
  if (!athleteSheet) {
    athleteSheet = spreadsheet.insertSheet('atlets');
    athleteSheet.getRange(1, 1, 1, 13).setValues([['id_atlet', 'nama_lengkap', 'gender', 'tgl_lahir', 'dojang', 'sabuk', 'berat_badan', 'tinggi_badan', 'kategori', 'kelas', 'isPresent', 'status', 'created_at']]);
  }
  
  console.log('All tournament sheets initialized successfully');
}