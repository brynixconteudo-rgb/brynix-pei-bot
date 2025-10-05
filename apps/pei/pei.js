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
    // Prepara contexto para IA
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

    // Atualiza os dados coletados na sessão, mas não sobrescreve se já existir
    if (coleta && typeof coleta === "object") {
      for (const [campo, valor] of Object.entries(coleta)) {
        if (valor && (!sessao[campo] || sessao[campo].trim() === "")) {
          sessao[campo] = valor.trim();
        }
      }
    }

    // Atualiza histórico da conversa
    sessao.historico.push({ de: "usuario", texto: mensagem });
    sessao.historico.push({ de: "bot", texto: resposta });

    // Verifica se todos os dados foram coletados
    const camposObrigatorios = ["nome", "empresa", "contato", "desafio", "classificacao"];
    const completo = camposObrigatorios.every(c => sessao[c]);

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

      console.log(`✅ Lead salvo com sucesso na planilha:`, {
        nome: sessao.nome,
        empresa: sessao.empresa,
        contato: sessao.contato,
        desafio: sessao.desafio,
        classificacao: sessao.classificacao
      });

      // Limpa a sessão após salvar
      delete sessions[sessionId];
    } else {
      console.log(`⚠️ Lead incompleto, ainda não salvo (sessionId: ${sessionId})`, {
        coletado: {
          nome: sessao.nome,
          empresa: sessao.empresa,
          contato: sessao.contato,
          desafio: sessao.desafio,
          classificacao: sessao.classificacao
        }
      });
    }

    res.json({ resposta });
  } catch (err) {
    console.error("❌ Erro ao processar mensagem:", err);
    res.status(500).json({ erro: "Erro interno da IA" });
  }
});

module.exports = router;
