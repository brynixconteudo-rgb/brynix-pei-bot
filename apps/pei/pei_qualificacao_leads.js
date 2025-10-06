// 📁 apps/pei/pei_qualificacao_leads.js

async function gerarRespostaQualificacao(mensagem, sessao = {}) {
  try {
    if (typeof sessao !== "object" || sessao === null) sessao = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];
    if (typeof sessao.coletado !== "object" || sessao.coletado === null) {
      sessao.coletado = {};
    }

    sessao.historico.push({ de: "usuario", texto: mensagem });

    // Sequência de perguntas
    const perguntas = [
      { chave: "nome", texto: "Qual o seu nome, por favor?" },
      { chave: "empresa", texto: "Certo, e qual o nome da sua empresa?" },
      { chave: "setor", texto: "Em qual setor ou segmento sua empresa atua?" },
      { chave: "contato", texto: "Qual meio prefere que entremos em contato? Pode ser e-mail ou WhatsApp, por exemplo." },
      { chave: "familiaridade", texto: "Você já está familiarizado com o uso de IA no seu negócio ou gostaria de entender melhor como ela pode ajudar?" },
    ];

    // Determina próxima pergunta com base no que já foi coletado
    for (const pergunta of perguntas) {
      if (!sessao.coletado[pergunta.chave]) {
        // Armazena a resposta anterior (se for o caso)
        const chaves = perguntas.map(p => p.chave);
        const idx = chaves.indexOf(pergunta.chave);
        if (idx > 0) {
          const chaveAnterior = perguntas[idx - 1].chave;
          sessao.coletado[chaveAnterior] = mensagem;
        }

        const resposta = pergunta.texto;
        sessao.historico.push({ de: "bot", texto: resposta });

        return {
          resposta,
          coleta: sessao.coletado,
        };
      }
    }

    // Última resposta armazenada
    const ultimaChave = perguntas[perguntas.length - 1].chave;
    sessao.coletado[ultimaChave] = mensagem;

    // Resposta final
    const respostaFinal = `Muito obrigado pelas informações, ${sessao.coletado.nome}! 😊 Nossa equipe entrará em contato em breve pelo canal informado. Enquanto isso, sinta-se à vontade para visitar o site da BRYNIX e conhecer mais sobre como aplicamos IA para transformar negócios.`;

    sessao.historico.push({ de: "bot", texto: respostaFinal });

    return {
      resposta: respostaFinal,
      coleta: sessao.coletado,
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
