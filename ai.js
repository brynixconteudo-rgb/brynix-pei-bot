const { OpenAI } = require("openai");

// Criação da instância do OpenAI com a API key via env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define prompt base de boas-vindas e coleta
function construirPrompt(historico, sessao) {
  const intro = `
Você é Alice, uma assistente inteligente e simpática da BRYNIX.
Sua função é recepcionar de forma fluida os visitantes do site, conversar naturalmente e registrar as informações que surgirem durante o papo.

Sempre que possível, extraia os seguintes dados de forma natural:
- nome da pessoa
- nome da empresa
- forma de contato (whatsapp ou e-mail)
- principal desafio ou dúvida
- porte da empresa (micro, pequena, média, grande)
- classificação do interesse (quente, morno, frio)

Nunca pergunte tudo de uma vez. Vá perguntando naturalmente, como em uma conversa real.

Caso a pessoa já tenha falado o nome ou desafio, não peça novamente. Lembre-se da conversa anterior.
Identifique-se como Alice da BRYNIX apenas na primeira fala. Evite repetir isso a cada mensagem.

Seja simpática, prestativa, e encante o visitante sem parecer robótica.
`;

  const historicoTexto = historico
    .map(msg => `${msg.de === "usuario" ? "Usuário" : "Alice"}: ${msg.texto}`)
    .join("\n");

  return `${intro}\n\n${historicoTexto}\n\nAlice:`;
}

// Analisa a resposta da IA e tenta extrair dados úteis
function extrairDados(resposta) {
  const coleta = {};

  const regexes = {
    nome: /(?:meu nome (?:é|chama-se|é o|sou o|sou a)|sou)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)?)/i,
    empresa: /(?:empresa (?:se chama|é|chama-se|seu nome é)?\s*[:\-]?\s*)([A-Z0-9&.\- ]{3,})/i,
    contato: /(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})|([a-z0-9_.+-]+@[a-z0-9-]+\.[a-z.]+)/i,
    porte: /\b(micro|pequena|média|grande)\b/i,
    desafio: /(desafio|problema|dificuldade|questão)[^.!?]{5,}/i,
    classificacao: /\b(quente|morno|frio)\b/i,
  };

  for (const campo in regexes) {
    const match = resposta.match(regexes[campo]);
    if (match) {
      coleta[campo] = match[1] || match[2];
    }
  }

  return coleta;
}

// Função principal exportada
async function gerarResposta(mensagem, sessao = {}) {
  try {
    // Proteção para o histórico
    sessao.historico = sessao.historico || [];
    sessao.historico.push({ de: "usuario", texto: mensagem });

    const prompt = construirPrompt(sessao.historico, sessao);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const resposta = completion.choices[0].message.content.trim();

    // Salva resposta no histórico
    sessao.historico.push({ de: "bot", texto: resposta });

    // Tenta coletar dados
    const coleta = extrairDados(`${mensagem}\n${resposta}`);

    return { resposta, coleta };
  } catch (erro) {
    console.error("Erro em gerarResposta:", erro.message);
    return {
      resposta: "Desculpe, houve um erro ao gerar a resposta. Pode tentar novamente?",
      coleta: {},
    };
  }
}

module.exports = gerarResposta;
