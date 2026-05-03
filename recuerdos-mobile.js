const memoriesIntro = document.getElementById('memoriesIntro');
const memoriesGallery = document.getElementById('memoriesGallery');
const showMemoriesBtn = document.getElementById('showMemoriesBtn');
const backToThanksBtn = document.getElementById('backToThanksBtn');
const prevMemoryBtn = document.getElementById('prevMemoryBtn');
const nextMemoryBtn = document.getElementById('nextMemoryBtn');
const memorySlide = document.getElementById('memorySlide');
const memoryEmpty = document.getElementById('memoryEmpty');
const memoryCounter = document.getElementById('memoryCounter');
const memoriesMusic = document.getElementById('memoriesMusic');
const toggleMemoriesMusicBtn = document.getElementById('toggleMemoriesMusicBtn');

let memoryItems = [];
let currentMemoryIndex = 0;
let touchStartX = null;
let musicEnabled = true;

function showMemoryMessage(message) {
  memoryEmpty.classList.remove('hidden');
  memoryEmpty.style.display = 'flex';
  memoryEmpty.querySelector('p').textContent = message;
}

function hideMemoryMessage() {
  memoryEmpty.classList.add('hidden');
  memoryEmpty.style.display = 'none';
}

function playMemoriesMusic() {
  if (!memoriesMusic || !musicEnabled) return;

  memoriesMusic.volume = 0.55;
  memoriesMusic.play().catch(() => {
    // Mobile browsers may still block audio in some low-power or muted modes.
  });
}

function updateMusicButton() {
  if (!toggleMemoriesMusicBtn) return;
  toggleMemoriesMusicBtn.textContent = musicEnabled ? 'Musica: On' : 'Musica: Off';
}

function createGreetingCard(item) {
  const card = document.createElement('article');
  card.className = `message-card message-theme-${item.theme || 'rose'}`;

  const kicker = document.createElement('span');
  kicker.className = 'message-kicker';
  kicker.textContent = 'Saludo para los novios';

  const message = document.createElement('p');
  message.className = 'message-text';
  message.textContent = item.message;

  const author = document.createElement('p');
  author.className = 'message-author';
  author.textContent = item.author ? `- ${item.author}` : '- Con amor';

  card.appendChild(kicker);
  card.appendChild(message);
  card.appendChild(author);

  return card;
}

function renderCurrentMemory() {
  memorySlide.innerHTML = '';

  if (!memoryItems.length) {
    showMemoryMessage('Todavia no hay fotos ni saludos para mostrar.');
    memoryCounter.textContent = '';
    prevMemoryBtn.disabled = true;
    nextMemoryBtn.disabled = true;
    return;
  }

  hideMemoryMessage();
  prevMemoryBtn.disabled = memoryItems.length < 2;
  nextMemoryBtn.disabled = memoryItems.length < 2;

  const item = memoryItems[currentMemoryIndex];

  if (item.type === 'greeting') {
    memorySlide.className = 'memory-slide memory-slide-greeting';
    memorySlide.appendChild(createGreetingCard(item));
  } else {
    const img = document.createElement('img');
    img.className = 'memory-photo';
    img.src = item.src;
    img.alt = `Recuerdo ${currentMemoryIndex + 1}`;
    img.decoding = 'async';

    memorySlide.className = 'memory-slide memory-slide-photo';
    memorySlide.appendChild(img);
  }

  memoryCounter.textContent = `${currentMemoryIndex + 1} / ${memoryItems.length}`;
}

function showNextMemory() {
  if (memoryItems.length < 2) return;
  currentMemoryIndex = (currentMemoryIndex + 1) % memoryItems.length;
  renderCurrentMemory();
}

function showPreviousMemory() {
  if (memoryItems.length < 2) return;
  currentMemoryIndex = (currentMemoryIndex - 1 + memoryItems.length) % memoryItems.length;
  renderCurrentMemory();
}

async function loadMemories() {
  memorySlide.innerHTML = '';
  showMemoryMessage('Cargando fotos y saludos...');

  try {
    const response = await fetch('api.php', { cache: 'no-store' });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'No se pudieron cargar los recuerdos');
    }

    memoryItems = Array.isArray(data.items)
      ? data.items
      : (Array.isArray(data.images) ? data.images.map(src => ({ type: 'image', src })) : []);

    currentMemoryIndex = 0;
    renderCurrentMemory();
  } catch (error) {
    showMemoryMessage(error.message || 'No se pudieron cargar los recuerdos.');
  }
}

showMemoriesBtn.addEventListener('click', () => {
  memoriesIntro.classList.add('hidden');
  memoriesIntro.style.display = 'none';
  memoriesGallery.classList.remove('hidden');
  memoriesGallery.style.display = 'block';
  playMemoriesMusic();
  loadMemories();
});

toggleMemoriesMusicBtn.addEventListener('click', () => {
  musicEnabled = !musicEnabled;

  if (!musicEnabled) {
    memoriesMusic.pause();
  } else {
    playMemoriesMusic();
  }

  updateMusicButton();
});

document.addEventListener('DOMContentLoaded', playMemoriesMusic);
document.addEventListener('click', playMemoriesMusic, { once: true });
document.addEventListener('touchstart', playMemoriesMusic, { once: true, passive: true });
updateMusicButton();

backToThanksBtn.addEventListener('click', () => {
  memoriesGallery.classList.add('hidden');
  memoriesGallery.style.display = 'none';
  memoriesIntro.classList.remove('hidden');
  memoriesIntro.style.display = '';
});

nextMemoryBtn.addEventListener('click', showNextMemory);
prevMemoryBtn.addEventListener('click', showPreviousMemory);

nextMemoryBtn.addEventListener('touchend', (event) => {
  event.preventDefault();
  showNextMemory();
}, { passive: false });

prevMemoryBtn.addEventListener('touchend', (event) => {
  event.preventDefault();
  showPreviousMemory();
}, { passive: false });

memorySlide.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

memorySlide.addEventListener('touchend', (event) => {
  if (touchStartX === null) return;

  const touchEndX = event.changedTouches[0].clientX;
  const distance = touchEndX - touchStartX;
  touchStartX = null;

  if (Math.abs(distance) < 45) return;

  if (distance < 0) {
    showNextMemory();
  } else {
    showPreviousMemory();
  }
}, { passive: true });

document.addEventListener('keydown', (event) => {
  if (memoriesGallery.classList.contains('hidden')) return;

  if (event.key === 'ArrowRight') showNextMemory();
  if (event.key === 'ArrowLeft') showPreviousMemory();
});
