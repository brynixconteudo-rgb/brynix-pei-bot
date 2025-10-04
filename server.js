const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const { appendLead, appendLog } = require("./sheets");
const peiRoutes = require("./apps/pei/pei"); // <-- Importa o pei.js (IA conversacional)

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(bodyParser.json());

// === SERVE HTML FORM (opcional) ===
app.use(express.static(path.join(__dirname, "public")));

// === HEALTH CHECK ===
app.get("/pei/healthz", (req, res) => {
  res.send("✅ BRYNIX PEI BOT ativo.");
});

// === RECEBE LEAD VIA FORMULARIO TESTE ===
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

// === NOVA ROTA CONVERSACIONAL COM IA ===
app.use("/pei", peiRoutes); // Ex: POST para /pei/lead

// === ROTA RAIZ ===
app.get("/", (req, res) => {
  res.send("🧠 BRYNIX PEI BOT up and running.");
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 BRYNIX PEI BOT rodando na porta ${PORT}`);
});
