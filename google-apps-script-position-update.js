// Google Apps Script untuk update posisi atlet di tournament management
// Copy kode ini ke Google Apps Script dan deploy sebagai Web App

function doPost(e) {
  try {
    const params = e.parameter;
    console.log('Received POST params:', JSON.stringify(params));
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // ============ UPDATE ATHLETE POSITION IN GROUP ============
    if (params.action === 'updateAthleteInGroup') {
      const groupAthleteSheet = spreadsheet.getSheetByName('daftar_kelompok');
      
      if (!groupAthleteSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'daftar_kelompok sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = params.id;
      const position = params.position; // 'merah', 'biru', atau 'antri'
      const queueOrder = params.queueOrder;
      const hasMedal = params.hasMedal;
      
      if (id) {
        const data = groupAthleteSheet.getDataRange().getValues();
        console.log(`Looking for athlete with ID: ${id}`);
        
        // Find the row with matching id_daftarKelompok (column A)
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] && data[i][0].toString() === id.toString()) {
            console.log(`Found athlete at row ${i + 1}, updating position to: ${position}`);
            
            // Update M/B column (column G, index 6)
            if (position) {
              groupAthleteSheet.getRange(i + 1, 7).setValue(position); // Column G: M/B
            }
            
            // Update queue order (column H, index 7) - Nomor
            if (queueOrder) {
              groupAthleteSheet.getRange(i + 1, 8).setValue(parseInt(queueOrder)); // Column H: Nomor
            }
            
            // Update medal status (column J, index 9) - Mendali
            if (hasMedal !== undefined) {
              const medalValue = hasMedal === 'true' ? 'TRUE' : 'FALSE';
              groupAthleteSheet.getRange(i + 1, 10).setValue(medalValue); // Column J: Mendali
            }
            
            console.log(`Successfully updated athlete position: ID=${id}, Position=${position}, QueueOrder=${queueOrder}, Medal=${hasMedal}`);
            
            return ContentService
              .createTextOutput(JSON.stringify({
                success: true, 
                message: 'Athlete position updated successfully',
                id: id,
                position: position,
                queueOrder: queueOrder,
                hasMedal: hasMedal
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: `Athlete with ID ${id} not found`}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete ID'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ============ ADD ATHLETE TO GROUP ============
    if (params.action === 'addAthleteToGroup') {
      const groupAthleteSheet = spreadsheet.getSheetByName('daftar_kelompok');
      
      if (!groupAthleteSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'daftar_kelompok sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const id = params.id;
      const groupId = params.groupId;
      const athleteName = params.athleteName;
      const weight = params.weight || '';
      const height = params.height || '';
      const belt = params.belt || '';
      const age = params.age || '';
      const position = params.position || 'antri'; // Default to 'antri' if no position
      const queueOrder = params.queueOrder || '1';
      const hasMedal = params.hasMedal === 'true' ? 'FALSE' : 'FALSE'; // Default to FALSE
      
      if (id && groupId && athleteName) {
        // Check if athlete already exists
        const data = groupAthleteSheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] && data[i][0].toString() === id.toString()) {
            console.log(`Athlete ${athleteName} already exists in group, updating position to: ${position}`);
            
            // Update existing athlete position
            groupAthleteSheet.getRange(i + 1, 7).setValue(position); // Column G: M/B
            groupAthleteSheet.getRange(i + 1, 8).setValue(parseInt(queueOrder)); // Column H: Nomor
            
            return ContentService
              .createTextOutput(JSON.stringify({
                success: true, 
                message: 'Athlete position updated successfully',
                id: id,
                position: position
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        // Add new athlete to group
        console.log(`Adding new athlete ${athleteName} to group ${groupId} with position: ${position}`);
        
        groupAthleteSheet.appendRow([
          id,                    // A: id_daftarKelompok
          groupId,              // B: id_kelompokAtlet  
          athleteName,          // C: nama_atlet
          weight,               // D: Berat_badan
          height,               // E: Tinggi_badan
          belt,                 // F: sabuk
          position,             // G: M/B
          parseInt(queueOrder), // H: Nomor
          age,                  // I: umur
          hasMedal,             // J: Mendali
          'FALSE'               // K: Juara (default FALSE)
        ]);
        
        console.log(`Successfully added athlete ${athleteName} to group ${groupId}`);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true, 
            message: 'Athlete added to group successfully',
            id: id,
            athleteName: athleteName,
            position: position
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete data for group addition'}))
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
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Tournament Position Update API is working',
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

// Helper function to test the script
function testUpdatePosition() {
  const testParams = {
    parameter: {
      action: 'updateAthleteInGroup',
      id: '1',
      position: 'merah',
      queueOrder: '0',
      hasMedal: 'false'
    }
  };
  
  const result = doPost(testParams);
  console.log('Test result:', result.getContent());
}