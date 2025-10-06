// 📁 apps/pei/pei_router.js

const { gerarRespostaNegocios } = require("./pei_ia_negocios");
const { gerarRespostaQualificacao } = require("./pei_qualificacao_leads");

// Estados possíveis da conversa
const estados = {
  LIVRE: "livre",
  ESTRUTURADO: "estruturado",
  INDEFINIDO: undefined,
};

// Sessões em memória temporária (resetam ao reiniciar o servidor)
const sessoes = {}; // chave: idSessao, valor: objeto de sessão

async function roteadorPEI(mensagem, idSessao = "sessao_padrao") {
  try {
    // Inicializa a sessão do usuário, se ainda não existir
    if (!sessoes[idSessao]) {
      sessoes[idSessao] = {
        estado: estados.INDEFINIDO,
        historico: [],
        coletado: {},
      };
    }

    const sessao = sessoes[idSessao];

    // Garante que os campos essenciais existam
    if (typeof sessao !== "object" || sessao === null) sessoes[idSessao] = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];
    if (typeof sessao.estado === "undefined") sessao.estado = estados.INDEFINIDO;

    // Etapa 1: Menu inicial
    if (sessao.estado === estados.INDEFINIDO) {
      const escolha = mensagem.trim().toLowerCase();

      if (escolha === "1") {
        sessao.estado = estados.LIVRE;
        return await gerarRespostaNegocios(
          "Legal! 😊 Pode me perguntar qualquer coisa sobre IA ou como ela pode transformar sua empresa.",
          sessao
        );
      }

      if (escolha === "2") {
        sessao.estado = estados.ESTRUTURADO;
        return await gerarRespostaQualificacao(
          "Ótimo! Para que eu possa te apresentar algo relevante, preciso te fazer algumas perguntas rápidas. Pode ser? 😊",
          sessao
        );
      }

      if (escolha === "3") {
        return {
          resposta: "Obrigado por conversar com a BRYNIX! 😊 Se quiser saber mais, é só chamar novamente. Até breve!",
          coleta: sessao.coletado || {},
        };
      }

      // Se não for 1, 2 ou 3, apresenta novamente o menu
      const promptMenu = `Olá! 👋 Bem-vindo à BRYNIX. Posso te ajudar de duas formas:\n\n1️⃣ *Quero bater um papo sobre como a Inteligência Artificial pode transformar minha empresa!*\n\n2️⃣ *Quero saber como a BRYNIX pode me ajudar com soluções reais.*\n\nÉ só responder com "1" ou "2" e seguimos juntos. 😊`;

      return {
        resposta: promptMenu,
        coleta: sessao.coletado || {},
      };
    }

    // Etapa 2: Roteamento conforme estado atual da sessão
    if (sessao.estado === estados.LIVRE) {
      return await gerarRespostaNegocios(mensagem, sessao);
    }

    if (sessao.estado === estados.ESTRUTURADO) {
      return await gerarRespostaQualificacao(mensagem, sessao);
    }

    // Fallback — estado não reconhecido
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
