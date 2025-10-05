const { google } = require("googleapis");

// Autenticação via GoogleAuth (Service Account JSON)
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Cabeçalhos esperados (só referência, não usado diretamente no código)
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
];

// Função para registrar lead na planilha
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
