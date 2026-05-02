const greetingForm = document.getElementById('greetingForm');
const greetingAuthor = document.getElementById('greetingAuthor');
const greetingMessage = document.getElementById('greetingMessage');
const greetingStatus = document.getElementById('greetingStatus');
const previewCard = document.getElementById('greetingPreviewCard');
const previewMessage = document.getElementById('previewMessage');
const previewAuthor = document.getElementById('previewAuthor');

function showGreetingStatus(message, isError) {
  greetingStatus.textContent = message;
  greetingStatus.className = `status-box ${isError ? 'error' : 'success'}`;
  greetingStatus.classList.remove('hidden');
}

function getSelectedTheme() {
  const selected = greetingForm.querySelector('input[name="theme"]:checked');
  return selected ? selected.value : 'rose';
}

function updatePreview() {
  const message = greetingMessage.value.trim() || 'Que este nuevo camino este lleno de amor, fe y alegria.';
  const author = greetingAuthor.value.trim() || 'Tu nombre';
  const theme = getSelectedTheme();

  previewMessage.textContent = message;
  previewAuthor.textContent = `- ${author}`;
  previewCard.className = `message-card message-theme-${theme}`;
}

greetingAuthor.addEventListener('input', updatePreview);
greetingMessage.addEventListener('input', updatePreview);
greetingForm.querySelectorAll('input[name="theme"]').forEach(input => {
  input.addEventListener('change', updatePreview);
});

greetingForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const message = greetingMessage.value.trim();
  if (!message) {
    showGreetingStatus('Escribe un saludo antes de enviarlo.', true);
    return;
  }

  const submitButton = greetingForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Enviando...';

  const formData = new FormData();
  formData.append('action', 'greeting');
  formData.append('author', greetingAuthor.value.trim());
  formData.append('message', message);
  formData.append('theme', getSelectedTheme());

  try {
    const response = await fetch('api.php', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'No se pudo enviar el saludo');
    }

    greetingForm.reset();
    updatePreview();
    showGreetingStatus('Saludo enviado. Ya aparecera en el carrusel.', false);
  } catch (error) {
    showGreetingStatus(error.message || 'Error al enviar el saludo', true);
  }

  submitButton.disabled = false;
  submitButton.textContent = 'Enviar saludo';
});

updatePreview();
