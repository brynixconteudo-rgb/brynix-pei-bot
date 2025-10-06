const { gerarRespostaNegocios } = require("./pei_ia_negocios");
const { gerarRespostaQualificacao } = require("./pei_qualificacao_leads");
const { gravarLogPEI } = require("../../sheets"); // ✅ Importa a função de log

const estados = {
  LIVRE: "livre",
  ESTRUTURADO: "estruturado",
  INDEFINIDO: undefined,
};

const sessoes = {};

async function roteadorPEI(mensagem, idSessao = "sessao_padrao") {
  try {
    if (!sessoes[idSessao]) {
      sessoes[idSessao] = {
        estado: estados.INDEFINIDO,
        historico: [],
        coletado: {},
      };
    }

    const sessao = sessoes[idSessao];
    const msg = mensagem.trim().toLowerCase();

    // 🛑 Intercepta comando de finalização
    if (msg.includes("finalizar") || msg.includes("encerrar")) {
      // 1. Salva mensagem no histórico
      sessao.historico.push({ mensagem: msg, system: "Conversa finalizada pelo usuário" });

      // 2. Grava o log da sessão antes de limpar
      await gravarLogPEI(idSessao, sessao);

      // 3. Limpa a sessão
      sessoes[idSessao] = {
        estado: estados.INDEFINIDO,
        historico: [],
        coletado: {},
      };

      // 4. Retorna ao menu principal
      const promptMenu = `👋 Olá! Sou a ALICE, sua assistente inteligente. Como posso te ajudar hoje?\n\n` +
        `1️⃣ Quero saber como a IA pode transformar negócios\n\n` +
        `2️⃣ Gostaria de saber mais sobre a BRYNIX e como a IA pode me ajudar\n\n` +
        `3️⃣ Encerrar a conversa`;

      return {
        resposta: promptMenu,
        coleta: {},
      };
    }

    // 🧭 Menu Inicial
    if (sessao.estado === estados.INDEFINIDO) {
      if (msg === "1") {
        sessao.estado = estados.LIVRE;
        return await gerarRespostaNegocios(
          "Legal! 😊 Pode me perguntar qualquer coisa sobre IA ou como ela pode transformar sua empresa.",
          sessao
        );
      }

      if (msg === "2") {
        sessao.estado = estados.ESTRUTURADO;
        return await gerarRespostaQualificacao(
          "Ótimo! Para que eu possa te apresentar algo relevante, preciso te fazer algumas perguntas rápidas. Pode ser? 😊",
          sessao
        );
      }

      // Reapresenta o menu se digitar algo inválido
      const promptMenu = `👋 Olá! Sou a ALICE, sua assistente inteligente. Como posso te ajudar hoje?\n\n` +
        `1️⃣ Quero saber como a IA pode transformar negócios\n\n` +
        `2️⃣ Gostaria de saber mais sobre a BRYNIX e como a IA pode me ajudar\n\n` +
        `3️⃣ Encerrar a conversa`;

      return {
        resposta: promptMenu,
        coleta: sessao.coletado || {},
      };
    }

    // 🚏 Estados
    if (sessao.estado === estados.LIVRE) {
      return await gerarRespostaNegocios(mensagem, sessao);
    }

    if (sessao.estado === estados.ESTRUTURADO) {
      return await gerarRespostaQualificacao(mensagem, sessao);
    }

    // Fallback
    return {
      resposta: "Desculpe, algo deu errado aqui no PEI. Pode tentar de novo? 🙏",
      coleta: sessao.coletado || {},
    };
  } catch (erro) {
    console.error("❌ Erro no roteador PEI:", erro);
    return {
      resposta: "Ops! Tivemos um problema interno. Pode tentar novamente?",
      coleta: {},
    };
  }
}

module.exports = { roteadorPEI };
