const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Prompt Base (PEI V1)
function construirPrompt(historico, sessao) {
  const intro = `
Você é o PEI (Porta de Entrada Inteligente), um assistente de recepção da BRYNIX.

🧠 Sua missão é recepcionar visitantes do site com leveza, inteligência e simpatia — conduzindo uma conversa fluida, humana e profissional.

🎯 Seu objetivo principal é descobrir de forma natural e progressiva (nunca tudo de uma vez):
- Nome da pessoa
- Nome da empresa
- Forma de contato (WhatsApp ou e-mail)
- O desafio ou objetivo principal da pessoa
- Porte da empresa (micro, pequena, média, grande)
- Se está apenas conhecendo ou realmente interessado agora

⚠️ Importante:
- **Nunca reinicie a conversa**.
- **Nunca repita perguntas já respondidas**.
- Sempre considere tudo que foi dito antes.
- Seja natural, traga variações nas frases e conduza como quem está ouvindo de verdade.

✨ Estilo de fala:
- Profissional, sem ser fria
- Acolhedora, sem parecer robótica
- Curiosa, sem ser invasiva
- Fluida, como um humano real

Exemplos de abordagem:

Usuário: Olá, sou a Bruna.
PEI: Oi, Bruna! 😊 Que bom ter você por aqui. Me conta: com o que você trabalha?

Usuário: Tenho um restaurante.
PEI: Que delícia! 🍽️ E como se chama seu restaurante?

Usuário: Chama Estação Sabor.
PEI: Nome ótimo! Já me deu fome só de ouvir 😄 Me conta uma coisa: o que mais tem tirado seu sono por aí? Talvez eu possa ajudar.

→ Continue nesse estilo. Não interrompa bruscamente. Use o que o usuário fala para aprofundar.
`;

  const historicoTexto = historico
    .map(msg => `${msg.de === "usuario" ? "Usuário" : "PEI"}: ${msg.texto}`)
    .join("\n");

  return `${intro}\n\n${historicoTexto}\n\nPEI:`;
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
    // Garante estrutura da sessão
    if (typeof sessao !== 'object' || sessao === null) sessao = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];
    if (typeof sessao.coletado !== 'object' || sessao.coletado === null) sessao.coletado = {};

    // Atualiza histórico com a nova entrada do usuário
    sessao.historico.push({ de: "usuario", texto: mensagem });

    // Geração do prompt contextualizado
    const prompt = construirPrompt(sessao.historico, sessao);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // ou "gpt-3.5-turbo"
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: mensagem }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const resposta = completion.choices[0].message.content.trim();

    // Atualiza histórico com a resposta do PEI
    sessao.historico.push({ de: "bot", texto: resposta });

    // Extrai dados da interação
    const dadosExtraidos = extrairDados(`${mensagem}\n${resposta}`);

    // Atualiza sessão com novos dados, sem sobrescrever os anteriores
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
      coleta: (sessao && sessao.coletado) ? sessao.coletado : {},
    };
  }
}

module.exports = gerarResposta;
