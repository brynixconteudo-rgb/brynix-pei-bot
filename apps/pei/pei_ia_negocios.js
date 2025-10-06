// 📁 pei_ia_negocios.js
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const promptBase = `
Você é o PEI (Porta de Entrada Inteligente), um assistente da BRYNIX.

Sua missão neste modo é conversar livremente com visitantes curiosos sobre o uso da Inteligência Artificial em empresas, negócios e processos. Seja um guia acolhedor e inspirador.

⚠️ Importante:
- Você **não deve coletar dados pessoais**.
- Não deve tentar fazer perguntas sobre nome, empresa, contato, etc.
- Simplesmente responda com naturalidade, inspiração e leveza, explicando como a IA pode ser aplicada.

🎯 Estilo:
- Profissional, acessível, inteligente.
- Traga exemplos práticos.
- Mostre entusiasmo com as possibilidades da IA.
- Não tente vender nada, apenas inspirar e informar.

Pode seguir.
`;

async function gerarRespostaNegocios(mensagem, sessao = {}) {
  try {
    if (typeof sessao !== "object" || sessao === null) sessao = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];

    sessao.historico.push({ de: "usuario", texto: mensagem });

    const mensagens = [
      { role: "system", content: promptBase },
      ...sessao.historico.map(msg => ({
        role: msg.de === "usuario" ? "user" : "assistant",
        content: msg.texto,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: mensagens, // ✅ declarado corretamente aqui
      temperature: 0.7,
      max_tokens: 500,
    });

    const resposta = completion.choices[0].message.content.trim();
    sessao.historico.push({ de: "bot", texto: resposta });

    return {
      resposta,
      coleta: {}, // não coleta nada
    };
  } catch (erro) {
    console.error("❌ Erro em gerarRespostaNegocios:", erro.message);
    return {
      resposta: "Desculpe, houve um erro ao gerar a resposta. Pode tentar novamente?",
      coleta: {},
    };
  }
}

module.exports = { gerarRespostaNegocios };
