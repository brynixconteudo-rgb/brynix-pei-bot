const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// === VARIÁVEIS DE AMBIENTE NECESSÁRIAS ===
const SHEET_ID = process.env.SHEETS_SPREADSHEET_ID;
const GOOGLE_SA_JSON = process.env.GOOGLE_SA_JSON;
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// === AUTENTICAÇÃO COM SERVICE ACCOUNT ===
function getSheetsClient() {
  const credentials = JSON.parse(GOOGLE_SA_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// === ROTA POST: /pei/test ===
app.post("/pei/test", async (req, res) => {
  try {
    const {
      nome,
      email,
      whatsapp,
      empresa,
      porte,
      desafio,
      classificacao,
      origem = "site",
      tipo_interacao = "conversa_pei",
      utm_source = "",
      utm_medium = "",
      utm_campaign = "",
      request_id = "",
      ip_hash = "",
    } = req.body;

    // Validar dados essenciais
    if (!email || !nome || !empresa || !porte || !desafio) {
      return res.status(400).json({ error: "Dados incompletos." });
    }

    const sheets = getSheetsClient();
    const timestamp = new Date().toISOString();

    const row = [
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
      ip_hash,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Leads!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row],
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erro ao salvar dados no Google Sheets:", err);
    res.status(500).json({ error: "Falha ao registrar os dados." });
  }
});

// === ROTA GET BÁSICA ===
app.get("/", (req, res) => {
  res.send("🧠 BRYNIX PEI BOT up and running.");
});

// === INICIAR SERVIDOR ===
app.listen(PORT, () => {
  console.log(`🚀 BRYNIX PEI BOT rodando na porta ${PORT}`);
});
