const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { google } = require("googleapis");
const { gerarResposta } = require("./ai"); // <-- IA aqui

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// ----------- PLANILHA GOOGLE CONFIG -----------

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// ----------- ROTA /pei/test (LEADS → PLANILHA) -----------

app.post("/pei/test", async (req, res) => {
  try {
    const { nome, empresa, contato, porte, desafio, classificacao } = req.body;

    if (!nome || !contato || !desafio) {
      return res.status(400).send("Campos obrigatórios ausentes.");
    }

    const valores = [
      [new Date().toLocaleString("pt-BR"), nome, empresa || "", contato, porte || "", desafio, classificacao || "morno"]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
      range: "Leads!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: valores,
      },
    });

    res.status(200).send("Lead registrado com sucesso.");
  } catch (error) {
    console.error("Erro ao gravar na planilha:", error.message);
    res.status(500).send("Erro ao gravar na planilha.");
  }
});

// ----------- NOVA ROTA /pei/ia (CONVERSA COM IA) -----------

app.post("/pei/ia", async (req, res) => {
  try {
    const pergunta = req.body.pergunta;
    if (!pergunta) {
      return res.status(400).send("Pergunta ausente.");
    }

    const resposta = await gerarResposta(pergunta);
    res.send({ resposta });
  } catch (error) {
    console.error("Erro ao processar pergunta:", error.message);
    res.status(500).send("Erro interno na IA.");
  }
});

// ----------- RAIZ -----------

app.get("/", (req, res) => {
  res.send("🚀 BRYNIX PEI BOT ativo.");
});

// ----------- INICIALIZA -----------

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
