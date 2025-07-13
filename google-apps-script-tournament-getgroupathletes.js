// Updated Google Apps Script untuk mengambil group athletes dengan filter group ID
// Copy function ini ke dalam script yang sudah ada

function doGet(e) {
  try {
    const params = e.parameter;
    console.log('Received GET params:', JSON.stringify(params));

    if (params.action === 'getGroupAthletes') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let groupListSheet = spreadsheet.getSheetByName('daftar_kelompok');
      
      if (!groupListSheet) {
        console.log('daftar_kelompok sheet not found');
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      try {
        const data = groupListSheet.getDataRange().getValues();
        console.log('Total rows in daftar_kelompok:', data.length);
        
        // Filter by groupId if provided
        const groupId = params.groupId;
        let filteredData = data;
        
        if (groupId) {
          console.log('Filtering by groupId:', groupId);
          // Skip header row (index 0), then filter by column B (id_kelompokAtlet)
          filteredData = [data[0]]; // Keep header
          for (let i = 1; i < data.length; i++) {
            if (data[i][1] && data[i][1].toString() === groupId.toString()) {
              filteredData.push(data[i]);
            }
          }
          console.log('Filtered rows for group', groupId, ':', filteredData.length - 1);
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, data: filteredData}))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (error) {
        console.error('Error getting group athletes:', error);
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Error retrieving group athletes: ' + error.toString()}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Add other doGet actions here...
    
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