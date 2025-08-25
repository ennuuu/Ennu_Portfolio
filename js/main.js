// CUSTOM CURSOR
const cursor = document.querySelector(".custom-cursor");

document.addEventListener("mousemove", (e) => {
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";
});

const links = document.querySelectorAll("a");

links.forEach((link) => {
  link.addEventListener("mouseenter", () => {
    cursor.classList.add("hover");
  });
  link.addEventListener("mouseleave", () => {
    cursor.classList.remove("hover");
  });
});

document.addEventListener("mousedown", () => {
  cursor.classList.add("click");
});

document.addEventListener("mouseup", () => {
  cursor.classList.remove("click");
});

// ABOUT LINK
const aboutLink = document.getElementById("about-link");
const aboutImg = aboutLink.querySelector("img");

aboutLink.addEventListener("mouseenter", () => {
  aboutImg.src = "assets/about-me-hover.svg";
});
aboutLink.addEventListener("mouseleave", () => {
  aboutImg.src = "assets/about-me.svg";
});
aboutLink.addEventListener("click", (e) => {
  e.preventDefault();
  aboutImg.src = "assets/about-me-hover.svg";
  window.__pixelTransition.start(aboutLink.href);
});

// WORK LINK
const workLink = document.getElementById("work-link");
const workImg = workLink.querySelector("img");

workLink.addEventListener("mouseenter", () => {
  workImg.src = "assets/work-hover.svg";
});
workLink.addEventListener("mouseleave", () => {
  workImg.src = "assets/work.svg";
});
workLink.addEventListener("click", (e) => {
  e.preventDefault();
  workImg.src = "assets/work-hover.svg";
  window.__pixelTransition.start(workLink.href);
});

// PIXEL LOADING TRANSITION
(() => {
  const PX = 90; // tile size (px)
  const DUR = 0.22; // per-tile duration (snap)
  const ROW_DELAY = 0.035; // base delay per row (bottom→top sweep)
  const JITTER = 0.035; // random +/- per tile (raggedness)
  const WAVE_AMP = 0.06; // waviness amplitude (seconds)
  const WAVE_FREQ = 0.7; // waviness frequency across columns
  const COLOR = "#c2cbf5";

  const overlay = document.getElementById("pixel-transition");

  function setCSSVars() {
    overlay.style.setProperty("--px", PX + "px");
    overlay.style.setProperty("--color", COLOR);
  }

  function buildGrid() {
    overlay.innerHTML = "";
    setCSSVars();

    const cols = Math.ceil(window.innerWidth / PX);
    const rows = Math.ceil(window.innerHeight / PX);

    overlay.style.gridTemplateColumns = `repeat(${cols}, var(--px))`;
    overlay.style.gridAutoRows = `var(--px)`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.r = r;
        cell.dataset.c = c;
        overlay.appendChild(cell);
      }
    }
  }

  // utility: get cells + dimensions
  const getCells = () => Array.from(overlay.querySelectorAll(".cell"));
  const getRows = (cells) => Math.max(...cells.map((el) => +el.dataset.r)) + 1;

  // ragged bottom→top delay
  const seedIn = Math.random() * Math.PI * 2;
  function delayIn(cell, rows) {
    const r = +cell.dataset.r;
    const c = +cell.dataset.c;
    const base = (rows - 1 - r) * ROW_DELAY;
    const wave = Math.sin(c * WAVE_FREQ + seedIn) * WAVE_AMP;
    const jitter = (Math.random() * 2 - 1) * JITTER;
    return base + wave + jitter;
  }

  // ragged top→bottom delay (for reveal)
  function delayOutFactory() {
    const seedOut = Math.random() * Math.PI * 2;
    return function delayOut(cell) {
      const r = +cell.dataset.r;
      const c = +cell.dataset.c;
      const base = r * ROW_DELAY;
      const wave = Math.sin(c * WAVE_FREQ + seedOut) * WAVE_AMP;
      const jitter = (Math.random() * 2 - 1) * JITTER;
      return base + wave + jitter;
    };
  }

  // Cover the page with pixels (enter overlay)
  function cover(cb) {
    const cells = getCells();
    const rows = getRows(cells);

    gsap.set(overlay, { visibility: "visible", pointerEvents: "auto" });
    gsap.set(cells, {
      transformOrigin: "bottom",
      scaleY: 0,
      background: COLOR,
    });

    // animate each cell with its own delay for the ragged storm effect
    cells.forEach((cell) => {
      gsap.to(cell, {
        scaleY: 1,
        duration: DUR,
        ease: "steps(1)",
        delay: delayIn(cell, rows),
      });
    });

    const total = (rows - 1) * ROW_DELAY + WAVE_AMP + JITTER + DUR + 0.05;
    gsap.delayedCall(total, () => cb && cb());
  }

  // Reveal the page (exit overlay)
  function reveal() {
    const cells = getCells();
    const delayOut = delayOutFactory();

    cells.forEach((cell) => {
      gsap.to(cell, {
        scaleY: 0,
        duration: DUR,
        ease: "steps(1)",
        delay: delayOut(cell),
      });
    });

    const rows = getRows(cells);
    const total = (rows - 1) * ROW_DELAY + WAVE_AMP + JITTER + DUR + 0.05;
    gsap.delayedCall(total, () => {
      gsap.set(overlay, { visibility: "hidden", pointerEvents: "none" });
    });
  }

  // Public starter
  function startPageTransition(url) {
    cover(() => {
      window.location.href = url;
    });
  }
  window.__pixelTransition = { start: startPageTransition };

  // Build on load + on resize
  buildGrid();
  window.addEventListener("resize", buildGrid);

  // First load: quick “in then out” for the entrance
  cover(() => reveal());

  // Intercept same-origin link clicks
  (() => {
    let lock = false;

    document.addEventListener("click", (e) => {
      if (lock) return;
      const a = e.target.closest("a");
      if (!a) return;

      // ignore new tab / modified clicks
      if (
        a.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#")) return; // in-page anchors
      if (a.protocol === "mailto:" || a.protocol === "tel:") return;

      // different origin -> let browser handle it
      if (a.origin !== window.location.origin) return;
      // same URL -> do nothing
      if (a.href === window.location.href) return;

      e.preventDefault();
      lock = true;

      startPageTransition(a.href);

      // failsafe unlock
      setTimeout(() => {
        lock = false;
      }, 4000);
    });
  })();
})();
