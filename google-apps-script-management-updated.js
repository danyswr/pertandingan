// Google Apps Script yang sudah diperbaiki untuk Spreadsheet Manajemen
// Copy kode ini ke Google Apps Script dan deploy sebagai Web App

function doPost(e) {
  try {
    const params = e.parameter;
    console.log('Received POST params:', JSON.stringify(params));
    
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
    
    // Handle attendance update
    if (params.action === 'updateAttendance') {
      const athleteId = parseInt(params.athleteId);
      const isPresent = params.isPresent === 'true';
      
      console.log('Updating attendance for athlete ID:', athleteId, 'isPresent:', isPresent);
      
      if (athleteId && athleteId > 0) {
        const rowIndex = athleteId + 1; // +1 because row 1 is header, athlete ID 1 is row 2
        const attendanceColumn = 11; // Column K (Hadir)
        
        // Check if row exists
        const data = sheet.getDataRange().getValues();
        if (data.length > rowIndex - 1) {
          // Update the attendance cell
          sheet.getRange(rowIndex, attendanceColumn).setValue(isPresent);
          
          console.log('Attendance updated successfully for athlete:', athleteId);
          
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true, 
              message: 'Attendance updated successfully',
              athleteId: athleteId,
              isPresent: isPresent
            }))
            .setMimeType(ContentService.MimeType.JSON);
        } else {
          console.log('Athlete row not found:', athleteId);
          return ContentService
            .createTextOutput(JSON.stringify({
              success: false, 
              message: 'Athlete not found'
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false, 
            message: 'Invalid athlete ID'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Handle athlete data update
    if (params.action === 'updateAthlete') {
      const athleteId = parseInt(params.athleteId);
      
      console.log('Updating athlete data for ID:', athleteId);
      console.log('Update data:', JSON.stringify(params));
      
      if (athleteId && athleteId > 0) {
        const rowIndex = athleteId + 1; // +1 because row 1 is header, athlete ID 1 is row 2
        
        // Check if row exists
        const data = sheet.getDataRange().getValues();
        if (data.length > rowIndex - 1) {
          // Update the athlete row with new data
          // Column mapping: 1=ID, 2=Name, 3=Gender, 4=Birth Date, 5=Dojang, 6=Belt, 7=Weight, 8=Height, 9=Category, 10=Class, 11=Present, 12=Status, 13=Timestamp
          const updateData = [
            [
              athleteId, // ID Atlet (Column A)
              params.name || data[rowIndex - 1][1], // Nama Lengkap (Column B)
              params.gender || data[rowIndex - 1][2], // Gender (Column C)
              params.birthDate || data[rowIndex - 1][3], // Tanggal Lahir (Column D)
              params.dojang || data[rowIndex - 1][4], // Dojang (Column E)
              params.belt || data[rowIndex - 1][5], // Sabuk (Column F)
              parseFloat(params.weight) || data[rowIndex - 1][6], // Berat Badan (Column G)
              parseFloat(params.height) || data[rowIndex - 1][7], // Tinggi Badan (Column H)
              params.category || data[rowIndex - 1][8], // Kategori (Column I)
              params.class || data[rowIndex - 1][9], // Kelas (Column J)
              data[rowIndex - 1][10], // Keep existing attendance (Column K)
              params.status || data[rowIndex - 1][11], // Status (Column L)
              new Date().toLocaleString('id-ID') // Update timestamp (Column M)
            ]
          ];
          
          // Update the entire row
          sheet.getRange(rowIndex, 1, 1, 13).setValues(updateData);
          
          console.log('Athlete data updated successfully for athlete:', athleteId);
          
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true, 
              message: 'Athlete data updated successfully',
              athleteId: athleteId,
              updatedData: updateData[0]
            }))
            .setMimeType(ContentService.MimeType.JSON);
        } else {
          console.log('Athlete row not found:', athleteId);
          return ContentService
            .createTextOutput(JSON.stringify({
              success: false, 
              message: 'Athlete not found'
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false, 
            message: 'Invalid athlete ID'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
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
            item.isPresent,
            item.status,
            new Date().toLocaleString('id-ID')
          ];
          
          sheet.appendRow(rowData);
          successCount++;
          console.log('Added athlete:', item.nama_lengkap);
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
    
    if (params.action === 'test') {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Google Apps Script bekerja dengan baik'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data
    if (params.action === 'getAllData') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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
      .createTextOutput(JSON.stringify({success: true, message: 'Google Apps Script aktif'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi untuk menginisialisasi semua sheet
function initializeSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet atlets
  let atletsSheet = spreadsheet.getSheetByName('atlets');
  if (!atletsSheet) {
    atletsSheet = spreadsheet.insertSheet('atlets');
    atletsSheet.getRange(1, 1, 1, 13).setValues([[
      'ID Atlet', 'Nama Lengkap', 'Gender', 'Tanggal Lahir', 'Dojang', 
      'Sabuk', 'Berat Badan', 'Tinggi Badan', 'Kategori', 'Kelas', 
      'Hadir', 'Status', 'Waktu Input'
    ]]);
  }
  
  console.log('Sheets initialized successfully');
  return 'Sheets initialized successfully';
}