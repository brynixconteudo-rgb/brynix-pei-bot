const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function gerarResposta(mensagem, sessao) {
  const historicoFormatado = sessao.historico?.map(m => ({
    role: m.de === "usuario" ? "user" : "assistant",
    content: m.texto
  })) || [];

  const prompt = [
    {
      role: "system",
      content: `
Você é a ALICE — Analista de Negócios e Automação da BRYNIX.
Converse com o visitante como um consultor de IA experiente e acessível.

**Objetivo:**
- Ajudar o visitante com dúvidas sobre IA nos negócios.
- Coletar dados do LEAD de forma leve e espontânea:
  - Nome
  - Empresa
  - Contato
  - Desafio
  - Classificação (quente, morno ou frio)

**Como classificar:**
Analise se o lead tem:
- Orçamento ou interesse em investir (Budget)
- Poder de decisão ou influência (Authority)
- Dor clara ou oportunidade relevante (Need)
- Urgência ou intenção real (Timing)

Com base nisso, classifique como:
- **Quente**: Dor clara, interesse real, urgência ou orçamento definido.
- **Morno**: Interesse inicial, sem urgência ou sem clareza sobre verba.
- **Frio**: Curioso, apenas explorando, sem intenção visível.

**IMPORTANTE:**
- Conduza a conversa como um humano empático, sem parecer um formulário.
- Se já tiver coletado um dado, **não pergunte novamente**.
- Responda em formato JSON:

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
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: prompt,
      temperature: 0.6,
      max_tokens: 1000
    });

    const jsonBruto = completion.data.choices[0].message.content;

    const json = JSON.parse(jsonBruto);
    return {
      resposta: json.resposta,
      coleta: json.coleta || {}
    };
  } catch (e) {
    console.error("Erro ao interpretar resposta da IA:", e);
    return { resposta: "Desculpe, não entendi. Pode repetir?", coleta: {} };
  }
}

module.exports = gerarResposta;
