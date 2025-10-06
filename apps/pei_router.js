// 📁 apps/pei/pei_router.js

const { gerarResposta: gerarLivre } = require("../../pei_free");
const { gerarResposta: gerarEstruturado } = require("../../pei_structured");

// Sessão compartilhada em memória temporária por usuário
const estados = {
  LIVRE: "livre",
  ESTRUTURADO: "estruturado",
  INDEFINIDO: undefined,
};

async function roteadorPEI(mensagem, sessao = {}) {
  try {
    // Inicialização segura da sessão
    if (typeof sessao !== "object" || sessao === null) sessao = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];
    if (typeof sessao.estado === "undefined") sessao.estado = estados.INDEFINIDO;

    // Etapa 1: Se ainda não escolheu rota, apresenta menu
    if (sessao.estado === estados.INDEFINIDO) {
      const escolha = mensagem.trim().toLowerCase();

      if (escolha === "1") {
        sessao.estado = estados.LIVRE;
        return await gerarLivre("Legal! 😊 Pode me perguntar qualquer coisa sobre IA ou como ela pode transformar sua empresa.", sessao);
      }

      if (escolha === "2") {
        sessao.estado = estados.ESTRUTURADO;
        return await gerarEstruturado("Ótimo! Para que eu possa te apresentar algo relevante, preciso te fazer algumas perguntas rápidas. Pode ser? 😊", sessao);
      }

      // Caso não tenha escolhido ainda, oferece o menu
      const promptMenu = `Olá! 👋\nBem-vindo à BRYNIX. Posso te ajudar de duas formas:\n\n1️⃣ Gostaria de bater um papo sobre *como a Inteligência Artificial pode transformar seu negócio*?\n\n2️⃣ Quer saber mais sobre *nossas soluções e como podemos te ajudar na prática*?\n\nÉ só responder com \"1\" ou \"2\" e seguimos por esse caminho. 😊`;

      return {
        resposta: promptMenu,
        coleta: sessao.coletado || {},
      };
    }

    // Etapa 2: Roteia conforme escolha feita
    if (sessao.estado === estados.LIVRE) {
      return await gerarLivre(mensagem, sessao);
    }

    if (sessao.estado === estados.ESTRUTURADO) {
      return await gerarEstruturado(mensagem, sessao);
    }

    // Fallback
    return {
      resposta: "Desculpe, algo deu errado no roteador do PEI. Pode tentar novamente?",
      coleta: sessao.coletado || {},
    };
  } catch (erro) {
    console.error("❌ Erro no roteador PEI:", erro);
    return {
      resposta: "Ops! Tivemos um problema interno. Pode tentar novamente?",
      coleta: sessao.coletado || {},
    };
  }
}

module.exports = { roteadorPEI };
