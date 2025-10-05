const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Certifique-se que essa variável está no ambiente do Render
});

async function gerarResposta(pergunta) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: pergunta }],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao gerar resposta da IA:", error);
    return "Desculpe, ocorreu um erro ao tentar responder. Tente novamente mais tarde.";
  }
}

module.exports = { gerarResposta };
