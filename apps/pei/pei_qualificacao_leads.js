// 📁 apps/pei/pei_qualificacao_leads.js

async function gerarRespostaQualificacao(mensagem, sessao = {}) {
  try {
    if (typeof sessao !== "object" || sessao === null) sessao = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];

    sessao.historico.push({ de: "usuario", texto: mensagem });

    // 🧪 Lógica simulada — personalize aqui com sua lógica real de qualificação
    const resposta = "Obrigado pela resposta! Vamos seguir com a próxima pergunta. (Aqui virá a lógica completa)";

    sessao.historico.push({ de: "bot", texto: resposta });

    return {
      resposta,
      coleta: sessao.coletado || {},
    };
  } catch (erro) {
    console.error("❌ Erro em gerarRespostaQualificacao:", erro.message);
    return {
      resposta: "Tivemos um problema técnico. Pode responder de novo, por favor?",
      coleta: sessao.coletado || {},
    };
  }
}

module.exports = { gerarRespostaQualificacao };
