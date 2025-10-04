const { google } = require("googleapis");
const { JWT } = require("google-auth-library");

const sheets = google.sheets("v4");

// Autenticação via Service Account
const auth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// ID da planilha e nome da aba
const SPREADSHEET_ID = process.env.SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Leads";

// Cabeçalhos esperados na planilha
const HEADERS = [
  "nome",
  "email",
  "whatsapp",
  "empresa",
  "porte",
  "desafio",
  "classificacao",
  "origem",
  "tipo_interacao",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "request_id",
  "ip_hash",
  "data_hora",
];

// Função para adicionar um novo lead
async function appendLead(data) {
  const now = new Date().toISOString();

  const values = [
    HEADERS.map((header) =>
      header === "data_hora" ? now : data[header] || ""
    ),
  ];

  await sheets.spreadsheets.values.append({
    auth,
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values,
    },
  });
}

// Função de log (opcional)
async function appendLog(msg) {
  const now = new Date().toISOString();
  await sheets.spreadsheets.values.append({
    auth,
    spreadsheetId: SPREADSHEET_ID,
    range: "Logs!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[now, msg]],
    },
  });
}

module.exports = {
  appendLead,
  appendLog,
};
