// Enhanced Google Apps Script untuk update athlete position dengan queue management
// Tambahkan ke function doPost yang sudah ada

if (params.action === 'updateAthletePosition') {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let groupListSheet = spreadsheet.getSheetByName('daftar_kelompok');
  
  if (!groupListSheet) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Group list sheet not found'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const athleteId = parseInt(params.athleteId);
  const position = params.position; // 'red', 'blue', 'queue', 'winner'
  const queueOrder = parseInt(params.queueOrder) || 0;
  
  if (athleteId && position) {
    const data = groupListSheet.getDataRange().getValues();
    
    // Find athlete by matching athleteId (or name fallback)
    for (let i = 1; i < data.length; i++) {
      // Assuming athlete name is in column C (index 2)
      const rowAthleteId = data[i][0]; // id_daftarKelompok
      const rowGroupId = data[i][1]; // id_kelompokAtlet  
      const athleteName = data[i][2]; // nama_atlet
      
      // Match by athlete ID or name (fallback for compatibility)
      if (rowAthleteId == athleteId || athleteName === params.athleteName) {
        // Update position (column H - MB)
        let positionValue = position;
        if (position === 'red') positionValue = 'winner'; // Red corner winner
        else if (position === 'blue') positionValue = 'biru'; // Blue corner
        else if (position === 'queue') positionValue = 'queue'; // Queue
        
        groupListSheet.getRange(i + 1, 8).setValue(positionValue); // Column H (MB)
        
        // Update queue order (column I - Nomor)
        if (queueOrder > 0) {
          groupListSheet.getRange(i + 1, 9).setValue(queueOrder); // Column I (Nomor)
        }
        
        console.log('Athlete position updated:', athleteName, 'to', positionValue, 'order:', queueOrder);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true, 
            message: 'Athlete position updated successfully',
            athleteId: athleteId,
            position: positionValue,
            queueOrder: queueOrder
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Athlete not found in group'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: false, message: 'Invalid athlete or position data'}))
    .setMimeType(ContentService.MimeType.JSON);
}

// Enhanced deleteAllAthletesFromGroup action
if (params.action === 'deleteAllAthletesFromGroup') {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let groupListSheet = spreadsheet.getSheetByName('daftar_kelompok');
  
  if (!groupListSheet) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Group list sheet not found'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const groupId = parseInt(params.groupId);
  
  if (groupId) {
    const data = groupListSheet.getDataRange().getValues();
    let deletedCount = 0;
    
    // Loop dari belakang untuk menghindari masalah index shifting
    for (let i = data.length - 1; i >= 1; i--) {
      // Check if this row matches the groupId (column B)
      if (data[i][1] == groupId) {
        groupListSheet.deleteRow(i + 1);
        deletedCount++;
        console.log('Deleted athlete from group:', groupId, 'row:', i + 1);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: `${deletedCount} athletes removed from group successfully`,
        groupId: groupId,
        deletedCount: deletedCount
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: false, message: 'Invalid group ID'}))
    .setMimeType(ContentService.MimeType.JSON);
}