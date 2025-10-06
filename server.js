const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // ⚠️ Para servir arquivos estáticos
const { google } = require('googleapis');
const peiRoutes = require('./apps/pei/pei'); // ✅ Router principal do PEI

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// ✅ Serve tudo que estiver em /public (pei.html etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ========== AUTENTICAÇÃO COM GOOGLE SHEETS ==========
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// ========== FUNÇÃO AUXILIAR: Grava log na planilha ==========
async function registrarLog(origem, acao, status, detalhes = '') {
  const linha = [[
    new Date().toLocaleString("pt-BR"),
    origem,
    acao,
    status,
    typeof detalhes === 'string' ? detalhes : JSON.stringify(detalhes)
  ]];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
      range: 'LOGS!A1', // ⚠️ Nome correto da aba do log
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: linha } // 🔁 corrigido para requestBody
    });
    console.log(`📝 Log registrado: ${acao} - ${status}`);
  } catch (erro) {
    console.error("❌ Falha ao registrar log:", erro.message);
  }
}

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
      requestBody: { values } // 🔁 corrigido para requestBody
    });

    await registrarLog('Chat PEI', 'Teste de Gravação', 'Sucesso', nome || '[sem nome]');
    res.status(200).json({ success: true, message: 'Lead registrado com sucesso!' });
  } catch (error) {
    await registrarLog('Chat PEI', 'Teste de Gravação', 'Erro', error.message);
    console.error('Erro ao gravar na planilha:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao gravar na planilha.' });
  }
});

// ========== ROTA PRINCIPAL DO PEI ==========
app.use('/pei', peiRoutes); // ✅ Usa o roteador completo PEI

// ✅ ⚠️ ESTA É A ROTA CRÍTICA PARA O IFRAMER DO GODADDY:
app.get('/pei', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pei.html'));
});

// ========== ROTA DE STATUS ==========
app.get('/', (req, res) => {
  res.send('BRYNIX PEI BOT up and running ✅');
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
