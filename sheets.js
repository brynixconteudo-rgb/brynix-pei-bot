async function appendLeadRow(rowValues, sheetName = "Leads") {
  const sheets = getSheetsClient();
  const range = `${sheetName}!A1`;

  try {
    // 🔍 Adiciona log com as abas visíveis
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const sheetNames = metadata.data.sheets.map(s => s.properties.title);
    console.log("📋 Abas visíveis na planilha:", sheetNames);

    // Tenta inserir normalmente
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [rowValues],
      },
    });

    console.log("✅ Lead registrado com sucesso.");
  } catch (err) {
    console.error("❌ Erro ao registrar lead:", err.response?.data || err);
    throw err;
  }
}
