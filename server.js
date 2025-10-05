const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { gerarResposta } = require("./src/ai");
const { registrarLead } = require("./src/sheets");
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Serve pei.html e formulario.html

// ----------- ROTA DE TESTE DE ENVIO DE LEAD -----------
app.post("/pei/test", async (req, res) => {
  const { nome, empresa, contato, porte, desafio, classificacao } = req.body;

  if (!nome || !contato || !desafio) {
    return res.status(400).send("Campos obrigatórios ausentes.");
  }

  const sucesso = await registrarLead({ nome, empresa, contato, porte, desafio, classificacao });

  if (sucesso) {
    res.send("Lead registrado com sucesso.");
  } else {
    res.status(500).send("Erro ao gravar na planilha.");
  }
});

// ----------- ROTA COM INTEGRAÇÃO À IA (CHAT LIVRE) -----------
app.post("/pei/ia", async (req, res) => {
  const pergunta = req.body.pergunta;
  if (!pergunta) return res.status(400).send("Pergunta ausente.");

  const resposta = await gerarResposta(pergunta);
  res.send({ resposta });
});

// ----------- RAIZ -----------
app.get("/", (req, res) => {
  res.send("🚀 BRYNIX PEI BOT ativo.");
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
