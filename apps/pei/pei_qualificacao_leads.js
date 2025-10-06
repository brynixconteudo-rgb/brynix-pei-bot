// 📁 apps/pei/pei_qualificacao_leads.js

const { salvarLead } = require("../../sheets");

async function gerarRespostaQualificacao(mensagem, sessao = {}) {
  try {
    if (typeof sessao !== "object" || sessao === null) sessao = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];
    if (typeof sessao.coletado !== "object" || sessao.coletado === null) {
      sessao.coletado = {};
    }

    // Guarda a mensagem recebida no histórico
    sessao.historico.push({ de: "usuario", texto: mensagem });

    // Etapas de qualificação
    if (!sessao.coletado.nome) {
      sessao.coletado.nome = mensagem.trim();
      const resposta = `Ótimo, ${sessao.coletado.nome}! Qual é o nome da sua empresa?`;
      sessao.historico.push({ de: "bot", texto: resposta });
      return { resposta, coleta: sessao.coletado };
    }

    if (!sessao.coletado.empresa) {
      sessao.coletado.empresa = mensagem.trim();
      const resposta = `Perfeito. De qual setor ou segmento é sua empresa?`;
      sessao.historico.push({ de: "bot", texto: resposta });
      return { resposta, coleta: sessao.coletado };
    }

    if (!sessao.coletado.setor) {
      sessao.coletado.setor = mensagem.trim();
      const resposta = `Legal. Qual o seu cargo ou função na empresa?`;
      sessao.historico.push({ de: "bot", texto: resposta });
      return { resposta, coleta: sessao.coletado };
    }

    if (!sessao.coletado.cargo) {
      sessao.coletado.cargo = mensagem.trim();
      const resposta = `Obrigado. Qual meio de contato você prefere para falarmos? (WhatsApp ou E-mail, e o respectivo dado)`;
      sessao.historico.push({ de: "bot", texto: resposta });
      return { resposta, coleta: sessao.coletado };
    }

    if (!sessao.coletado.contato) {
      sessao.coletado.contato = mensagem.trim();
      const resposta = `Última pergunta: Você já conhece ou utiliza alguma solução de IA nos seus processos?`;
      sessao.historico.push({ de: "bot", texto: resposta });
      return { resposta, coleta: sessao.coletado };
    }

    if (!sessao.coletado.familiaridadeIA) {
      sessao.coletado.familiaridadeIA = mensagem.trim();

      // 🔹 Salvar lead na planilha
      try {
        await salvarLead({
          nome: sessao.coletado.nome || "",
          empresa: sessao.coletado.empresa || "",
          porte: sessao.coletado.setor || "",
          desafio: "",
          tipo_interacao: "qualificacao",
          classificacao: "morno",
          whatsapp: sessao.coletado.contato || "",
        });
      } catch (erroSalvar) {
        console.error("⚠️ Erro ao salvar o lead:", erroSalvar.message);
      }

      const resumo =
        `✨ Obrigado, ${sessao.coletado.nome}! Aqui está um resumo das suas informações:\n\n` +
        `• Nome: ${sessao.coletado.nome}\n` +
        `• Empresa: ${sessao.coletado.empresa}\n` +
        `• Setor: ${sessao.coletado.setor}\n` +
        `• Cargo: ${sessao.coletado.cargo}\n` +
        `• Contato: ${sessao.coletado.contato}\n` +
        `• Já usa IA: ${sessao.coletado.familiaridadeIA}\n\n` +
        `Nosso time da BRYNIX entrará em contato com você em breve. Enquanto isso, visite nosso site: https://brynix.ai 🚀`;

      sessao.historico.push({ de: "bot", texto: resumo });

      return { resposta: resumo, coleta: sessao.coletado };
    }

    // Se tudo foi preenchido, evita loops
    const resposta = "Você já respondeu todas as perguntas. Obrigado novamente!";
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
