const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🎯 Prompt base para modo guiado (structured)
const promptBaseGuiado = `
Você é o PEI (Porta de Entrada Inteligente), um assistente de recepção da BRYNIX.

🧠 Sua missão é recepcionar visitantes do site com leveza, inteligência e simpatia — conduzindo uma conversa fluida, humana e profissional.

🎯 Seu objetivo principal é descobrir de forma natural e progressiva (nunca tudo de uma vez):
- Nome da pessoa
- Nome da empresa
- Setor
- Forma de contato (WhatsApp ou e-mail)
- O desafio ou objetivo principal da pessoa
- Porte da empresa (micro, pequena, média, grande)
- Se está apenas conhecendo ou realmente interessado agora

⚠️ Importante:
- Nunca reinicie a conversa.
- Nunca repita perguntas já respondidas.
- Sempre considere tudo que foi dito antes.
- Seja natural, traga variações nas frases e conduza como quem está ouvindo de verdade.

✨ Estilo de fala:
- Profissional, sem ser fria
- Acolhedora, sem parecer robótica
- Curiosa, sem ser invasiva
- Fluida, como um humano real
`;

// 📌 Campos obrigatórios
const camposEsperados = ["nome", "empresa", "setor", "contato", "desafio", "porte", "classificacao"];

// 🔍 Regex inteligente
function extrairDados(texto) {
  const coleta = {};
  const regexes = {
    nome: /(?:meu nome é|me chamo|sou o|sou a|sou)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)?)/i,
    empresa: /(?:minha empresa|empresa (?:chama-se|se chama|é|nome é)|sou (?:da|do|de)\s+(?:loja|empresa)?\s*|trabalho (?:na|no|em)\s+)([A-Z0-9&.\- ]{3,})/i,
    setor: /(?:setor|segmento|atuo no|trabalho com)\s+([a-zà-ú\s]+)/i,
    contato: /(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})|([a-z0-9_.+-]+@[a-z0-9-]+\.[a-z.]+)/i,
    porte: /\b(micro|pequena|média|grande)\b/i,
    desafio: /(?:desafio|problema|dificuldade|questão|objetivo|estou buscando|quero|preciso|gostaria de)[^.!?\n]{10,}/i,
    classificacao: /\b(quente|morno|frio)\b/i,
  };

  for (const campo in regexes) {
    const match = texto.match(regexes[campo]);
    if (match) {
      coleta[campo] = match[1] || match[0];
    }
  }

  return coleta;
}

// 📍 Modo guiado (estruturado)
async function gerarRespostaEstruturada(mensagem, sessao = {}) {
  try {
    if (typeof sessao !== "object") sessao = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];
    if (typeof sessao.coletado !== "object") sessao.coletado = {};

    sessao.historico.push({ de: "usuario", texto: mensagem });

    const pendentes = camposEsperados.filter(campo => !sessao.coletado[campo]);
    let promptExtra = "";

    if (pendentes.length > 0) {
      promptExtra = `Ainda faltam as seguintes informações: ${pendentes.join(", ")}. Conduza de forma natural para obtê-las.`;
    } else {
      promptExtra = "✅ Todos os dados foram coletados. Finalize com simpatia e diga que a BRYNIX entrará em contato.";
    }

    const mensagens = [
      { role: "system", content: `${promptBaseGuiado}\n\n${promptExtra}` },
      ...sessao.historico.map(msg => ({
        role: msg.de === "usuario" ? "user" : "assistant",
        content: msg.texto,
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: mensagens,
      temperature: 0.7,
      max_tokens: 500,
    });

    const resposta = completion.choices[0].message.content.trim();
    sessao.historico.push({ de: "bot", texto: resposta });

    // Análise de coleta
    const historicoCompleto = sessao.historico.map(h => h.texto).join("\n");
    const dadosExtraidos = extrairDados(historicoCompleto);

    for (const chave in dadosExtraidos) {
      if (!sessao.coletado[chave]) {
        sessao.coletado[chave] = dadosExtraidos[chave];
      }
    }

    const completo = camposEsperados.every(c => sessao.coletado[c]);

    if (completo && !sessao.coletado.encerrado) {
      sessao.coletado.encerrado = true;
      const fechamento = `Perfeito! 😊 Com todas essas informações, já posso passar seu contato para nosso time.

A equipe da BRYNIX vai falar com você em breve para entender melhor o seu cenário e te mostrar como nossas soluções de IA podem gerar valor real para o seu negócio.

Obrigado por compartilhar tudo com a gente. Foi ótimo conversar com você! 👋`;

      return {
        resposta: fechamento,
        coleta: sessao.coletado
      };
    }

    return {
      resposta,
      coleta: sessao.coletado,
    };
  } catch (erro) {
    console.error("❌ Erro em gerarRespostaEstruturada:", erro.message);
    return {
      resposta: "Desculpe, houve um erro ao gerar a resposta.",
      coleta: sessao.coletado || {},
    };
  }
}

// 📍 Modo livre (sem coleta)
async function gerarRespostaLivre(mensagem, historico = []) {
  try {
    const mensagens = [
      { role: "system", content: `
Você é o PEI, o assistente de recepção da BRYNIX.

Converse com o visitante de forma fluida, acolhedora e inteligente. Responda dúvidas sobre IA, automação, negócios e a atuação da BRYNIX. Mantenha o foco em ajudar o visitante com sua curiosidade ou interesse, sem se perder em digressões.

Não colete dados pessoais. Seja natural e prestativo.` },
      ...historico.map(msg => ({
        role: msg.de === "usuario" ? "user" : "assistant",
        content: msg.texto,
      })),
      { role: "user", content: mensagem }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: mensagens,
      temperature: 0.7,
      max_tokens: 400,
    });

    return {
      resposta: completion.choices[0].message.content.trim(),
      coleta: {}
    };
  } catch (erro) {
    console.error("❌ Erro em gerarRespostaLivre:", erro.message);
    return {
      resposta: "Desculpe, algo saiu errado. Tente de novo.",
      coleta: {}
    };
  }
}

module.exports = {
  gerarRespostaEstruturada,
  gerarRespostaLivre
};
