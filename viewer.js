const AUTO_SLIDE_MS = 5000;
const REFRESH_MS = 8000;

const carouselTrack = document.getElementById('carouselTrack');
const emptyMessage = document.getElementById('emptyMessage');
const playMusicBtn = document.getElementById('playMusicBtn');
const bgMusic = document.getElementById('bgMusic');
const fullscreenBtn = document.getElementById('fullscreenBtn');

let carouselItems = [];
let currentIndex = 0;
let intervalId = null;

function renderCarousel() {
  carouselTrack.querySelectorAll('.slide').forEach(node => node.remove());

  if (carouselItems.length === 0) {
    emptyMessage.style.display = 'flex';
    stopAutoSlide();
    return;
  }

  emptyMessage.style.display = 'none';

  carouselItems.forEach((item, index) => {
    const slide = document.createElement('div');
    slide.className = `slide ${index === currentIndex ? 'active' : ''}`;

    if (item.type === 'greeting') {
      slide.classList.add('message-slide');
      slide.appendChild(createMessageCard(item));
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = `Boda Photo ${index + 1}`;
      slide.appendChild(img);
    }

    carouselTrack.appendChild(slide);
  });

  if (carouselItems.length > 1) {
    startAutoSlide();
  } else {
    stopAutoSlide();
  }
}

function createMessageCard(item) {
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

function nextSlide() {
  if (carouselItems.length < 2) return;
  
  const slides = carouselTrack.querySelectorAll('.slide');
  if (slides[currentIndex]) {
    slides[currentIndex].classList.remove('active');
  }
  
  currentIndex = (currentIndex + 1) % carouselItems.length;
  
  if (slides[currentIndex]) {
    slides[currentIndex].classList.add('active');
  }
}

function startAutoSlide() {
  stopAutoSlide();
  intervalId = setInterval(nextSlide, AUTO_SLIDE_MS);
}

function stopAutoSlide() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

async function fetchPhotos() {
  try {
    const response = await fetch('api.php', { cache: 'no-store' });
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      console.error('Error fetching photos:', data.error);
      return;
    }

    const incomingItems = Array.isArray(data.items)
      ? data.items
      : (Array.isArray(data.images) ? data.images.map(src => ({ type: 'image', src })) : []);
    const previousLength = carouselItems.length;
    carouselItems = incomingItems;

    if (carouselItems.length === 0) {
      currentIndex = 0;
    } else if (carouselItems.length > previousLength) {
      // New photos or greetings arrived, jump to the first new one
      currentIndex = previousLength;
    }

    renderCarousel();
  } catch (err) {
    console.error('Failed to fetch:', err);
  }
}

// Controls
playMusicBtn.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().then(() => {
      playMusicBtn.textContent = '🎵 Música: On';
    }).catch(e => console.error("Error al reproducir audio:", e));
  } else {
    bgMusic.pause();
    playMusicBtn.textContent = '🎵 Música: Off';
  }
});

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
    fullscreenBtn.textContent = '⛶ Salir Fullscreen';
  } else {
    document.exitFullscreen();
    fullscreenBtn.textContent = '⛶ Pantalla Completa';
  }
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    fullscreenBtn.textContent = '⛶ Pantalla Completa';
  } else {
    fullscreenBtn.textContent = '⛶ Salir Fullscreen';
  }
});

// Init
fetchPhotos();
setInterval(fetchPhotos, REFRESH_MS);

// Attempt autopay (usually blocked without interaction)
bgMusic.volume = 0.5;
