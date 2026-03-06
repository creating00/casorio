const AUTO_SLIDE_MS = 3200;
const REFRESH_MS = 10000;

const photoInput = document.getElementById("photoInput");
const carousel = document.getElementById("carousel");
const carouselCard = document.getElementById("carouselCard");
const dots = document.getElementById("dots");
const emptyState = document.getElementById("emptyState");
const playMusicBtn = document.getElementById("playMusicBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const bgMusic = document.getElementById("bgMusic");
const statusText = document.getElementById("statusText");

let photos = [];
let currentIndex = 0;
let intervalId = null;

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function renderCarousel() {
  carousel.querySelectorAll(".slide").forEach((node) => node.remove());
  dots.innerHTML = "";

  if (photos.length === 0) {
    emptyState.style.display = "grid";
    stopAutoSlide();
    return;
  }

  emptyState.style.display = "none";

  photos.forEach((src, index) => {
    const slide = document.createElement("div");
    slide.className = `slide ${index === currentIndex ? "active" : ""}`;

    const img = document.createElement("img");
    img.src = src;
    img.alt = `Foto de boda ${index + 1}`;

    slide.appendChild(img);
    carousel.appendChild(slide);

    const dot = document.createElement("div");
    dot.className = `dot ${index === currentIndex ? "active" : ""}`;
    dots.appendChild(dot);
  });

  if (photos.length > 1) {
    startAutoSlide();
  } else {
    stopAutoSlide();
  }
}

function goToSlide(index) {
  const slides = carousel.querySelectorAll(".slide");
  const dotNodes = dots.querySelectorAll(".dot");

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });

  dotNodes.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
}

function nextSlide() {
  if (photos.length < 2) {
    return;
  }

  currentIndex = (currentIndex + 1) % photos.length;
  goToSlide(currentIndex);
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
    const response = await fetch("api.php", { cache: "no-store" });
    const raw = await response.text();
    let data = null;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("El servidor devolvio HTML/error en lugar de JSON. Revisa api.php en Hostinger.");
    }

    if (!response.ok) {
      throw new Error(data.error || "No se pudo cargar la galería");
    }

    if (!Array.isArray(data.images)) {
      throw new Error("Respuesta inválida del servidor");
    }

    const previousLength = photos.length;
    photos = data.images;

    if (photos.length === 0) {
      currentIndex = 0;
    } else if (photos.length > previousLength) {
      currentIndex = previousLength;
    } else if (currentIndex >= photos.length) {
      currentIndex = 0;
    }

    renderCarousel();
  } catch (error) {
    setStatus(error.message || "Error al cargar imágenes", true);
  }
}

async function uploadPhotos(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("photos[]", file));

  const response = await fetch("api.php", {
    method: "POST",
    body: formData
  });

  const raw = await response.text();
  let data = {};

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("El servidor devolvio HTML/error en lugar de JSON al subir.");
  }

  if (!response.ok || !data.ok) {
    const message = data.error || "Error al subir archivos";
    throw new Error(message);
  }

  return data;
}

photoInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));

  if (files.length === 0) {
    return;
  }

  setStatus("Subiendo fotos al servidor...");

  try {
    const result = await uploadPhotos(files);
    await fetchPhotos();
    setStatus(`Subida completa: ${result.saved} foto(s) guardadas en servidor.`);

    bgMusic.play().catch(() => {
      // El navegador puede bloquear autoplay hasta interacción del usuario.
    });
  } catch (error) {
    setStatus(error.message || "No se pudo subir", true);
  }

  event.target.value = "";
});

playMusicBtn.addEventListener("click", async () => {
  try {
    await bgMusic.play();
    playMusicBtn.textContent = "Música activa";
  } catch {
    playMusicBtn.textContent = "No se pudo reproducir";
  }
});

function updateFullscreenButton() {
  const fullElement = document.fullscreenElement || document.webkitFullscreenElement;
  const isFullscreen = fullElement === carouselCard;
  fullscreenBtn.textContent = isFullscreen ? "Salir de pantalla grande" : "Ver en pantalla grande";
}

fullscreenBtn.addEventListener("click", async () => {
  const fullElement = document.fullscreenElement || document.webkitFullscreenElement;
  const isFullscreen = fullElement === carouselCard;

  try {
    if (isFullscreen) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      if (carouselCard.requestFullscreen) {
        await carouselCard.requestFullscreen();
      } else if (carouselCard.webkitRequestFullscreen) {
        carouselCard.webkitRequestFullscreen();
      } else {
        throw new Error("Fullscreen no soportado");
      }
    }
  } catch {
    setStatus("Tu navegador bloqueó pantalla completa.", true);
  }
});

document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
updateFullscreenButton();

fetchPhotos();
setInterval(fetchPhotos, REFRESH_MS);
