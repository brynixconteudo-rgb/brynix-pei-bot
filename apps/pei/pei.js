const express = require("express");
const router = express.Router();
const gerarResposta = require("../../ai");
const { salvarLead } = require("../../sheets");

const sessions = {}; // Armazena sessões temporárias por sessionId

router.post("/pei/ia", async (req, res) => {
  const { pergunta, sessao: sessaoCliente } = req.body;

  if (!pergunta || !sessaoCliente) {
    return res.status(400).json({ erro: "Pergunta ou sessão ausente." });
  }

  const sessionId = req.ip + "-" + (req.headers["user-agent"] || ""); // fallback simples

  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      nome: null,
      empresa: null,
      contato: null,
      desafio: null,
      classificacao: null,
      historico: [],
    };
  }

  const sessao = sessions[sessionId];

  // Atualiza histórico e dados coletados
  sessao.historico = sessaoCliente.historico || [];
  const coletado = {
    nome: sessaoCliente.coletado?.nome || sessao.nome,
    empresa: sessaoCliente.coletado?.empresa || sessao.empresa,
    contato: sessaoCliente.coletado?.contato || sessao.contato,
    desafio: sessaoCliente.coletado?.desafio || sessao.desafio,
    classificacao: sessaoCliente.coletado?.classificacao || sessao.classificacao,
  };

  try {
    const { resposta, coleta } = await gerarResposta(pergunta, {
      historico: sessao.historico,
      coletado
    });

    // Atualiza os campos coletados com os novos (se houver)
    Object.entries(coleta || {}).forEach(([chave, valor]) => {
      if (valor && !sessao[chave]) {
        sessao[chave] = valor;
      }
    });

    // Atualiza histórico
    sessao.historico.push({ de: "usuario", texto: pergunta });
    sessao.historico.push({ de: "bot", texto: resposta });

    // Verifica se todos os campos estão preenchidos
    const completo = sessao.nome && sessao.empresa && sessao.contato && sessao.desafio && sessao.classificacao;

    if (completo) {
      // Salva na planilha
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

      // Zera a sessão para evitar duplicação
      delete sessions[sessionId];
    }

    // Envia resposta e coleta atualizada
    res.json({
      resposta,
      coleta: {
        nome: sessao.nome,
        empresa: sessao.empresa,
        contato: sessao.contato,
        desafio: sessao.desafio,
        classificacao: sessao.classificacao
      }
    });

  } catch (erro) {
    console.error("Erro ao gerar resposta da IA:", erro);
    res.status(500).json({ erro: "Erro ao gerar resposta da IA" });
  }
});

module.exports = router;
