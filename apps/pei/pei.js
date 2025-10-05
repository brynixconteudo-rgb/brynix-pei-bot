const express = require("express");
const router = express.Router();
const gerarResposta = require("../../ai");
const { salvarLead } = require("../../sheets");

const sessions = {}; // Armazena dados por sessionId

router.post("/pei/ia", async (req, res) => {
  const { mensagem, sessionId } = req.body;

  if (!mensagem || !sessionId) {
    return res.status(400).json({ erro: "Mensagem ou sessionId ausentes." });
  }

  // Inicia sessão se necessário
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      nome: null,
      empresa: null,
      contato: null,
      desafio: null,
      classificacao: null,
      historico: []
    };
  }

  const sessao = sessions[sessionId];

  try {
    const { resposta, coleta } = await gerarResposta(mensagem, {
      historico: sessao.historico,
      coletado: {
        nome: sessao.nome,
        empresa: sessao.empresa,
        contato: sessao.contato,
        desafio: sessao.desafio,
        classificacao: sessao.classificacao
      }
    });

    // Atualiza campos coletados na sessão
    Object.entries(coleta || {}).forEach(([campo, valor]) => {
      if (valor && !sessao[campo]) {
        sessao[campo] = valor;
      }
    });

    sessao.historico.push({ de: "usuario", texto: mensagem });
    sessao.historico.push({ de: "bot", texto: resposta });

    // Verifica se todos os campos obrigatórios foram preenchidos
    const completo =
      sessao.nome &&
      sessao.empresa &&
      sessao.contato &&
      sessao.desafio &&
      sessao.classificacao;

    if (completo) {
      await salvarLead({
        nome: sessao.nome,
        empresa: sessao.empresa,
        contato: sessao.contato,
        desafio: sessao.desafio,
        classificacao: sessao.classificacao,
        origem: "Chat PEI",
        dataHora: new Date().toISOString()
      });

      console.log(`[✅] Lead salvo com sucesso (sessionId: ${sessionId})`);

      delete sessions[sessionId]; // limpa a sessão para não duplicar
    }

    res.json({ resposta });
  } catch (err) {
    console.error("❌ Erro ao processar mensagem:", err);
    res.status(500).json({ erro: "Erro interno da IA" });
  }
});

module.exports = router;
