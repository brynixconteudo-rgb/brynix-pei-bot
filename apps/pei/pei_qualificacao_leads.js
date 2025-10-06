// 📁 apps/pei/pei_qualificacao_leads.js

async function gerarRespostaQualificacao(mensagem, sessao = {}) {
  // Código simplificado de exemplo
  sessao.historico = sessao.historico || [];
  sessao.historico.push({ de: "usuario", texto: mensagem });

  const resposta = "Obrigado pela resposta! Vamos seguir com a próxima pergunta. (Aqui virá a lógica completa)";
  sessao.historico.push({ de: "bot", texto: resposta });

  return {
    resposta,
    coleta: {}, // lógica futura
  };
}

module.exports = { gerarRespostaQualificacao };
