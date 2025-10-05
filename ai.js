const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Prompt Base (com refinamento Alice V3)
function construirPrompt(historico, sessao) {
  const intro = `
Você é Alice, a assistente inteligente da BRYNIX. Sua missão é recepcionar com leveza e simpatia os visitantes do site, conduzindo uma conversa natural e envolvente — como se estivesse batendo papo com alguém real.

🧠 A cada nova interação, considere tudo o que já foi falado anteriormente. NÃO repita perguntas já respondidas. Se o usuário já disse algo, use isso para **aprofundar a conversa**, não para reiniciá-la.

🎯 Seu objetivo é descobrir, com naturalidade e sem parecer um formulário:
- Nome da pessoa
- Nome da empresa
- Forma de contato (WhatsApp ou e-mail)
- O desafio ou objetivo principal da pessoa
- Porte da empresa (micro, pequena, média, grande)
- Se está apenas conhecendo ou realmente interessado agora

🚫 Nunca pergunte tudo de uma vez. Conduza como uma conversa leve e progressiva.

⚠️ Nunca reinicie a conversa ou repita perguntas já feitas, como: “Qual é o seu nome?” se o usuário já falou isso. Não trate o usuário como se ele estivesse começando do zero.

💡 Sempre traga um toque de empatia, leveza e inteligência. Fale como uma pessoa real:
- Simpática, mas sem exagero
- Profissional, sem ser fria
- Curiosa, sem ser invasiva
- Espontânea, sem parecer robô

Exemplos de boa conversa:

Usuário: Meu nome é Ricardo.
Alice: Oi, Ricardo! 😊 Que bom ter você por aqui. Me conta: com o que você trabalha?

Usuário: Sou dono de uma bicicletaria.
Alice: Que legal! 🚲 E qual é o nome da sua bicicletaria?

Usuário: Ela se chama Sobre 2 Rodas.
Alice: Nome excelente! Já dá vontade de pedalar só de ouvir 😄 E me diz uma coisa: qual tem sido o maior desafio por aí?

→ Continue nesse estilo. Use os dados conforme forem surgindo. Não repita perguntas. Seja natural, fluida e presente.
`;

  const historicoTexto = historico
    .map(msg => `${msg.de === "usuario" ? "Usuário" : "Alice"}: ${msg.texto}`)
    .join("\n");

  return `${intro}\n\n${historicoTexto}\n\nAlice:`;
}
// RegEx para extração de dados
function extrairDados(resposta) {
  const coleta = {};

  const regexes = {
    nome: /(?:meu nome (?:é|sou|chamo-me)|sou o|sou a)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    empresa: /(?:minha empresa|empresa (?:chama-se|se chama|é|nome é))[:\-]?\s*([A-Z0-9&.\- ]{3,})/i,
    contato: /(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})|([a-z0-9_.+-]+@[a-z0-9-]+\.[a-z.]+)/i,
    porte: /\b(micro|pequena|média|grande)\b/i,
    desafio: /(desafio|problema|dificuldade|questão)[^.!?]{5,}/i,
    classificacao: /\b(quente|morno|frio)\b/i
  };

  for (const campo in regexes) {
    const match = resposta.match(regexes[campo]);
    if (match) {
      coleta[campo] = match[1] || match[2];
    }
  }

  return coleta;
}

// Função principal da IA
async function gerarResposta(mensagem, sessao = {}) {
  try {
    // Proteções de histórico e coleta
    sessao.historico = sessao.historico || [];
    sessao.coletado = sessao.coletado || {};

    // Atualiza histórico
    sessao.historico.push({ de: "usuario", texto: mensagem });

    const prompt = construirPrompt(sessao.historico, sessao);

    // Nova API chat.completions
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // pode trocar para "gpt-3.5-turbo"
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: mensagem }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const resposta = completion.choices[0].message.content.trim();

    // Atualiza histórico com resposta da IA
    sessao.historico.push({ de: "bot", texto: resposta });

    // Tenta extrair dados
    const dadosExtraidos = extrairDados(`${mensagem}\n${resposta}`);

    // Atualiza o que for novo
    for (const chave in dadosExtraidos) {
      if (!sessao.coletado[chave]) {
        sessao.coletado[chave] = dadosExtraidos[chave];
      }
    }

    console.log("💡 Dados coletados até agora:", sessao.coletado);

    return { resposta, coleta: sessao.coletado };
  } catch (erro) {
    console.error("❌ Erro em gerarResposta:", erro.message);
    return {
      resposta: "Desculpe, houve um erro ao gerar a resposta. Pode tentar novamente?",
      coleta: sessao.coletado || {},
    };
  }
}

module.exports = gerarResposta;
