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

  // Envia a mensagem para a IA com histórico e dados atuais
  const { resposta, coleta } = await gerarResposta(mensagem, sessao);

  // Atualiza dados coletados, se houver
  Object.entries(coleta || {}).forEach(([campo, valor]) => {
    if (valor && !sessao[campo]) {
      sessao[campo] = valor;
    }
  });

  sessao.historico.push({ de: "bot", texto: resposta });

  // Verifica se todos os campos foram preenchidos
  const completo = sessao.nome && sessao.empresa && sessao.contato && sessao.desafio && sessao.classificacao;

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
    delete sessions[sessionId]; // Limpa sessão após salvar
  }

  res.json({ resposta });
});

module.exports = router;
