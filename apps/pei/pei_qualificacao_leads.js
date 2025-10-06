// 📁 apps/pei/pei_qualificacao_leads.js

async function gerarRespostaQualificacao(mensagem, sessao = {}) {
  try {
    if (typeof sessao !== "object" || sessao === null) sessao = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];
    if (typeof sessao.coletado !== "object" || sessao.coletado === null) {
      sessao.coletado = {};
    }

    // Guarda a mensagem recebida no histórico
    sessao.historico.push({ de: "usuario", texto: mensagem });

    // Etapas de qualificação — você pode adicionar mais abaixo
    if (!sessao.coletado.nome) {
      sessao.coletado.nome = mensagem.trim();
      const resposta = "Ótimo, " + sessao.coletado.nome + "! Qual é o nome da sua empresa?";
      sessao.historico.push({ de: "bot", texto: resposta });
      return { resposta, coleta: sessao.coletado };
    }

    if (!sessao.coletado.empresa) {
      sessao.coletado.empresa = mensagem.trim();
      const resposta = "Perfeito. De qual setor ou segmento é sua empresa?";
      sessao.historico.push({ de: "bot", texto: resposta });
      return { resposta, coleta: sessao.coletado };
    }

    if (!sessao.coletado.setor) {
      sessao.coletado.setor = mensagem.trim();
      const resposta = "Obrigado. Qual meio de contato você prefere para falarmos? (WhatsApp ou E-mail, e o respectivo dado)";
      sessao.historico.push({ de: "bot", texto: resposta });
      return { resposta, coleta: sessao.coletado };
    }

    if (!sessao.coletado.contato) {
      sessao.coletado.contato = mensagem.trim();
      const resposta = "Última pergunta: Você já conhece ou utiliza alguma solução de IA nos seus processos?";
      sessao.historico.push({ de: "bot", texto: resposta });
      return { resposta, coleta: sessao.coletado };
    }

    if (!sessao.coletado.familiaridadeIA) {
      sessao.coletado.familiaridadeIA = mensagem.trim();
      const resposta = `Maravilha, ${sessao.coletado.nome}! 👍 Seus dados foram registrados com sucesso.\n\nVocê pode visitar nosso site em [https://brynix.ai](https://brynix.ai) enquanto nossa equipe entra em contato com você em breve. Até logo!`;
      sessao.historico.push({ de: "bot", texto: resposta });
      return { resposta, coleta: sessao.coletado };
    }

    // Se tudo foi preenchido, confirma e encerra
    const resposta = "Você já respondeu todas as perguntas. Nossa equipe entrará em contato em breve!";
    return { resposta, coleta: sessao.coletado };

  } catch (erro) {
    console.error("❌ Erro em gerarRespostaQualificacao:", erro.message);
    return {
      resposta: "Tivemos um problema técnico. Pode responder de novo, por favor?",
      coleta: sessao.coletado || {},
    };
  }
}

module.exports = { gerarRespostaQualificacao };
