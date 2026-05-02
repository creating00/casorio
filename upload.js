const dropZone = document.getElementById('dropZone');
const photoInput = document.getElementById('photoInput');
const statusBox = document.getElementById('uploadStatus');
const statusText = document.getElementById('uploadStatusText');
const progressBox = document.getElementById('uploadProgress');
const progressBar = document.getElementById('uploadProgressBar');
const progressLabel = document.getElementById('uploadProgressLabel');

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
  statusText.textContent = msg;
  statusBox.className = `status-box ${isError ? 'error' : 'success'}`;
  statusBox.classList.remove('hidden');
}

function setProgress(percent) {
  const safePercent = Math.max(0, Math.min(100, percent));
  progressBar.style.width = `${safePercent}%`;
  progressLabel.textContent = `${Math.round(safePercent)}%`;
}

function showProgress() {
  progressBox.classList.remove('hidden');
  progressBox.setAttribute('aria-hidden', 'false');
}

function hideProgress() {
  progressBox.classList.add('hidden');
  progressBox.setAttribute('aria-hidden', 'true');
}

function uploadFiles(formData) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', 'api.php');

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) {
        return;
      }

      setProgress((event.loaded / event.total) * 100);
    });

    xhr.addEventListener('load', () => {
      let data = null;

      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch (error) {
        reject(new Error('El servidor no devolvio una respuesta valida. Revisa api.php.'));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300 || !data || !data.ok) {
        reject(new Error((data && data.error) || 'Error al subir'));
        return;
      }

      setProgress(100);
      resolve(data);
    });

    xhr.addEventListener('error', () => {
      reject(new Error('No se pudo conectar con api.php. Abre la pagina desde el servidor PHP, no con file://.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('La subida fue cancelada.'));
    });

    xhr.send(formData);
  });
}

async function handleFiles(files) {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
  if (imageFiles.length === 0) return;

  const formData = new FormData();
  imageFiles.forEach(file => formData.append('photos[]', file));

  showStatus(`Subiendo ${imageFiles.length} foto(s)...`, false);
  statusBox.classList.remove('success'); // just grey while uploading
  showProgress();
  setProgress(0);

  try {
    const data = await uploadFiles(formData);

    showStatus(`¡Éxito! ${data.saved} foto(s) guardadas. Ya aparecerán en el visor.`);
  } catch (error) {
    hideProgress();
    showStatus(error.message || "Error de conexión", true);
  }
}
