const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function gerarResposta(pergunta) {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Você é o PEI, o recepcionista inteligente da BRYNIX. Responda de forma acolhedora, objetiva e evite dispersões. Foque em entender os desafios do visitante com IA nos negócios e registre os dados na planilha." },
        { role: "user", content: pergunta }
      ],
      temperature: 0.7,
    });

    return completion.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Erro na IA:", error.message);
    return "Desculpe, houve um erro ao gerar a resposta.";
  }
}

module.exports = { gerarResposta };
