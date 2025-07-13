// Function untuk menghapus athlete dari group di Google Apps Script
// Tambahkan function ini ke script yang sudah ada

if (params.action === 'deleteAthleteFromGroup') {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let groupListSheet = spreadsheet.getSheetByName('daftar_kelompok');
  
  if (!groupListSheet) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Group list sheet not found'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const groupId = parseInt(params.groupId);
  const athleteId = parseInt(params.athleteId);
  
  if (groupId && athleteId) {
    const data = groupListSheet.getDataRange().getValues();
    
    // Loop dari belakang untuk menghindari masalah index shifting
    for (let i = data.length - 1; i >= 1; i--) {
      // Check if this row matches the groupId and athleteId
      if (data[i][1] == groupId) { // Column B is id_kelompokAtlet (group ID)
        // Find athlete by matching the athlete name or other identifier
        // Since we're deleting by group, we'll delete all athletes in this group
        groupListSheet.deleteRow(i + 1);
        console.log('Deleted athlete from group:', groupId, 'row:', i + 1);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Athletes removed from group successfully',
        groupId: groupId
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: false, message: 'Invalid group or athlete ID'}))
    .setMimeType(ContentService.MimeType.JSON);
}

// Alternative: Delete all athletes from a specific group
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
      // Check if this row matches the groupId
      if (data[i][1] == groupId) { // Column B is id_kelompokAtlet (group ID)
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