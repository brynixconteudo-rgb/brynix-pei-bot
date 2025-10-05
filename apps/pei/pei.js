// 📁 apps/pei/pei.js

const express = require("express");
const router = express.Router();
const gerarResposta = require("../../ai");
const { salvarLead, registrarLog } = require("../../sheets");

const sessions = {}; // Armazena dados por sessionId

// (Opcional) Timer para limpar sessões inativas depois de 30 min
// setInterval(() => {
//   const agora = Date.now();
//   for (const id in sessions) {
//     if (agora - sessions[id].ultimaInteracao > 1000 * 60 * 30) {
//       delete sessions[id];
//     }
//   }
// }, 1000 * 60 * 30);

router.post("/pei/ia", async (req, res) => {
  const { mensagem, sessionId } = req.body;

  if (!mensagem || !sessionId) {
    return res.status(400).json({ erro: "Mensagem ou sessionId ausentes." });
  }

  // Cria a sessão se não existir
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      nome: null,
      empresa: null,
      contato: null,
      desafio: null,
      classificacao: null,
      historico: [],
      criadoEm: new Date(),
      ultimaInteracao: Date.now(),
      salvo: false
    };
  }

  const sessao = sessions[sessionId];
  sessao.ultimaInteracao = Date.now();

  try {
    const contexto = {
      historico: sessao.historico,
      coletado: {
        nome: sessao.nome,
        empresa: sessao.empresa,
        contato: sessao.contato,
        desafio: sessao.desafio,
        classificacao: sessao.classificacao
      }
    };

    const { resposta, coleta } = await gerarResposta(mensagem, contexto);

    // Atualiza os dados coletados, mas não sobrescreve os já existentes
    if (coleta && typeof coleta === "object") {
      for (const [campo, valor] of Object.entries(coleta)) {
        if (valor && (!sessao[campo] || sessao[campo].trim() === "")) {
          sessao[campo] = valor.trim();
        }
      }
    }

    // Atualiza histórico de conversa
    sessao.historico.push({ de: "usuario", texto: mensagem });
    sessao.historico.push({ de: "bot", texto: resposta });

    // Log de interação
    await registrarLog("Chat PEI", "Mensagem recebida", "OK", mensagem);

    const camposObrigatorios = ["nome", "empresa", "contato", "desafio", "classificacao"];
    const completo = camposObrigatorios.every(c => sessao[c]);

    if (completo && !sessao.salvo) {
      // Grava na planilha
      await salvarLead({
        nome: sessao.nome,
        empresa: sessao.empresa,
        contato: sessao.contato,
        desafio: sessao.desafio,
        classificacao: sessao.classificacao,
        origem: "Chat PEI",
        dataHora: new Date().toISOString()
      });

      await registrarLog("Chat PEI", "Lead Completo", "OK", JSON.stringify(sessao));

      sessao.salvo = true; // ✅ Evita gravações duplicadas
      console.log(`✅ Lead salvo com sucesso:`, {
        nome: sessao.nome,
        empresa: sessao.empresa,
        contato: sessao.contato,
        desafio: sessao.desafio,
        classificacao: sessao.classificacao
      });

      // (Opcional) Não precisa deletar imediatamente
      // delete sessions[sessionId];
    } else {
      await registrarLog("Chat PEI", "Lead Incompleto", "Parcial", JSON.stringify(sessao));
      console.log(`⚠️ Lead incompleto (sessionId: ${sessionId})`);
    }

    res.json({ resposta });
  } catch (err) {
    console.error("❌ Erro ao processar mensagem:", err);
    await registrarLog("Chat PEI", "Erro IA", "Erro", err.message);
    res.status(500).json({ erro: "Erro interno da IA" });
  }
});

module.exports = router;
