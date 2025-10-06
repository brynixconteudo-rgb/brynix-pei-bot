// ========== ROTA PRINCIPAL DE CONVERSA COM IA ==========
app.post('/pei', async (req, res) => {
  try {
    const mensagem = req.body.pergunta || req.body.mensagem;
    let sessao = req.body.sessao || {};
    if (!mensagem) {
      return res.status(400).json({ error: 'Campo "mensagem" ou "pergunta" é obrigatório.' });
    }

    await registrarLog('Chat PEI', 'Mensagem recebida', 'OK', mensagem);

    const resposta = await roteadorPEI(mensagem, sessao);

    // 🔍 Verifica se dados mínimos estão presentes
    const dados = resposta.coleta || {};
    const leadMinimoValido = dados.nome && dados.contato && dados.desafio;

    if (leadMinimoValido) {
      const linha = [[
        new Date().toLocaleString("pt-BR"),
        'Chat PEI',
        dados.nome || '',
        '',
        dados.contato || '',
        dados.empresa || '',
        dados.porte || '',
        dados.desafio || '',
        'chat',
        dados.classificacao || 'morno',
        '', '', '', '', ''
      ]];

      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
          range: 'Leads!A1',
          valueInputOption: 'USER_ENTERED',
          resource: { values: linha }
        });
        await registrarLog('Chat PEI', 'Gravação de Lead', 'Sucesso', dados.nome || '[sem nome]');
        console.log("✅ Lead salvo com sucesso na planilha.");
      } catch (err) {
        await registrarLog('Chat PEI', 'Gravação de Lead', 'Erro', err.message);
        console.error("❌ Falha ao salvar lead na planilha:", err.message);
      }
    } else {
      await registrarLog('Chat PEI', 'Lead Incompleto', 'Ignorado', dados);
      console.log("⚠️ Lead incompleto, não salvo ainda:", dados);
    }

    res.status(200).json(resposta);
  } catch (error) {
    await registrarLog('Chat PEI', 'Erro IA', 'Erro', error.message);
    console.error('❌ Erro no roteador PEI:', error);
    res.status(500).json({ error: 'Erro ao processar a mensagem.' });
  }
});
