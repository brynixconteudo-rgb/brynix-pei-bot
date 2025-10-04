// sheets.js

const { google } = require("googleapis");

const SHEET_ID = process.env.SHEETS_SPREADSHEET_ID;
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

let sheetsAPI;

function getSheetsClient() {
  if (!sheetsAPI) {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN,
    });

    sheetsAPI = google.sheets({
      version: "v4",
      auth: oauth2Client,
    });
  }

  return sheetsAPI;
}

async function appendLeadRow(rowValues, sheetName = "Leads") {
  const sheets = getSheetsClient();
  const range = `${sheetName}!A1`;

  try {
    // 🔍 LOG: Nomes das abas visíveis na planilha
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const sheetNames = metadata.data.sheets.map(s => s.properties.title);
    console.log("📋 Abas visíveis na planilha:", sheetNames);

    // Envia os dados para a aba
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

module.exports = {
  appendLeadRow,
};
