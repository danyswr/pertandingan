// Google Apps Script yang sudah diperbaiki untuk Spreadsheet Manajemen Tournament
// Copy kode ini ke Google Apps Script dan deploy sebagai Web App

function doPost(e) {
  try {
    const params = e.parameter;
    console.log("Received POST params:", JSON.stringify(params));

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Handle Main Category actions
    if (params.action === "createMainCategory") {
      let sheet = spreadsheet.getSheetByName("Kategori_Utama");
      if (!sheet) {
        sheet = spreadsheet.insertSheet("Kategori_Utama");
        sheet
          .getRange(1, 1, 1, 2)
          .setValues([["id_kategori", "nama_kategori"]]);
      }

      // Use the ID provided by the application
      const categoryId = parseInt(params.id);
      const rowData = [categoryId, params.name];
      sheet.appendRow(rowData);

      console.log(
        "Main category created:",
        params.name,
        "with ID:",
        categoryId,
      );
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Main category created successfully",
          id: categoryId,
          name: params.name,
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle Sub Category actions
    if (params.action === "createSubCategory") {
      let sheet = spreadsheet.getSheetByName("SubKategori");
      if (!sheet) {
        sheet = spreadsheet.insertSheet("SubKategori");
        sheet
          .getRange(1, 1, 1, 4)
          .setValues([
            [
              "id_subkategori",
              "id_kategori_utama",
              "Nomor",
              "judul_subkategori",
            ],
          ]);
      }

      // Use the ID provided by the application
      const subCategoryId = parseInt(params.id);
      const rowData = [
        subCategoryId,
        parseInt(params.mainCategoryId),
        parseInt(params.order),
        params.name,
      ];
      sheet.appendRow(rowData);

      console.log(
        "Sub category created:",
        params.name,
        "with ID:",
        subCategoryId,
      );
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Sub category created successfully",
          id: subCategoryId,
          mainCategoryId: parseInt(params.mainCategoryId),
          order: parseInt(params.order),
          name: params.name,
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle Athlete Group actions
    if (params.action === "createAthleteGroup") {
      let sheet = spreadsheet.getSheetByName("Kelompok_Atlet");
      if (!sheet) {
        sheet = spreadsheet.insertSheet("Kelompok_Atlet");
        sheet
          .getRange(1, 1, 1, 5)
          .setValues([
            ["id_kel", "id_SubKelompok", "Judul", "Nomor", "Keterangan"],
          ]);
      }

      // Use the ID provided by the application
      const groupId = parseInt(params.id);
      const rowData = [
        groupId,
        parseInt(params.subCategoryId),
        params.name,
        1,
        params.description || "",
      ];
      sheet.appendRow(rowData);

      console.log("Athlete group created:", params.name);
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Athlete group created successfully",
          id: nextId,
          subCategoryId: parseInt(params.subCategoryId),
          name: params.name,
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle Group Athletes actions
    if (params.action === "addAthleteToGroup") {
      let sheet = spreadsheet.getSheetByName("daftar_kelompok");
      if (!sheet) {
        sheet = spreadsheet.insertSheet("daftar_kelompok");
        sheet
          .getRange(1, 1, 1, 9)
          .setValues([
            [
              "id_daftarKelompok",
              "id_kelompokAtlet",
              "nama_atlet",
              "Berat_badan",
              "Tinggi_badan",
              "sabuk",
              "umur",
              "MB",
              "Nomor",
            ],
          ]);
      }

      const data = sheet.getDataRange().getValues();
      const nextId = data.length; // Header row is 1, so next ID starts from data.length

      const rowData = [
        nextId,
        parseInt(params.groupId),
        params.athleteName,
        parseFloat(params.weight) || 0,
        parseFloat(params.height) || 0,
        params.belt || "",
        parseInt(params.age) || 0,
        params.position || "",
        parseInt(params.queueOrder) || 1,
      ];
      sheet.appendRow(rowData);

      console.log("Athlete added to group:", params.athleteName);
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Athlete added to group successfully",
          id: nextId,
          groupId: parseInt(params.groupId),
          athleteName: params.athleteName,
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle attendance update for athletes sheet
    const sheet = spreadsheet.getSheetByName("atlets");
    if (params.action === "updateAttendance" && sheet) {
      const athleteId = parseInt(params.athleteId);
      const isPresent = params.isPresent === "true";

      if (athleteId && athleteId > 0) {
        const rowIndex = athleteId + 1; // +1 because row 1 is header, athlete ID 1 is row 2
        const attendanceColumn = 11; // Column K (Hadir)

        const data = sheet.getDataRange().getValues();
        if (data.length > rowIndex - 1) {
          sheet.getRange(rowIndex, attendanceColumn).setValue(isPresent);

          return ContentService.createTextOutput(
            JSON.stringify({
              success: true,
              message: "Attendance updated successfully",
              athleteId: athleteId,
              isPresent: isPresent,
            }),
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Handle other athlete actions (existing functionality)
    if (params.action === "updateAthlete" && sheet) {
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
              new Date().toLocaleString("id-ID"),
            ],
          ];

          sheet.getRange(rowIndex, 1, 1, 13).setValues(updateData);

          return ContentService.createTextOutput(
            JSON.stringify({
              success: true,
              message: "Athlete data updated successfully",
              athleteId: athleteId,
              updatedData: updateData[0],
            }),
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    if (params.action === "addData" && params.rowData && sheet) {
      const rowData = JSON.parse(params.rowData);
      rowData.push(new Date().toLocaleString("id-ID"));
      sheet.appendRow(rowData);

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Data berhasil ditambahkan",
          data: rowData,
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === "createBatch" && params.data && sheet) {
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
            new Date().toLocaleString("id-ID"),
          ];

          sheet.appendRow(rowData);
          successCount++;
        } catch (error) {
          console.error("Error adding athlete:", item.nama_lengkap, error);
        }
      }

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: `Batch transfer berhasil: ${successCount}/${batchData.length} atlet`,
          count: successCount,
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle Delete Main Category
    if (params.action === "deleteMainCategory") {
      const sheet = spreadsheet.getSheetByName("Kategori_Utama");
      if (!sheet) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: "Sheet not found" }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const categoryId = parseInt(params.id);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == categoryId) {
          sheet.deleteRow(i + 1);
          console.log("Main category deleted:", categoryId);
          return ContentService.createTextOutput(
            JSON.stringify({
              success: true,
              message: "Main category deleted successfully",
            }),
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }

      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: "Category not found" }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle Update Main Category
    if (params.action === "updateMainCategory") {
      const sheet = spreadsheet.getSheetByName("Kategori_Utama");
      if (!sheet) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: "Sheet not found" }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const categoryId = parseInt(params.id);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == categoryId) {
          sheet.getRange(i + 1, 2).setValue(params.name);
          console.log("Main category updated:", categoryId, params.name);
          return ContentService.createTextOutput(
            JSON.stringify({
              success: true,
              message: "Main category updated successfully",
            }),
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }

      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: "Category not found" }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: "Action tidak dikenal atau parameter tidak lengkap",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Error in doPost:", error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const params = e.parameter;
    console.log("Received GET params:", JSON.stringify(params));

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (params.action === "test") {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Google Apps Script bekerja dengan baik",
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Get main categories
    if (params.action === "getMainCategories") {
      const sheet = spreadsheet.getSheetByName("Kategori_Utama");
      if (!sheet) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: true, data: [] }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const data = sheet.getDataRange().getValues();
      const categories = data.slice(1).map((row) => ({
        id: row[0],
        name: row[1],
      }));

      return ContentService.createTextOutput(
        JSON.stringify({ success: true, data: categories }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Get sub categories by main category
    if (params.action === "getSubCategories" && params.mainCategoryId) {
      const sheet = spreadsheet.getSheetByName("SubKategori");
      if (!sheet) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: true, data: [] }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const data = sheet.getDataRange().getValues();
      const subCategories = data
        .slice(1)
        .filter((row) => row[1] == params.mainCategoryId)
        .map((row) => ({
          id: row[0],
          mainCategoryId: row[1],
          order: row[2],
          name: row[3],
        }))
        .sort((a, b) => a.order - b.order);

      return ContentService.createTextOutput(
        JSON.stringify({ success: true, data: subCategories }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Get athlete groups by sub category
    if (params.action === "getAthleteGroups" && params.subCategoryId) {
      const sheet = spreadsheet.getSheetByName("Kelompok_Atlet");
      if (!sheet) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: true, data: [] }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const data = sheet.getDataRange().getValues();
      const groups = data
        .slice(1)
        .filter((row) => row[1] == params.subCategoryId)
        .map((row) => ({
          id: row[0],
          subCategoryId: row[1],
          name: row[2],
          order: row[3],
          description: row[4],
        }));

      return ContentService.createTextOutput(
        JSON.stringify({ success: true, data: groups }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Get group athletes
    if (params.action === "getGroupAthletes" && params.groupId) {
      const sheet = spreadsheet.getSheetByName("daftar_kelompok");
      if (!sheet) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: true, data: [] }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const data = sheet.getDataRange().getValues();
      const athletes = data
        .slice(1)
        .filter((row) => row[1] == params.groupId)
        .map((row) => ({
          id: row[0],
          groupId: row[1],
          name: row[2],
          weight: row[3],
          height: row[4],
          belt: row[5],
          age: row[6],
          position: row[7],
          queueOrder: row[8],
        }))
        .sort((a, b) => a.queueOrder - b.queueOrder);

      return ContentService.createTextOutput(
        JSON.stringify({ success: true, data: athletes }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Get all athletes data
    if (params.action === "getAllData") {
      const sheet = spreadsheet.getSheetByName("atlets");
      if (!sheet) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            message: "Sheet atlets tidak ditemukan",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const data = sheet.getDataRange().getValues();
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, data: data }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "Google Apps Script aktif" }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Error in doGet:", error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi untuk menginisialisasi semua sheet
function initializeSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Sheet atlets
  let atletsSheet = spreadsheet.getSheetByName("atlets");
  if (!atletsSheet) {
    atletsSheet = spreadsheet.insertSheet("atlets");
    atletsSheet
      .getRange(1, 1, 1, 13)
      .setValues([
        [
          "ID Atlet",
          "Nama Lengkap",
          "Gender",
          "Tanggal Lahir",
          "Dojang",
          "Sabuk",
          "Berat Badan",
          "Tinggi Badan",
          "Kategori",
          "Kelas",
          "Hadir",
          "Status",
          "Waktu Input",
        ],
      ]);
  }

  // Sheet Kategori_Utama
  let mainCategorySheet = spreadsheet.getSheetByName("Kategori_Utama");
  if (!mainCategorySheet) {
    mainCategorySheet = spreadsheet.insertSheet("Kategori_Utama");
    mainCategorySheet
      .getRange(1, 1, 1, 2)
      .setValues([["id_kategori", "nama_kategori"]]);
  }

  // Sheet SubKategori
  let subCategorySheet = spreadsheet.getSheetByName("SubKategori");
  if (!subCategorySheet) {
    subCategorySheet = spreadsheet.insertSheet("SubKategori");
    subCategorySheet
      .getRange(1, 1, 1, 4)
      .setValues([
        ["id_subkategori", "id_kategori_utama", "Nomor", "judul_subkategori"],
      ]);
  }

  // Sheet Kelompok_Atlet
  let athleteGroupSheet = spreadsheet.getSheetByName("Kelompok_Atlet");
  if (!athleteGroupSheet) {
    athleteGroupSheet = spreadsheet.insertSheet("Kelompok_Atlet");
    athleteGroupSheet
      .getRange(1, 1, 1, 5)
      .setValues([
        ["id_kel", "id_SubKelompok", "Judul", "Nomor", "Keterangan"],
      ]);
  }

  // Sheet daftar_kelompok
  let groupListSheet = spreadsheet.getSheetByName("daftar_kelompok");
  if (!groupListSheet) {
    groupListSheet = spreadsheet.insertSheet("daftar_kelompok");
    groupListSheet
      .getRange(1, 1, 1, 9)
      .setValues([
        [
          "id_daftarKelompok",
          "id_kelompokAtlet",
          "nama_atlet",
          "Berat_badan",
          "Tinggi_badan",
          "sabuk",
          "umur",
          "MB",
          "Nomor",
        ],
      ]);
  }

  console.log("All sheets initialized successfully");
  return "All sheets initialized successfully";
}
