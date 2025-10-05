const express = require("express");
const router = express.Router();
const gerarResposta = require("../../ai");
const { salvarLead } = require("../../sheets");

const sessions = {}; // Armazena dados por sessionId

router.post("/pei", async (req, res) => {
  const { mensagem, sessionId } = req.body;

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
  sessao.historico.push({ de: "usuario", texto: mensagem });

  // Prepara coleta já existente para passar à IA
  const coletaExistente = {
    nome: sessao.nome,
    empresa: sessao.empresa,
    contato: sessao.contato,
    desafio: sessao.desafio,
    classificacao: sessao.classificacao
  };

  // Envia a mensagem com histórico + dados coletados
  const { resposta, coleta } = await gerarResposta(mensagem, {
    historico: sessao.historico,
    coleta: coletaExistente
  });

  // Atualiza campos coletados, mas só se ainda não existirem
  Object.entries(coleta || {}).forEach(([campo, valor]) => {
    if (valor && !sessao[campo]) {
      sessao[campo] = valor;
    }
  });

  sessao.historico.push({ de: "bot", texto: resposta });

  // Verifica se todos os dados foram coletados
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
    delete sessions[sessionId]; // Limpa após salvar
  }

  res.json({ resposta });
});

module.exports = router;
