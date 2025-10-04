// ai.js
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function gerarResposta(pergunta) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: pergunta }],
  });

  return completion.choices[0].message.content;
}

module.exports = { gerarResposta };
