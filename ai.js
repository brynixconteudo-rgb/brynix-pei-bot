const { ChatOpenAI } = require("langchain/chat_models/openai");

const chat = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.6,
  modelName: "gpt-4"
});

async function gerarResposta(mensagem, sessao) {
  const historicoFormatado = sessao.historico?.map(m => ({
    role: m.de === "usuario" ? "user" : "assistant",
    content: m.texto
  })) || [];

  const prompt = [
    {
      role: "system",
      content: `
Você é o PEI — Porta de Entrada Inteligente da BRYNIX.
Seu papel é conversar com o visitante do site de forma acolhedora, humana e fluida, como um consultor de IA.
Seu objetivo é ajudar e, ao longo da conversa, coletar os seguintes dados:
- Nome
- Empresa
- Contato (e-mail ou telefone)
- Desafio
- Classificação (quente, morno ou frio)

IMPORTANTE:
- Se ainda não tiver um dado, conduza naturalmente a conversa para obtê-lo.
- Se o visitante já deu o dado, **não pergunte novamente**.
- Use linguagem natural, sem parecer um formulário.
- Nunca diga "vou salvar", apenas aja com naturalidade.

Quando responder, retorne em formato JSON:
{
  "resposta": "<mensagem que você quer dizer>",
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

  const completion = await chat.call(prompt);
  const jsonBruto = completion?.content;

  try {
    const json = JSON.parse(jsonBruto);
    return {
      resposta: json.resposta,
      coleta: json.coleta || {}
    };
  } catch (e) {
    console.error("Erro ao interpretar resposta da IA:", jsonBruto);
    return { resposta: "Desculpe, não entendi. Pode repetir?", coleta: {} };
  }
}

module.exports = gerarResposta;
