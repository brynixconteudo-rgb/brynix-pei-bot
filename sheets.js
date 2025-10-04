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
  "utm_medium",const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function registrarLead({ nome, empresa, contato, porte, desafio, classificacao }) {
  const valores = [
    [new Date().toLocaleString("pt-BR"), nome, empresa || "", contato, porte || "", desafio, classificacao || "morno"]
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
      range: "Leads!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: valores,
      },
    });
    return true;
  } catch (error) {
    console.error("Erro ao gravar na planilha:", error.message);
    return false;
  }
}

module.exports = { registrarLead };
