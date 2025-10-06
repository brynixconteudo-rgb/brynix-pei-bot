// 📁 public/pei.js

document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const messagesDiv = document.getElementById('messages');

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

  function toggleInput(disabled) {
    input.disabled = disabled;
    sendButton.disabled = disabled;
    if (!disabled) input.focus();
  }

  async function enviarMensagem() {
    const userInput = input.value.trim();
    if (!userInput || sessao.coletado.encerrado) return;

    sessao.historico.push({ de: 'usuario', texto: userInput });
    appendMessage('user', userInput);

    input.value = '';
    toggleInput(true);

    try {
      const response = await fetch('/pei', { // 🔁 alterado de "/pei/ia" para "/pei"
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessao, mensagem: userInput })
      });

      if (!response.ok) throw new Error('Erro na comunicação com a IA.');

      const data = await response.json();
      const respostaIA = data.resposta?.trim() || '[Resposta vazia da IA]';
      const coleta = data.coleta || {};

      sessao.historico.push({ de: 'bot', texto: respostaIA });
      sessao.coletado = coleta;

      appendMessage('assistant', respostaIA);

      // ✅ Se detectado encerramento pelo back-end
      if (coleta.encerrado === true) {
        toggleInput(true);
      } else {
        toggleInput(false);
      }

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      appendMessage('assistant', '[Erro ao processar a resposta da IA]');
      toggleInput(false);
    }
  }

  sendButton.addEventListener('click', enviarMensagem);
  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') enviarMensagem();
  });
});
