/* Tarot Sola Busca · app pt-BR */
(function () {
  "use strict";

  var DECK = (window.CARDS || []).slice().sort(function (a, b) { return a.order - b.order; });

  var GROUPS = {
    major:   { title: "Arcanos Maiores", sub: "O arquétipo e a jornada · 22 cartas" },
    copas:   { title: "Copas",           sub: "Água — emoções, amor, intuição" },
    ouros:   { title: "Ouros",           sub: "Terra — dinheiro, trabalho, saúde" },
    paus:    { title: "Paus",            sub: "Fogo — criatividade, ação, energia" },
    espadas: { title: "Espadas",         sub: "Ar — mente, conflito, comunicação" }
  };
  var ELEMENT = { copas: "Água", ouros: "Terra", paus: "Fogo", espadas: "Ar" };
  var ROMAN = ["", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X",
               "XI", "XII", "XIII", "XIIII", "XV", "XVI", "XVII", "XVIII", "XVIIII", "XX", "XXI"];

  function byId(id) { return document.getElementById(id); }
  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function imgSrc(c) { return "img/" + c.i + ".jpg"; }
  function numLabel(c) {
    if (c.suit !== "major") return "";
    var n = parseInt(c.i, 10);
    return n === 0 ? "0" : ROMAN[n];
  }

  /* ================= GALERIA ================= */
  var state = { filter: "all", query: "" };

  function matches(c) {
    if (state.filter !== "all" && c.suit !== state.filter) return false;
    if (!state.query) return true;
    var q = norm(state.query);
    return norm(c.n).indexOf(q) !== -1 ||
           norm(c.fig).indexOf(q) !== -1 ||
           norm(GROUPS[c.suit].title).indexOf(q) !== -1;
  }

  function tileHTML(c) {
    var num = numLabel(c);
    return '<article class="card-tile" data-i="' + c.i + '" tabindex="0" role="button" aria-label="' + c.n + '">' +
      (num ? '<span class="t-num">' + num + '</span>' : '') +
      '<img src="' + imgSrc(c) + '" alt="' + c.n + ' — Tarot Sola Busca" loading="lazy">' +
      '<span class="t-name">' + c.n + '</span>' +
      (c.fig ? '<span class="t-fig">' + c.fig + '</span>' : '') +
      '</article>';
  }

  function renderGallery() {
    var host = byId("gallery");
    var list = DECK.filter(matches);
    byId("emptyMsg").hidden = list.length > 0;

    var html = "";
    if (state.filter === "all") {
      Object.keys(GROUPS).forEach(function (g) {
        var items = list.filter(function (c) { return c.suit === g; });
        if (!items.length) return;
        html += '<h3 class="group-title">' + GROUPS[g].title + '</h3>' +
                '<p class="group-sub">' + GROUPS[g].sub + '</p>' +
                '<div class="grid">' + items.map(tileHTML).join("") + '</div>';
      });
    } else {
      html = '<div class="grid">' + list.map(tileHTML).join("") + '</div>';
    }
    host.innerHTML = html;
  }

  byId("filters").addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    document.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
    btn.classList.add("active");
    state.filter = btn.dataset.filter;
    renderGallery();
  });

  byId("search").addEventListener("input", function (e) {
    state.query = e.target.value.trim();
    renderGallery();
  });

  /* ================= MODAL ================= */
  var modal = byId("cardModal");

  function openCard(i) {
    var c = DECK.find(function (x) { return x.i === i; });
    if (!c) return;
    byId("modalImg").src = imgSrc(c);
    byId("modalImg").alt = c.n + " — Tarot Sola Busca";
    byId("modalTitle").textContent = c.n;

    var label = GROUPS[c.suit].title.toUpperCase();
    if (c.suit === "major") label += " · " + numLabel(c);
    else label += " · " + ELEMENT[c.suit];
    byId("modalKicker").textContent = label;

    byId("modalFig").textContent = c.fig ? "Nome gravado na carta original: «" + c.fig + "»" : "";
    byId("modalOk").textContent = c.ok;
    byId("modalRev").textContent = c.rev;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  byId("gallery").addEventListener("click", function (e) {
    var tile = e.target.closest(".card-tile");
    if (tile) openCard(tile.dataset.i);
  });
  byId("gallery").addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var tile = e.target.closest(".card-tile");
    if (tile) { e.preventDefault(); openCard(tile.dataset.i); }
  });
  modal.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  /* ================= TIRAGEM ================= */
  var drawCount = 1;

  document.querySelectorAll(".seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      drawCount = parseInt(btn.dataset.count, 10);
      byId("drawPositions").innerHTML = "";
      byId("drawHint").hidden = false;
      byId("drawHint").innerHTML = "Clique em <strong>Embaralhar e tirar</strong> para começar.";
    });
  });

  function sample(n) {
    var pool = DECK.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, n);
  }

  function draw() {
    var positions = drawCount === 3
      ? ["Passado", "Presente", "Futuro"]
      : ["Sua carta"];
    var allowRev = byId("allowReversals").checked;
    var picks = sample(drawCount).map(function (c) {
      return { card: c, rev: allowRev && Math.random() < 0.5 };
    });

    var host = byId("drawPositions");
    byId("drawHint").hidden = true;
    host.innerHTML = "";
    var note = document.getElementById("readingNote");
    if (note) note.remove();

    picks.forEach(function (p, idx) {
      var wrap = document.createElement("div");
      wrap.className = "draw-result";
      wrap.innerHTML =
        '<div class="draw-card" data-idx="' + idx + '">' +
          '<div class="draw-card-inner">' +
            '<div class="draw-face back"></div>' +
            '<div class="draw-face front"><img src="' + imgSrc(p.card) + '" alt="' + p.card.n + '"></div>' +
          '</div>' +
        '</div>' +
        '<p class="draw-slot-label">' + positions[idx] + '</p>' +
        '<div class="draw-info" hidden>' +
          '<h5>' + p.card.n + '</h5>' +
          '<span class="orient ' + (p.rev ? "reversed" : "up") + '">' + (p.rev ? "Invertida" : "Direta") + '</span>' +
          '<p>' + (p.rev ? p.card.rev : p.card.ok) + '</p>' +
        '</div>';
      host.appendChild(wrap);

      var cardEl = wrap.querySelector(".draw-card");
      setTimeout(function () { cardEl.classList.add("dealt"); }, 90 * idx + 30);
      setTimeout(function () {
        cardEl.classList.add("flipped");
        setTimeout(function () {
          wrap.querySelector(".draw-info").hidden = false;
        }, 750);
      }, 90 * idx + 650);
    });

    // nota final de leitura
    if (drawCount === 3) {
      setTimeout(function () {
        var parts = picks.map(function (p, k) {
          return positions[k] + ": " + p.card.n + " (" + (p.rev ? "invertida" : "direta") + ")";
        });
        var div = document.createElement("div");
        div.className = "reading-note";
        div.id = "readingNote";
        div.textContent = "Leia da esquerda para a direita — " + parts.join(" · ") + ". " +
          "Reflita sobre como cada mensagem se encadeia na história da sua pergunta.";
        host.parentNode.insertBefore(div, byId("drawHint"));
      }, 90 * drawCount + 1500);
    }
  }

  byId("drawBtn").addEventListener("click", draw);

  /* init */
  renderGallery();
})();