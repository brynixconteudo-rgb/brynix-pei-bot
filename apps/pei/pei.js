document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const messagesDiv = document.getElementById('messages');

  // Cria histórico de mensagens
  let historicoMensagens = [
    {
      role: 'system',
      content: 'Você é o assistente PEI da BRYNIX, especialista em qualificar leads e conversar naturalmente sobre o uso de IA para negócios. Seja profissional, simpático e mantenha o tom humano, sem parecer um robô.'
    }
  ];

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
    historicoMensagens.push({ role: 'user', content: userInput });
    appendMessage('user', userInput);
    input.value = '';
    input.disabled = true;
    sendButton.disabled = true;

    try {
      const response = await fetch('/pei/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historico: historicoMensagens })
      });

      if (!response.ok) throw new Error('Erro na comunicação com a IA.');

      const data = await response.json();
      const respostaIA = data.resposta?.trim() || '[Resposta vazia da IA]';

      // Adiciona resposta da IA ao histórico
      historicoMensagens.push({ role: 'assistant', content: respostaIA });
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
