// GSAP tab section
document.addEventListener("DOMContentLoaded", () => {
  const mqStacked = window.matchMedia("(max-width: 900px)");
  function isStacked() {
    return mqStacked.matches;
  }

  const allTabs = document.querySelectorAll(".tabs");

  allTabs.forEach((tabsContainer) => {
    const tabLinks = tabsContainer.querySelectorAll(".tabs_link");
    const tabContents = tabsContainer.querySelectorAll(".tabs_content");

    let activeIndex = 0;
    let isAnimating = false;

    function setInitial() {
      tabContents.forEach((c, i) => {
        if (i === activeIndex) {
          c.classList.add("active");
          if (isStacked()) {
            c.style.height = "auto";
            const h = c.getBoundingClientRect().height;
            c.style.height = h + "px";
          } else {
            c.style.width = "100%";
            c.style.flexGrow = "1";
          }
          const ov = c.querySelector(".overlay");
          if (ov) gsap.set(ov, { opacity: 1, y: 0 });
        } else {
          c.classList.remove("active");
          if (isStacked()) {
            c.style.height = "0px";
          } else {
            c.style.width = "0%";
            c.style.flexGrow = "0";
          }
          const ov = c.querySelector(".overlay");
          if (ov) gsap.set(ov, { opacity: 0, y: 20 });
        }
      });
      tabLinks.forEach((l, i) =>
        l.classList.toggle("active", i === activeIndex)
      );
    }

    function goToTab(newIndex) {
      if (newIndex === activeIndex || isAnimating) return;
      isAnimating = true;

      const fromLink = tabLinks[activeIndex];
      const toLink = tabLinks[newIndex];
      const fromPanel = tabContents[activeIndex];
      const toPanel = tabContents[newIndex];

      fromLink.classList.remove("active");
      toLink.classList.add("active");
      toPanel.classList.add("active");

      const tl = gsap.timeline({
        onComplete: () => {
          if (!isStacked()) {
            fromPanel.classList.remove("active");
          }
          isAnimating = false;
          activeIndex = newIndex;
        },
      });

      // Fade out old overlay
      tl.to(fromPanel.querySelector(".overlay"), {
        opacity: 0,
        y: 20,
        duration: 0.25,
        ease: "power2.in",
      });

      if (isStacked()) {
        // HEIGHT animation (accordion)
        const toOpenHeight = (() => {
          toPanel.style.height = "auto";
          const h = toPanel.getBoundingClientRect().height;
          toPanel.style.height = "0px";
          return h;
        })();

        tl.to(
          fromPanel,
          { height: 0, duration: 0.45, ease: "power3.inOut" },
          "<"
        ).to(
          toPanel,
          { height: toOpenHeight, duration: 0.55, ease: "power3.inOut" },
          "-=0.25"
        );
      } else {
        // WIDTH animation (desktop)
        tl.to(
          fromPanel,
          { width: "0%", flexGrow: 0, duration: 0.6, ease: "power3.inOut" },
          "<"
        ).to(
          toPanel,
          { width: "100%", flexGrow: 1, duration: 0.6, ease: "power3.inOut" },
          "-=0.4"
        );
      }

      // Fade in new overlay
      tl.to(
        toPanel.querySelector(".overlay"),
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: "power2.out",
        },
        "-=0.2"
      );
    }

    setInitial();

    tabLinks.forEach((link, index) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        goToTab(index);
      });
    });

    // Scroll/trackpad navigation
    tabsContainer.addEventListener(
      "wheel",
      (e) => {
        let newIndex = activeIndex;
        const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);

        if (!isHorizontal) {
          if (e.deltaY > 0 && activeIndex < tabLinks.length - 1) {
            e.preventDefault();
            newIndex++;
            goToTab(newIndex);
          } else if (e.deltaY < 0 && activeIndex > 0) {
            e.preventDefault();
            newIndex--;
            goToTab(newIndex);
          }
        } else {
          if (e.deltaX > 0 && activeIndex < tabLinks.length - 1) {
            e.preventDefault();
            newIndex++;
            goToTab(newIndex);
          } else if (e.deltaX < 0 && activeIndex > 0) {
            e.preventDefault();
            newIndex--;
            goToTab(newIndex);
          }
        }
      },
      { passive: false }
    );

    // Reinitialize on breakpoint change (e.g., rotate phone)
    mqStacked.addEventListener?.("change", setInitial);
    window.addEventListener("resize", () => {
      // debounce-ish: ensure open height matches content after images load
      if (isStacked()) {
        const panel = tabContents[activeIndex];
        panel.style.height = "auto";
        const h = panel.getBoundingClientRect().height;
        panel.style.height = h + "px";
      }
    });
  });
});
