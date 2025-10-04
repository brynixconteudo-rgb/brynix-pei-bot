const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const { appendLeadRow } = require("./sheets");
const path = require("path"); // 👈 adicionado

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());

// Middleware para arquivos estáticos
app.use(express.static(path.join(__dirname, "public"))); // 👈 adicionado

// Rota raiz simples
app.get("/", (req, res) => {
  res.send("BRYNIX PEI BOT UP ✅");
});

// Rota de teste para envio de lead
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

// Rota de debug para checar abas da planilha via Service Account
app.get("/pei/debug-sheets", async (req, res) => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
    });

    const sheetNames = metadata.data.sheets.map(s => s.properties.title);
    console.log("📋 Abas visíveis pela Service Account:", sheetNames);

    res.status(200).json({ sheets: sheetNames });
  } catch (error) {
    console.error("Erro ao buscar abas:", error.response?.data || error.message);
    res.status(500).json({ error: error.message || "Erro desconhecido" });
  }
});

// 👇 Rota para página visual do PEI
app.get("/pei", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pei.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 BRYNIX PEI BOT rodando na porta ${PORT}`);
});
