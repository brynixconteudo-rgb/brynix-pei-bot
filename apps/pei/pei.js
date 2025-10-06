// 📁 apps/pei/pei.js
const express = require("express");
const router = express.Router();
const { roteadorPEI } = require("./pei_router"); // usa o roteador principal

// Rota principal do PEI (chat)
router.post("/", async (req, res) => {
  try {
    const mensagem = req.body.mensagem || req.body.pergunta;
    let sessao = req.body.sessao || {};

    if (!mensagem) {
      return res
        .status(400)
        .json({ resposta: "Campo 'mensagem' ou 'pergunta' é obrigatório.", coleta: {} });
    }

    // Chama o roteador PEI (decide livre x estruturado)
    const resultado = await roteadorPEI(mensagem, sessao);

    // Retorna para o front-end
    return res.status(200).json(resultado);
  } catch (erro) {
    console.error("❌ Erro no apps/pei/pei.js:", erro.message);
    return res.status(500).json({
      resposta: "Desculpe, houve um erro ao gerar a resposta. Pode tentar novamente?",
      coleta: {},
    });
  }
});

module.exports = router;
