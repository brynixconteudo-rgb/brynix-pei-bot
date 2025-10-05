const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function gerarResposta(mensagem, sessao) {
  // Recupera histórico e coleta persistida
  const historicoFormatado = sessao.historico?.map(m => ({
    role: m.de === "usuario" ? "user" : "assistant",
    content: m.texto
  })) || [];

  const coletaAnterior = sessao.coleta || {};
  const nome = coletaAnterior.nome;
  const saudacao = nome ? `Olá, ${nome}!` : `Olá!`;

  // Adiciona uma saudação inicial se for a primeira interação
  if (historicoFormatado.length === 0) {
    historicoFormatado.unshift({
      role: "assistant",
      content: "Olá! Eu sou a ALICE, Analista de Automação da BRYNIX. Como posso ajudar você com IA nos negócios?"
    });
  }

  // Constrói o prompt com contexto
  const prompt = [
    {
      role: "system",
      content: `
Você é a ALICE — Analista de Negócios e Automação da BRYNIX.

Fale com empatia, como um consultor experiente em IA, sempre com foco em negócios reais.

🚨 ATENÇÃO: Você está dando continuidade a uma conversa, e o visitante já informou os seguintes dados (caso existam):

${JSON.stringify(coletaAnterior, null, 2)}

NUNCA repita perguntas já feitas.
Sempre use o nome do visitante se ele já foi coletado.
Mantenha uma conversa fluida, progressiva e natural.

🎯 Objetivos:
1. Ajudar com dúvidas sobre uso de IA nos negócios.
2. Coletar as seguintes informações (se ainda faltarem):
  - nome
  - empresa
  - contato
  - desafio
  - classificacao (quente, morno, frio)

🔥 Classificação:
- **quente**: dor clara + interesse real ou urgência/orçamento
- **morno**: tem interesse, mas ainda sem timing ou verba clara
- **frio**: curioso, explorando, sem intenção aparente

🧠 Exemplo de resposta esperada:
{
  "resposta": "<mensagem ao usuário>",
  "coleta": {
    "nome": "...",
    "empresa": "...",
    "contato": "...",
    "desafio": "...",
    "classificacao": "quente|morno|frio"
  }
}
`.trim()
    },
    ...historicoFormatado,
    { role: "user", content: mensagem }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: prompt,
      temperature: 0.6,
      max_tokens: 1000,
    });

    const jsonBruto = completion.choices[0].message.content;

    const json = JSON.parse(jsonBruto);

    return {
      resposta: json.resposta,
      coleta: json.coleta || {}
    };
  } catch (e) {
    console.error("Erro ao interpretar resposta da IA:", e);
    return { resposta: "Desculpe, algo deu errado aqui. Pode repetir?", coleta: {} };
  }
}

module.exports = gerarResposta;
