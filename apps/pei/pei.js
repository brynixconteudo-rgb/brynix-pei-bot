document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const messagesDiv = document.getElementById('messages');

  // Sessão local: histórico + dados coletados
  let sessao = {
    historico: [],
    coletado: {}
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
    if (!userInput) return;

    // Adiciona mensagem do usuário ao histórico
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

      // Atualiza histórico e dados coletados com base na resposta
      sessao.historico.push({ de: 'bot', texto: respostaIA });
      sessao.coletado = data.coleta || sessao.coletado;

      appendMessage('assistant', respostaIA);
    } catch (error) {
      appendMessage('assistant', '[Erro ao processar a resposta da IA]');
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
    }
  }

  sendButton.addEventListener('click', enviarMensagem);
  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') enviarMensagem();
  });
});
