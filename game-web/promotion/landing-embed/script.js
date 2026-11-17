/* TraceBack promotion page: deliberately independent from the game runtime. */
// Public static-hosted game URL. This lets the landing page run the game in an iframe.
const GAME_URL = "https://traceback-game-promo.exactsunbird8.chatgpt.site/?embed=1";
const EXTERNAL_PLAY_URL = "";

const toast = document.querySelector(".toast");
const playModal = document.querySelector("#play-modal");
const gameFrame = document.querySelector("[data-game-frame]");
const gameNote = document.querySelector("[data-game-note]");
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.setAttribute("aria-hidden", "false");
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    toast.setAttribute("aria-hidden", "true");
  }, 4200);
}

function configurePlayLinks() {
  document.querySelectorAll("[data-play-url-target]").forEach((link) => {
    if (GAME_URL.trim()) {
      link.href = "#play-modal";
      link.setAttribute("aria-label", "페이지 안에서 TraceBack 게임 열기");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openGameModal();
      });
    } else if (EXTERNAL_PLAY_URL.trim()) {
      link.href = EXTERNAL_PLAY_URL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.removeAttribute("aria-disabled");
    } else {
      link.setAttribute("aria-label", "플레이 주소 설정 필요");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showToast("플레이 주소가 아직 설정되지 않았습니다. 배포 후 script.js의 PLAY_URL을 연결해 주세요.");
      });
    }
  });
  document.querySelectorAll("[data-play-status]").forEach((node) => {
    node.textContent = GAME_URL.trim() ? "페이지 안에서 게임 실행" : EXTERNAL_PLAY_URL.trim() ? "새 탭에서 게임 열기" : "플레이 주소 설정 필요";
  });
}

function openGameModal() {
  if (!playModal || !gameFrame || !GAME_URL.trim()) {
    showToast("게임 주소가 아직 설정되지 않았습니다. script.js의 GAME_URL을 연결해 주세요.");
    return;
  }
  if (!gameFrame.src) gameFrame.src = GAME_URL;
  playModal.classList.add("is-open");
  playModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  if (gameNote) gameNote.textContent = "공개 정적 호스팅된 TraceBack 게임을 페이지 안에서 실행하고 있습니다.";
}

function closeGameModal() {
  if (!playModal) return;
  playModal.classList.remove("is-open");
  playModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (gameFrame) gameFrame.removeAttribute("src");
}

function setupGameModal() {
  document.querySelectorAll("[data-play-close]").forEach((element) => element.addEventListener("click", closeGameModal));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeGameModal();
  });
}

function setupVideo() {
  const videos = document.querySelectorAll("[data-video-src]");
  if (!videos.length) return;
  const loadVideo = (video) => {
    if (video.dataset.loaded === "true") return;
    video.src = video.dataset.videoSrc;
    video.dataset.loaded = "true";
    video.load();
  };
  if (!("IntersectionObserver" in window)) {
    videos.forEach(loadVideo);
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadVideo(entry.target);
      currentObserver.unobserve(entry.target);
    });
  }, { rootMargin: "280px 0px" });
  videos.forEach((video) => observer.observe(video));
}

function setupReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -8%" });
  items.forEach((item) => observer.observe(item));
}

function setupScrollEffects() {
  const progress = document.querySelector(".scroll-progress span");
  const parallaxItems = document.querySelectorAll("[data-parallax]");
  let ticking = false;

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      parallaxItems.forEach((item) => {
        const speed = Number(item.dataset.parallax || 0.05);
        const rect = item.parentElement.getBoundingClientRect();
        const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * speed;
        item.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.04)`;
      });
    }
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}

configurePlayLinks();
setupGameModal();
setupReveal();
setupScrollEffects();
setupVideo();
