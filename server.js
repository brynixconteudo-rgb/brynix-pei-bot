const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Servir arquivos da pasta public

// Autenticação com Google Sheets via Service Account
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// ID da planilha e nome da aba
const SPREADSHEET_ID = process.env.SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Leads";

// Cabeçalhos da planilha (esperados na ordem correta)
const HEADERS = [
  "data_hora",
  "nome",
  "email",
  "whatsapp",
  "empresa",
  "porte",
  "desafio",
  "classificacao"
];

// Endpoint para registrar lead
app.post("/pei/test", async (req, res) => {
  const { nome, email, whatsapp, empresa, porte, desafio, classificacao } = req.body;

  const novaLinha = [
    new Date().toLocaleString("pt-BR"),
    nome,
    email,
    whatsapp,
    empresa,
    porte,
    desafio,
    classificacao || "morno"
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [novaLinha],
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar lead:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota opcional para exibir o formulário por /formulario
app.get("/formulario", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "formulario.html"));
});

// Rota raiz opcional (status simples)
app.get("/", (req, res) => {
  res.send("BRYNIX PEI BOT online ✨");
});

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
