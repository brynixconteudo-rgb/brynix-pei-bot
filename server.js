// server.js

const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const { appendLeadRow } = require("./sheets");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("BRYNIX PEI BOT UP ✅");
});

app.get("/pei/test", async (req, res) => {
  try {
    const testRow = [
      new Date().toISOString(),
      "Lead de Teste",
      "teste@brynix.ai",
      "Empresa Teste",
      "Pequena",
      "Quer entender como usar IA nos processos de vendas",
      "Morno",
      "Teste automático",
      new Date().toLocaleString(),
      "Render Test"
    ];

    await appendLeadRow(testRow);
    res.status(200).json({ success: true, message: "Lead de teste enviado para a planilha!" });
  } catch (error) {
    console.error("Erro na rota /pei/test:", error);
    res.status(500).json({ success: false, error: error.message || "Erro desconhecido" });
  }
});

// NOVA ROTA DE DEBUG
app.get("/pei/debug-sheets", async (req, res) => {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );

    auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });

    const sheets = google.sheets({ version: "v4", auth });
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
    });

    const sheetNames = metadata.data.sheets.map(s => s.properties.title);
    console.log("📋 Abas visíveis pela API:", sheetNames);

    res.status(200).json({ sheets: sheetNames });
  } catch (error) {
    console.error("Erro ao buscar abas:", error.response?.data || error.message);
    res.status(500).json({ error: error.message || "Erro desconhecido" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 BRYNIX PEI BOT rodando na porta ${PORT}`);
});
