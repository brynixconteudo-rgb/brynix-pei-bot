// 📁 apps/pei/pei_router.js

const { gerarRespostaNegocios } = require("./pei_ia_negocios");
const { gerarRespostaQualificacao } = require("./pei_qualificacao_leads");

const estados = {
  LIVRE: "livre",
  ESTRUTURADO: "estruturado",
  INDEFINIDO: undefined,
};

const sessoes = {}; // chave: idSessao, valor: objeto de sessão

async function roteadorPEI(mensagem, idSessao = "sessao_padrao") {
  try {
    // Inicializa sessão se não existir
    if (!sessoes[idSessao]) {
      sessoes[idSessao] = {
        estado: estados.INDEFINIDO,
        historico: [],
        coletado: {},
      };
    }

    const sessao = sessoes[idSessao];

    // Garante estrutura
    if (typeof sessao !== "object" || sessao === null) sessoes[idSessao] = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];
    if (typeof sessao.estado === "undefined") sessao.estado = estados.INDEFINIDO;

    // 🔁 Intercepta "finalizar" ou "encerrar" — em qualquer ponto
    const msg = mensagem.trim().toLowerCase();
    if (msg.includes("finalizar") || msg.includes("encerrar")) {
      delete sessoes[idSessao]; // limpa a sessão atual

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

      if (msg.includes("finalizar") || msg.includes("encerrar")) {
      delete sessoes[idSessao]; // limpa a sessão atual

      const promptMenu = `👋 Olá! Sou a ALICE, sua assistente inteligente. Como posso te ajudar hoje?\n\n` +
        `1️⃣ Quero saber como a IA pode transformar negócios\n\n` +
        `2️⃣ Gostaria de saber mais sobre a BRYNIX e como a IA pode me ajudar\n\n` +
        `3️⃣ Encerrar a conversa`;

      return {
        resposta: promptMenu,
        coleta: {},
      };
    }

      // Reapresenta menu
      const promptMenu = `👋 Olá! Sou a ALICE, sua assistente inteligente. Como posso te ajudar hoje?\n\n` +
        `1️⃣ Quero saber como a IA pode transformar negócios\n\n` +
        `2️⃣ Gostaria de saber mais sobre a BRYNIX e como a IA pode me ajudar\n\n` +
        `3️⃣ Encerrar a conversa`;

      return {
        resposta: promptMenu,
        coleta: sessao.coletado || {},
      };
    }

    // 🚏 Estados ativos
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
