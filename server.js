const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { appendLead, appendLog } = require("./sheets");

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(bodyParser.json());

// === ROTA PARA SERVIR FORMULÁRIO HTML ===
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

// Rota de debug opcional
app.get("/pei/healthz", (req, res) => {
  res.send("✅ BRYNIX PEI BOT ativo.");
});

// Rota para receber leads
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

    // Validação mínima
    if (!email || !nome || !empresa || !porte || !desafio) {
      return res.status(400).json({ error: "Dados incompletos." });
    }

    const leadData = {
      nome,
      email,
      whatsapp,
      empresa,
      porte,
      desafio,
      classificacao,
      origem,
      tipo_interacao,
      utm_source,
      utm_medium,
      utm_campaign,
      request_id,
      ip_hash,
    };

    await appendLead(leadData);
    await appendLog(`Lead registrado: ${nome} (${email})`);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erro ao salvar dados:", err);
    res.status(500).json({ error: "Falha ao registrar os dados." });
  }
});

// Rota raiz
app.get("/", (req, res) => {
  res.send("🧠 BRYNIX PEI BOT up and running.");
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 BRYNIX PEI BOT rodando na porta ${PORT}`);
});
