// 📁 apps/pei/pei_router.js

const { gerarResposta: gerarLivre } = require("./pei_ia_negocios");
const { gerarResposta: gerarEstruturado } = require("./pei_qualificacao_leads");

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

    // Normaliza mensagem para análise
    const escolha = mensagem.trim().toLowerCase();

    // ✅ A qualquer momento: troca de fluxo
    if (escolha === "1") {
      sessao.estado = estados.LIVRE;
      return await gerarLivre(
        "Legal! 😊 Pode me perguntar qualquer coisa sobre IA ou como ela pode transformar sua empresa.",
        sessao
      );
    }

    if (escolha === "2") {
      sessao.estado = estados.ESTRUTURADO;
      return await gerarEstruturado(
        "Ótimo! Para que eu possa te apresentar algo relevante, preciso te fazer algumas perguntas rápidas. Pode ser? 😊",
        sessao
      );
    }

    // ✅ Encerramento
    if (escolha === "3") {
      return {
        resposta: "Tudo bem! Quando quiser continuar, é só chamar. Até breve! 👋",
        coleta: sessao.coletado || {},
      };
    }

    // Menu inicial se estado indefinido
    if (sessao.estado === estados.INDEFINIDO) {
      const promptMenu = `Olá! 👋 Bem-vindo à BRYNIX. Posso te ajudar de duas formas:\n\n1️⃣ *Quero bater um papo sobre como a Inteligência Artificial pode transformar minha empresa!*\n\n2️⃣ *Quero saber como a BRYNIX pode me ajudar com soluções reais.*\n\nÉ só responder com "1" ou "2" e seguimos juntos. 😊`;
      return {
        resposta: promptMenu,
        coleta: sessao.coletado || {},
      };
    }

    // Roteia a mensagem conforme o estado atual
    if (sessao.estado === estados.LIVRE) {
      return await gerarLivre(mensagem, sessao);
    }

    if (sessao.estado === estados.ESTRUTURADO) {
      return await gerarEstruturado(mensagem, sessao);
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
      coleta: sessao.coletado || {},
    };
  }
}

module.exports = { roteadorPEI };
