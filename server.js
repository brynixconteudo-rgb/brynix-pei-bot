const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const { registrarLead } = require("./sheets");
const { gerarResposta } = require("./ai");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Endpoint de teste
app.get("/", (req, res) => {
  res.send("BOT PEI VIVO 🚀");
});

// Endpoint de registro de leads
app.post("/pei/test", async (req, res) => {
  const { nome, empresa, contato, porte, desafio, classificacao } = req.body;

  if (!nome || !contato || !desafio) {
    return res.status(400).json({ erro: "Dados obrigatórios ausentes." });
  }

  const sucesso = await registrarLead({ nome, empresa, contato, porte, desafio, classificacao });

  if (sucesso) {
    res.status(200).json({ status: "Lead registrado com sucesso." });
  } else {
    res.status(500).json({ erro: "Erro ao registrar lead." });
  }
});

// Endpoint de conversa com IA
app.post("/pei/ia", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ erro: "Prompt ausente." });
  }

  const resposta = await gerarResposta(prompt);
  res.json({ resposta });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
