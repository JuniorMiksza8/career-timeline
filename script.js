const chapters = [...document.querySelectorAll(".chapter")];
const chapterLinks = [...document.querySelectorAll("[data-chapter]")];
const progress = document.querySelector(".rail-progress");
const timelineRail = document.querySelector(".timeline-rail");
const contactForm = document.querySelector(".contact-form");
const formStatus = document.querySelector(".form-status");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const compactTimeline = window.matchMedia("(max-width: 980px)");

let activeChapterId;

const setActiveChapter = (id, reveal = true) => {
  if (!id || id === activeChapterId) return;
  activeChapterId = id;
  let activeLink;

  chapterLinks.forEach((link) => {
    const active = link.dataset.chapter === id;
    link.classList.toggle("is-active", active);

    if (active) {
      link.setAttribute("aria-current", "step");
      activeLink = link;
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (reveal && compactTimeline.matches && activeLink && timelineRail) {
    const centeredLeft =
      activeLink.offsetLeft - timelineRail.clientWidth / 2 + activeLink.clientWidth / 2;

    timelineRail.scrollTo({
      left: Math.max(centeredLeft, 0),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
};

if (chapters.length && "IntersectionObserver" in window) {
  const visibility = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });

      const visible = [...visibility.entries()].sort((a, b) => b[1] - a[1]);
      if (visible[0]?.[1] > 0) {
        setActiveChapter(visible[0][0]);
      }
    },
    {
      rootMargin: "-20% 0px -55% 0px",
      threshold: [0, 0.1, 0.2, 0.35],
    },
  );

  chapters.forEach((chapter) => observer.observe(chapter));
} else {
  const updateActiveChapter = () => {
    const target = chapters
      .map((chapter) => ({
        id: chapter.id,
        distance: Math.abs(chapter.getBoundingClientRect().top - window.innerHeight * 0.28),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    setActiveChapter(target?.id);
  };

  window.addEventListener("scroll", updateActiveChapter, { passive: true });
  updateActiveChapter();
}

const updateProgress = () => {
  if (!progress || !chapters.length) return;

  const first = chapters[0].getBoundingClientRect();
  const last = chapters[chapters.length - 1].getBoundingClientRect();
  const start = window.scrollY + first.top;
  const end = window.scrollY + last.bottom - window.innerHeight;
  const distance = Math.max(end - start, 1);
  const current = Math.min(Math.max(window.scrollY - start + window.innerHeight * 0.35, 0), distance);

  progress.style.height = `${(current / distance) * 100}%`;
};

let frame;
const requestProgressUpdate = () => {
  if (frame) return;

  frame = requestAnimationFrame(() => {
    updateProgress();
    frame = undefined;
  });
};

window.addEventListener("scroll", requestProgressUpdate, { passive: true });
window.addEventListener("resize", requestProgressUpdate);
updateProgress();

chapterLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveChapter(link.dataset.chapter, false));
});

if (chapters.length) {
  const initialId = window.location.hash.slice(1);
  const initialChapter = chapters.find((chapter) => chapter.id === initialId);
  setActiveChapter(initialChapter?.id ?? chapters[0].id, false);

  if (initialChapter) {
    window.addEventListener("load", () => {
      const alignHashTarget = () => {
        initialChapter.scrollIntoView({ behavior: "auto", block: "start" });
      };

      if (document.fonts?.ready) {
        document.fonts.ready.then(alignHashTarget);
      } else {
        alignHashTarget();
      }
    });
  }
}

if (timelineRail) {
  timelineRail.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;

    const currentIndex = chapterLinks.findIndex((link) => link === document.activeElement);
    if (currentIndex < 0) return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + direction + chapterLinks.length) % chapterLinks.length;
    chapterLinks[nextIndex].focus();
  });
}

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", () => {
    formStatus.textContent = "Sending your message…";
  });
}
