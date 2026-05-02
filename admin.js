const adminGrid = document.getElementById('adminGrid');
const adminEmpty = document.getElementById('adminEmpty');
const adminStatus = document.getElementById('adminStatus');

function showAdminStatus(message, isError) {
  adminStatus.textContent = message;
  adminStatus.className = `status-box ${isError ? 'error' : 'success'}`;
  adminStatus.classList.remove('hidden');
}

function clearAdminStatus() {
  adminStatus.textContent = '';
  adminStatus.className = 'status-box hidden';
}

function getFileNameFromUrl(url) {
  const cleanUrl = url.split('?')[0];
  const parts = cleanUrl.split('/');
  return decodeURIComponent(parts[parts.length - 1] || '');
}

function renderPhotos(images) {
  adminGrid.innerHTML = '';

  if (!images.length) {
    adminEmpty.classList.remove('hidden');
    return;
  }

  adminEmpty.classList.add('hidden');

  images.forEach((imageUrl, index) => {
    const card = document.createElement('article');
    card.className = 'admin-card';

    const preview = document.createElement('img');
    preview.className = 'admin-photo';
    preview.src = imageUrl;
    preview.alt = `Foto subida ${index + 1}`;

    const meta = document.createElement('div');
    meta.className = 'admin-card-meta';

    const name = document.createElement('p');
    name.className = 'admin-file-name';
    name.textContent = getFileNameFromUrl(imageUrl);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'Eliminar';
    deleteButton.addEventListener('click', () => {
      deletePhoto(getFileNameFromUrl(imageUrl), deleteButton);
    });

    meta.appendChild(name);
    meta.appendChild(deleteButton);
    card.appendChild(preview);
    card.appendChild(meta);
    adminGrid.appendChild(card);
  });
}

async function loadPhotos() {
  try {
    const response = await fetch('api.php', { cache: 'no-store' });
    const data = await response.json();

    if (!response.ok || !data.ok || !Array.isArray(data.images)) {
      throw new Error((data && data.error) || 'No se pudieron cargar las fotos');
    }

    renderPhotos(data.images);
  } catch (error) {
    showAdminStatus(error.message || 'Error al cargar fotos', true);
  }
}

async function deletePhoto(fileName, button) {
  const confirmed = window.confirm(`¿Eliminar ${fileName}?`);
  if (!confirmed) {
    return;
  }

  clearAdminStatus();
  button.disabled = true;
  button.textContent = 'Eliminando...';

  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('file', fileName);

  try {
    const response = await fetch('api.php', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    if (!response.ok || !data.ok || !Array.isArray(data.images)) {
      throw new Error((data && data.error) || 'No se pudo eliminar la imagen');
    }

    renderPhotos(data.images);
    showAdminStatus(`Imagen eliminada: ${fileName}`, false);
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Eliminar';
    showAdminStatus(error.message || 'Error al eliminar la imagen', true);
  }
}

loadPhotos();
