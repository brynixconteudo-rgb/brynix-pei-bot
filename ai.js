const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// PROMPT melhorado para extração dos dados
const gerarResposta = async (mensagem, contexto) => {
  const prompt = `
Você é o assistente da BRYNIX, uma consultoria em IA para negócios. Responda ao usuário de forma empática, natural e profissional, sempre guiando a conversa para entender 5 informações essenciais:

1. Nome
2. Empresa
3. Contato (telefone ou email)
4. Desafio (o que deseja resolver com IA)
5. Classificação do lead: "quente", "morno" ou "frio"

A cada interação, extraia o máximo de dados possíveis. Retorne sempre no formato JSON abaixo ao final:

{
  "resposta": "<sua resposta natural e empática>",
  "coleta": {
    "nome": "...",
    "empresa": "...",
    "contato": "...",
    "desafio": "...",
    "classificacao": "quente" | "morno" | "frio"
  }
}

Se algum dado ainda não tiver sido fornecido, retorne-o como `null`.

Histórico recente:
${contexto.historico.map((h) => `${h.de === "usuario" ? "Usuário" : "BRYNIX"}: ${h.texto}`).join("\n")}

Usuário: ${mensagem}
`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4", // ou "gpt-3.5-turbo" se preferir
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const respostaGerada = completion.data.choices[0].message.content;

    // DEBUG: log para ver o retorno bruto
    console.log("[🧠] Resposta bruta da IA:", respostaGerada);

    // Tenta extrair JSON da resposta
    const jsonInicio = respostaGerada.indexOf("{");
    const jsonFim = respostaGerada.lastIndexOf("}");

    if (jsonInicio === -1 || jsonFim === -1) {
      throw new Error("JSON inválido na resposta da IA.");
    }

    const json = JSON.parse(respostaGerada.slice(jsonInicio, jsonFim + 1));

    return {
      resposta: json.resposta || "Desculpe, não consegui entender totalmente sua mensagem.",
      coleta: json.coleta || {}
    };

  } catch (erro) {
    console.error("❌ Erro em gerarResposta:", erro.message);
    return {
      resposta: "Desculpe, tive um problema ao processar sua resposta. Pode repetir de outra forma?",
      coleta: {}
    };
  }
};

module.exports = gerarResposta;
