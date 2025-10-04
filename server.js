// server.js

const express = require("express");
const bodyParser = require("body-parser");
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

app.listen(PORT, () => {
  console.log(`🚀 BRYNIX PEI BOT rodando na porta ${PORT}`);
});
