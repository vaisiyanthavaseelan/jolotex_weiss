(function () {
  "use strict";

  /* Fullscreen menu overlay */
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-site-menu]");

  function closeMenu() {
    if (!menuToggle) return;
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.removeAttribute("data-menu-open");
  }
  function openMenu() {
    if (!menuToggle) return;
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.setAttribute("data-menu-open", "true");
  }
  if (menuToggle && menu) {
    menuToggle.addEventListener("click", function () {
      var isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMenu(); else openMenu();
    });
    menu.querySelectorAll("[data-menu-link]").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* Masthead solid background on scroll + keep --header-h in sync */
  var masthead = document.querySelector("[data-masthead]");
  if (masthead) {
    window.addEventListener("scroll", function () {
      masthead.classList.toggle("is-scrolled", window.scrollY > 12);
    }, { passive: true });

    var syncHeaderHeight = function () {
      document.documentElement.style.setProperty("--header-h", masthead.offsetHeight + "px");
    };
    syncHeaderHeight();
    window.addEventListener("resize", syncHeaderHeight);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncHeaderHeight);
    }
  }

  /* Chapter progress dots: reveal after first scroll + active-state tracking */
  var chapterNav = document.querySelector("[data-chapter-nav]");
  if (chapterNav) {
    var shown = false;
    window.addEventListener("scroll", function () {
      if (!shown && window.scrollY > window.innerHeight * 0.6) {
        chapterNav.classList.add("is-visible");
        shown = true;
      }
    }, { passive: true });

    var dots = Array.prototype.slice.call(chapterNav.querySelectorAll("[data-chapter-dot]"));
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var target = document.querySelector(dot.getAttribute("data-target"));
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    });
    var sections = dots
      .map(function (dot) { return document.querySelector(dot.getAttribute("data-target")); })
      .filter(Boolean);
    if ("IntersectionObserver" in window && sections.length) {
      var navIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var idx = sections.indexOf(entry.target);
          if (idx === -1) return;
          if (entry.isIntersecting) {
            dots.forEach(function (d) { d.classList.remove("is-active"); });
            dots[idx].classList.add("is-active");
          }
        });
      }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
      sections.forEach(function (s) { navIO.observe(s); });
    }
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Gewerke accordion + image-swap stage */
  var ICON_BERATUNG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>';
  var STAGE_DATA = {
    beratung: { index: "01", name: "Beratung", solid: true, icon: ICON_BERATUNG },
    abriss: { index: "02", name: "Abriss", main: ["assets/images/optimized/pf-abriss-g3-480.webp", "Rückgebautes Gebäude in einem Waldgrundstück"] },
    rohbau: { index: "03", name: "Rohbau", main: ["assets/images/optimized/pf-rohbau-hero-900.webp", "Rohbau eines Wohnhauses mit Gerüst"] },
    trockenbau: { index: "04", name: "Trockenbau", main: ["assets/images/optimized/pf-trockenbau-g1-480.webp", "Trockenbauplatten im Rohzustand"] },
    fliesen: { index: "05", name: "Fliesen", ba: [
      ["assets/images/optimized/pf-fliesen-g5-480.webp", "Bad vorher: Mosaikfliesen werden verlegt"],
      ["assets/images/optimized/pf-fliesen-g3-480.webp", "Bad nachher: fertiges Bad mit Sechseckfliesen"]
    ] },
    fassade: { index: "06", name: "Fassade", ba: [
      ["assets/images/optimized/pf-fassade-g1-480.webp", "Fassade vorher: Gerüst mit grauem Grundputz"],
      ["assets/images/optimized/pf-fassade-g4-480.webp", "Fassade nachher: fertiger gelber Anstrich"]
    ] },
    sanierung: { index: "07", name: "Sanierung", main: ["assets/images/optimized/pf-sanierung-hero-900.webp", "Sanierung einer Brückenunterführung"] }
  };

  var accordion = document.querySelector("[data-accordion]");
  if (accordion) {
    var items = Array.prototype.slice.call(accordion.querySelectorAll(".gewerke__item"));
    var stage = accordion.querySelector("[data-stage]");
    var stageIndexEl = stage && stage.querySelector("[data-stage-index]");
    var stageNameEl = stage && stage.querySelector("[data-stage-name]");
    var stageBodyEl = stage && stage.querySelector("[data-stage-body]");

    function setStage(key) {
      var data = STAGE_DATA[key];
      if (!data || !stage) return;
      stageIndexEl.textContent = data.index;
      stageNameEl.textContent = data.name;
      if (data.solid) {
        stageBodyEl.innerHTML =
          '<div class="gewerke__stage-solid is-active">' + data.icon + '<span>Gewerk ' + data.index + '</span><strong>' + data.name + "</strong></div>";
      } else if (data.ba) {
        stageBodyEl.innerHTML =
          '<div class="gewerke__stage-compare">' +
            '<figure class="gewerke__compare-item gewerke__compare-item--before"><img src="' + data.ba[0][0] + '" alt="' + data.ba[0][1] + '"><span class="gewerke__compare-tag">Vorher</span></figure>' +
            '<figure class="gewerke__compare-item gewerke__compare-item--after"><img src="' + data.ba[1][0] + '" alt="' + data.ba[1][1] + '"><span class="gewerke__compare-tag">Nachher</span></figure>' +
            '<div class="gewerke__compare-badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>' +
          '</div>';
      } else {
        stageBodyEl.innerHTML = '<img class="gewerke__stage-main" src="' + data.main[0] + '" alt="' + data.main[1] + '">';
      }
    }

    function setPanelHeight(item, open) {
      var panel = item.querySelector(".gewerke__panel");
      panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
    }

    items.forEach(function (item) {
      var trigger = item.querySelector("[data-trigger]");
      var key = item.getAttribute("data-gewerke");
      trigger.addEventListener("click", function () {
        var wasOpen = item.classList.contains("is-open");
        items.forEach(function (i) {
          i.classList.remove("is-open");
          i.querySelector("[data-trigger]").setAttribute("aria-expanded", "false");
          setPanelHeight(i, false);
        });
        if (!wasOpen) {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
          setPanelHeight(item, true);
          setStage(key);
        }
      });
      trigger.addEventListener("mouseenter", function () { setStage(key); });
    });

    window.addEventListener("resize", function () {
      var openItem = accordion.querySelector(".gewerke__item.is-open");
      if (openItem) setPanelHeight(openItem, true);
    });

    var initiallyOpen = accordion.querySelector(".gewerke__item.is-open");
    if (initiallyOpen) {
      setPanelHeight(initiallyOpen, true);
      setStage(initiallyOpen.getAttribute("data-gewerke"));
    }
    accordion.addEventListener("mouseleave", function () {
      var openItem = accordion.querySelector(".gewerke__item.is-open");
      if (openItem) setStage(openItem.getAttribute("data-gewerke"));
    });
  }

  /* Reviews rotator */
  var viewer = document.querySelector("[data-review-viewer]");
  if (viewer) {
    var quotes = Array.prototype.slice.call(viewer.querySelectorAll("[data-review]"));
    var dotsWrap = document.querySelector("[data-review-dots]");
    var reviewDots = dotsWrap ? Array.prototype.slice.call(dotsWrap.children) : [];
    var current = 0;
    var timer;

    function showReview(index) {
      current = (index + quotes.length) % quotes.length;
      quotes.forEach(function (q, i) { q.classList.toggle("is-active", i === current); });
      reviewDots.forEach(function (d, i) { d.classList.toggle("is-active", i === current); });
    }
    function restartAutoplay() {
      clearInterval(timer);
      timer = setInterval(function () { showReview(current + 1); }, 7000);
    }

    var prevBtn = document.querySelector("[data-review-prev]");
    var nextBtn = document.querySelector("[data-review-next]");
    if (prevBtn) prevBtn.addEventListener("click", function () { showReview(current - 1); restartAutoplay(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { showReview(current + 1); restartAutoplay(); });
    reviewDots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { showReview(i); restartAutoplay(); });
    });
    restartAutoplay();
  }

  /* Contact form: validation + mailto handoff */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector(".form-status");

    function errorWrap(field) {
      return field.type === "checkbox" ? field.closest(".consent") : field.closest(".contact-form__field");
    }
    function setError(field) {
      var wrap = errorWrap(field);
      if (wrap) wrap.classList.add("has-error");
    }
    function clearError(field) {
      var wrap = errorWrap(field);
      if (wrap) wrap.classList.remove("has-error");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      var required = form.querySelectorAll("[required]");
      required.forEach(function (field) {
        clearError(field);
        var value = field.type === "checkbox" ? field.checked : field.value.trim();
        if (!value) {
          setError(field);
          valid = false;
          return;
        }
        if (field.type === "email") {
          var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!re.test(value)) {
            setError(field);
            valid = false;
          }
        }
      });

      status.classList.remove("is-visible", "is-success", "is-error");
      if (!valid) {
        status.textContent = "Bitte prüfen Sie die markierten Felder.";
        status.classList.add("is-visible", "is-error");
        var firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
        if (firstError) firstError.focus();
        return;
      }

      var data = new FormData(form);
      var leistung = data.get("leistung") || "Allgemeine Anfrage";
      var subject = "Anfrage über jolotex.de: " + leistung;
      var bodyLines = [
        "Name: " + data.get("name"),
        "E-Mail: " + data.get("email"),
        "Telefon: " + (data.get("telefon") || "-"),
        "Leistung: " + leistung,
        "",
        "Nachricht:",
        data.get("nachricht")
      ];
      var mailto = "mailto:info@jolotex.de?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyLines.join("\n"));
      window.location.href = mailto;

      status.textContent = "Ihr E-Mail-Programm öffnet sich mit den ausgefüllten Angaben. Bitte senden Sie die Nachricht dort final ab.";
      status.classList.add("is-visible", "is-success");
    });

    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("input", function () { clearError(field); });
      field.addEventListener("change", function () { clearError(field); });
    });
  }

  /* Current year in footer */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Floating "Angebot anfordern" button */
  var floatCta = document.querySelector("[data-float-cta]");
  if (floatCta) {
    var kontaktSection = document.getElementById("kontakt");
    var cornerWatchEls = Array.prototype.slice.call(document.querySelectorAll(".stimmen__partners-grid, .cta-band"));
    var overlapsCorner = function (el) {
      var r = el.getBoundingClientRect();
      return r.bottom > window.innerHeight - 90 && r.top < window.innerHeight && r.right > window.innerWidth - 220;
    };
    var updateFloatCta = function () {
      var pastCover = window.scrollY > window.innerHeight * 0.9;
      var hideForKontakt = false;
      if (kontaktSection) {
        var r = kontaktSection.getBoundingClientRect();
        hideForKontakt = r.top < window.innerHeight * 0.6 && r.bottom > 0;
      }
      var hideForCorner = cornerWatchEls.some(overlapsCorner);
      floatCta.classList.toggle("is-visible", pastCover && !hideForKontakt && !hideForCorner);
    };
    updateFloatCta();
    window.addEventListener("scroll", updateFloatCta, { passive: true });
    window.addEventListener("resize", updateFloatCta);
  }
})();
