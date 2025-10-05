const { google } = require("googleapis");

// Autenticação via GoogleAuth (Service Account JSON)
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Função para registrar lead completo na planilha
async function salvarLead({
  timestamp = new Date().toLocaleString("pt-BR"),
  origem = "Chat PEI",
  nome = "",
  email = "",
  whatsapp = "",
  empresa = "",
  porte = "",
  desafio = "",
  tipo_interacao = "chat",
  classificacao = "morno",
  utm_source = "",
  utm_medium = "",
  utm_campaign = "",
  request_id = "",
  ip_hash = ""
}) {
  const valores = [[
    timestamp,
    origem,
    nome,
    email,
    whatsapp,
    empresa,
    porte,
    desafio,
    tipo_interacao,
    classificacao,
    utm_source,
    utm_medium,
    utm_campaign,
    request_id,
    ip_hash
  ]];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
      range: "Leads!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: valores,
      },
    });
    console.log("✅ Lead salvo com sucesso na planilha.");
    return true;
  } catch (error) {
    console.error("❌ Erro ao gravar na planilha:", error.message);
    return false;
  }
}

module.exports = { salvarLead };
