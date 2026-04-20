const dropZone = document.getElementById('dropZone');
const photoInput = document.getElementById('photoInput');
const statusBox = document.getElementById('uploadStatus');

// Drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
});

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

photoInput.addEventListener('change', function() {
  handleFiles(this.files);
  this.value = ''; // reset so same files can be re-uploaded if needed
});

function showStatus(msg, isError = false) {
  statusBox.textContent = msg;
  statusBox.className = `status-box ${isError ? 'error' : 'success'}`;
  statusBox.classList.remove('hidden');
}

async function handleFiles(files) {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
  if (imageFiles.length === 0) return;

  const formData = new FormData();
  imageFiles.forEach(file => formData.append('photos[]', file));

  showStatus(`Subiendo ${imageFiles.length} foto(s)...`, false);
  statusBox.classList.remove('success'); // just grey while uploading

  try {
    const response = await fetch('api.php', {
      method: 'POST',
      body: formData
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Respuesta inválida del servidor.');
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Error al subir');
    }

    showStatus(`¡Éxito! ${data.saved} foto(s) guardadas. Ya aparecerán en el visor.`);
  } catch (error) {
    showStatus(error.message || "Error de conexión", true);
  }
}
