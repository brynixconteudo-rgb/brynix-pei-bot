document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const messagesDiv = document.getElementById('messages');

  let sessao = {
    historico: [],
    coletado: {},
    encerrado: false // ✅ Novo controle de encerramento
  };

  function appendMessage(role, content) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = `<strong>${role === 'user' ? 'Você' : 'BRYNIX'}:</strong> ${content}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  async function enviarMensagem() {
    const userInput = input.value.trim();
    if (!userInput || sessao.encerrado) return;

    sessao.historico.push({ de: 'usuario', texto: userInput });
    appendMessage('user', userInput);

    input.value = '';
    input.disabled = true;
    sendButton.disabled = true;

    try {
      const response = await fetch('/pei/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessao, mensagem: userInput })
      });

      if (!response.ok) throw new Error('Erro na comunicação com a IA.');

      const data = await response.json();
      const respostaIA = data.resposta?.trim() || '[Resposta vazia da IA]';

      sessao.historico.push({ de: 'bot', texto: respostaIA });
      sessao.coletado = data.coleta || sessao.coletado;

      appendMessage('assistant', respostaIA);

      // ✅ Verifica se a conversa foi encerrada
      if (respostaIA.includes('Foi ótimo conversar com você')) {
        sessao.encerrado = true;
        input.disabled = true;
        sendButton.disabled = true;
      }

    } catch (error) {
      appendMessage('assistant', '[Erro ao processar a resposta da IA]');
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      if (!sessao.encerrado) {
        input.disabled = false;
        sendButton.disabled = false;
        input.focus();
      }
    }
  }

  sendButton.addEventListener('click', enviarMensagem);
  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') enviarMensagem();
  });
});
