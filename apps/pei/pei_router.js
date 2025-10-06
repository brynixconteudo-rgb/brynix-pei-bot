// 📁 apps/pei/pei_router.js

const { gerarRespostaNegocios } = require("./pei_ia_negocios");
const { gerarRespostaQualificacao } = require("./pei_qualificacao_leads");
const { salvarLeadPEI, registrarLogPEI } = require("../../sheets");

// Estados possíveis da conversa
const estados = {
  LIVRE: "livre",
  ESTRUTURADO: "estruturado",
  INDEFINIDO: undefined,
};

// Sessões em memória temporária (resetam ao reiniciar o servidor)
const sessoes = {}; // chave: idSessao, valor: objeto de sessão

async function roteadorPEI(mensagem, idSessao = "sessao_padrao", request_id = null, ip_hash = null) {
  try {
    // Geração de request_id e hash se ausentes
    const idFinal = idSessao || `sessao_${Date.now()}`;
    const requestIdFinal = request_id || `req_${Date.now()}`;
    const ipHashFinal = ip_hash || `ip_${Math.random().toString(36).substring(2, 8)}`;

    // Inicializa a sessão do usuário, se ainda não existir
    if (!sessoes[idFinal]) {
      sessoes[idFinal] = {
        estado: estados.INDEFINIDO,
        historico: [],
        coletado: {},
        request_id: requestIdFinal,
        ip_hash: ipHashFinal,
      };
    }

    const sessao = sessoes[idFinal];

    // Garante campos essenciais
    if (!Array.isArray(sessao.historico)) sessao.historico = [];
    if (typeof sessao.estado === "undefined") sessao.estado = estados.INDEFINIDO;
    if (!sessao.coletado) sessao.coletado = {};
    if (!sessao.request_id) sessao.request_id = requestIdFinal;
    if (!sessao.ip_hash) sessao.ip_hash = ipHashFinal;

    // LOG: Antes da resposta
    await registrarLogPEI({
      tipo: "pergunta",
      mensagem,
      estado: sessao.estado,
      request_id: sessao.request_id,
      ip_hash: sessao.ip_hash,
      coleta: JSON.stringify(sessao.coletado || {}),
    });

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
        // Finalização da sessão — salva o lead e encerra
        await salvarLeadPEI(sessao.coletado, sessao.request_id, sessao.ip_hash);

        return {
          resposta: "Obrigado por conversar com a BRYNIX! 😊 Se quiser saber mais, é só chamar novamente. Até breve!",
          coleta: sessao.coletado || {},
        };
      }

      // Resposta padrão ao não entender
      const promptMenu = `Olá! 👋 Bem-vindo à BRYNIX. Posso te ajudar de duas formas:\n\n1️⃣ *Quero bater um papo sobre como a Inteligência Artificial pode transformar minha empresa!*\n\n2️⃣ *Quero saber como a BRYNIX pode me ajudar com soluções reais.*\n\nÉ só responder com "1" ou "2" e seguimos juntos. 😊`;

      return {
        resposta: promptMenu,
        coleta: sessao.coletado || {},
      };
    }

    // Etapa 2: Roteamento conforme estado
    if (sessao.estado === estados.LIVRE) {
      return await gerarRespostaNegocios(mensagem, sessao);
    }

    if (sessao.estado === estados.ESTRUTURADO) {
      const resposta = await gerarRespostaQualificacao(mensagem, sessao);

      // Verifica se terminou a coleta
      if (resposta.finalizar === true) {
        await salvarLeadPEI(sessao.coletado, sessao.request_id, sessao.ip_hash);
      }

      return resposta;
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
