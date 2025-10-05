const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { google } = require('googleapis');
const gerarResposta = require('./ai');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve pei.html etc

// ✅ Log básico para toda requisição HTTP
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ========== AUTENTICAÇÃO COM GOOGLE SHEETS ==========
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// ========== ROTA DE TESTE PARA GRAVAÇÃO MANUAL ==========
app.post('/pei/test', async (req, res) => {
  try {
    const {
      timestamp,
      origem,
      nome,
      email,
      whatsapp,
      empresa,
      porte,
      desafio,
      tipo_interacao,
      classificacao,
      utm_source,
      utm_medium,
      utm_campaign,
      request_id,
      ip_hash
    } = req.body;

    const values = [[
      timestamp,
      origem,
      nome,
      email,
      whatsapp,
      empresa,
      porte,
      desafio,
      tipo_interacao,
      classificacao,
      utm_source,
      utm_medium,
      utm_campaign,
      request_id,
      ip_hash
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
      range: 'Leads!A1',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    console.log("✅ Teste: lead gravado com sucesso.");
    res.status(200).json({ success: true, message: 'Lead registrado com sucesso!' });
  } catch (error) {
    console.error('❌ Erro ao gravar na planilha:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao gravar na planilha.' });
  }
});

// ========== ROTA PRINCIPAL DE CONVERSA COM IA ==========
app.post('/pei/ia', async (req, res) => {
  try {
    const pergunta = req.body.pergunta || req.body.mensagem;
    const sessao = req.body.sessao || {};
    if (!pergunta) {
      return res.status(400).json({ error: 'Campo "pergunta" ou "mensagem" é obrigatório.' });
    }

    // ✅ Log da pergunta e da sessão antes de processar
    console.log("📨 Mensagem recebida:", pergunta);
    console.log("🧠 Sessão atual:", JSON.stringify(sessao, null, 2));

    const resposta = await gerarResposta(pergunta, sessao);

    // 🔍 Verifica se dados mínimos estão presentes
    const dados = sessao.coletado || {};
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
        console.log("✅ Lead salvo com sucesso na planilha.");
      } catch (err) {
        console.error("❌ Falha ao salvar lead na planilha:", err.message);
      }
    } else {
      console.log("⚠️ Lead incompleto, não salvo ainda:", dados);
    }

    res.status(200).json(resposta);
  } catch (error) {
    console.error('❌ Erro na IA:', error);
    res.status(500).json({ error: 'Erro ao gerar resposta da IA.' });
  }
});

// ========== ROTA DE STATUS ==========
app.get('/', (req, res) => {
  res.send('BRYNIX PEI BOT up and running ✅');
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
