// 📁 pei_qualificacao_leads.js
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const promptBase = `
Você é o PEI (Porta de Entrada Inteligente), um assistente da BRYNIX.

Neste modo, sua função é entender o contexto da pessoa para encaminhar ao time certo.
Conduza uma conversa natural, humana e empática, mas com um roteiro interno que colete as seguintes informações:

✅ Coletas obrigatórias:
- Nome da pessoa
- Nome da empresa
- Setor ou segmento de atuação
- WhatsApp
- E-mail
- Porte da empresa (micro, pequena, média, grande)
- Desafio ou objetivo com IA
- Grau de interesse (curioso, avaliando, decidido)

⚠️ Importante:
- Coleta um item por vez, agradecendo e reagindo a cada resposta.
- Nunca pergunte mais de uma coisa ao mesmo tempo.
- Não avance para o próximo item se o anterior não tiver sido respondido.
- Não peça nada que já foi respondido.
- Quando tudo estiver coletado, gere um resumo, confirme com o usuário e pergunte se pode enviar para o time da BRYNIX.

🎯 Estilo:
- Profissional, mas simpático e leve
- Frases variadas, nunca repetitivas
- Linguagem natural, como em uma boa conversa
`;

const ordemColeta = ["nome", "empresa", "setor", "whatsapp", "email", "porte", "desafio", "interesse"];

const perguntas = {
  nome: "Para começar, posso saber seu nome, por favor?",
  empresa: "E qual é o nome da empresa que você representa?",
  setor: "Legal! E em que setor ou segmento essa empresa atua?",
  whatsapp: "Você pode me passar o WhatsApp para que o time entre em contato?",
  email: "E se preferir, pode me informar também um e-mail?",
  porte: "Sobre o porte da empresa, você diria que é micro, pequena, média ou grande?",
  desafio: "E qual seria o principal desafio ou objetivo que você busca resolver com IA?",
  interesse: "Você está apenas conhecendo ou realmente avaliando soluções de IA neste momento?",
};

function construirMensagens(sessao) {
  const mensagens = [
    { role: "system", content: promptBase },
    ...sessao.historico.map(msg => ({
      role: msg.de === "usuario" ? "user" : "assistant",
      content: msg.texto,
    }))
  ];
  return mensagens;
}

function proximaPergunta(coletado) {
  for (const campo of ordemColeta) {
    if (!coletado[campo]) return campo;
  }
  return null;
}

function extrairDadosSimples(campo, texto) {
  const patterns = {
    whatsapp: /(?:(\(?\d{2}\)?\s?)?(\d{4,5})[-\s]?(\d{4}))/,
    email: /[a-z0-9_.+-]+@[a-z0-9-]+\.[a-z.]+/i,
    porte: /\b(micro|pequena|m[eé]dia|grande)\b/i,
    interesse: /\b(curioso|avaliando|decidido|conhecendo)\b/i,
  };
  const pattern = patterns[campo];
  if (!pattern) return null;
  const match = texto.match(pattern);
  return match ? match[0] : null;
}

async function gerarResposta(mensagem, sessao = {}) {
  try {
    if (!sessao.historico) sessao.historico = [];
    if (!sessao.coletado) sessao.coletado = {};

    sessao.historico.push({ de: "usuario", texto: mensagem });

    // Atualiza coleta básica via regex (whatsapp, email, porte, interesse)
    for (const campo of ["whatsapp", "email", "porte", "interesse"]) {
      if (!sessao.coletado[campo]) {
        const extraido = extrairDadosSimples(campo, mensagem);
        if (extraido) sessao.coletado[campo] = extraido;
      }
    }

    // Verifica próximo campo a perguntar
    const proximoCampo = proximaPergunta(sessao.coletado);

    // Se tudo foi coletado
    if (!proximoCampo && !sessao.finalizado) {
      sessao.finalizado = true;
      const resumo = `Entendi então:
- Nome: ${sessao.coletado.nome}
- Empresa: ${sessao.coletado.empresa}
- Setor: ${sessao.coletado.setor}
- WhatsApp: ${sessao.coletado.whatsapp}
- E-mail: ${sessao.coletado.email}
- Porte: ${sessao.coletado.porte}
- Desafio: ${sessao.coletado.desafio}
- Interesse: ${sessao.coletado.interesse}

Posso compartilhar essas informações com o time da BRYNIX para que entrem em contato com você?`;

      sessao.historico.push({ de: "bot", texto: resumo });

      return {
        resposta: resumo,
        coleta: sessao.coletado,
      };
    }

    if (proximoCampo) {
      const resposta = perguntas[proximoCampo];
      sessao.historico.push({ de: "bot", texto: resposta });
      return {
        resposta,
        coleta: sessao.coletado,
      };
    }

    return {
      resposta: "Muito obrigado! Caso precise de algo mais, estou à disposição!",
      coleta: sessao.coletado,
    };
  } catch (erro) {
    console.error("Erro PEI estruturado:", erro.message);
    return {
      resposta: "Desculpe, houve um erro aqui. Pode tentar novamente?",
      coleta: sessao.coletado || {},
    };
  }
}

module.exports = { gerarResposta };
