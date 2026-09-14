/* Drops documentation, shared progressive enhancement.
   Nothing here is required to read the site. It adds a theme toggle,
   local search over search-index.json, and copy buttons on code blocks.
   No network calls other than the same-origin search index. No analytics. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---- theme ---------------------------------------------------------- */

  var STORE = "drops-theme";
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  }

  function apply(mode) {
    if (mode === "light" || mode === "dark") {
      root.setAttribute("data-theme", mode);
    } else {
      root.removeAttribute("data-theme");
    }
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var effective = mode || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    btn.textContent = effective === "dark" ? "◑" : "◐";
    btn.setAttribute("aria-label", "Switch to " + (effective === "dark" ? "light" : "dark") + " theme");
    btn.setAttribute("title", "Switch to " + (effective === "dark" ? "light" : "dark") + " theme");
  }

  apply(stored());

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest && ev.target.closest("#theme-toggle");
    if (!btn) return;
    var current = root.getAttribute("data-theme");
    if (!current) {
      current = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var next = current === "dark" ? "light" : "dark";
    try { localStorage.setItem(STORE, next); } catch (e) { /* private mode */ }
    apply(next);
  });

  /* ---- copy buttons --------------------------------------------------- */

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest && ev.target.closest(".copy");
    if (!btn) return;
    var block = btn.parentNode.querySelector("pre code, pre");
    if (!block) return;
    var text = block.textContent;
    var done = function () {
      var old = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = old; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    }
  });

  /* ---- search --------------------------------------------------------- */

  var input = document.getElementById("site-search");
  var list = document.getElementById("search-results");
  if (!input || !list) return;

  var base = input.getAttribute("data-base") || "";
  var index = null;
  var loading = false;
  var pending = false;

  function load() {
    if (index || loading) return;
    loading = true;
    fetch(base + "search-index.json", { credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (data) {
        index = Array.isArray(data) ? data : [];
        loading = false;
        if (pending) { pending = false; run(); }
      })
      .catch(function () { index = []; loading = false; });
  }

  input.addEventListener("focus", load, { once: true });

  function score(entry, terms) {
    var title = (entry.title || "").toLowerCase();
    var heading = (entry.heading || "").toLowerCase();
    var text = (entry.text || "").toLowerCase();
    var aliases = (entry.aliases || []).join(" ").toLowerCase();
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var hit = 0;
      if (heading.indexOf(t) === 0) hit += 60;
      else if (heading.indexOf(t) > -1) hit += 34;
      if (title.indexOf(t) > -1) hit += 22;
      if (aliases.indexOf(t) > -1) hit += 30;
      if (text.indexOf(t) > -1) hit += 10;
      if (!hit) return 0;
      total += hit;
    }
    return total;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(rows, query) {
    list.innerHTML = "";
    if (!query) return;
    if (!rows.length) {
      var li = document.createElement("li");
      li.className = "search__empty";
      li.textContent = 'Nothing matched "' + query + '". Try a marker such as drops-pact, a field such as bodySha256, or a topic such as reorg.';
      list.appendChild(li);
      return;
    }
    var html = "";
    for (var i = 0; i < rows.length; i++) {
      var e = rows[i];
      html += '<li><a href="' + base + esc(e.url) + '">' +
        "<em>" + esc(e.title) + "</em>" +
        "<b>" + esc(e.heading) + "</b>" +
        "<span>" + esc((e.text || "").slice(0, 130)) + "</span>" +
        "</a></li>";
    }
    list.innerHTML = html;
  }

  function run() {
    var q = input.value.trim().toLowerCase();
    if (!q) { render([], ""); return; }
    if (!index) { pending = true; load(); return; }
    var terms = q.split(/\s+/).filter(Boolean);
    var rows = [];
    for (var i = 0; i < index.length; i++) {
      var s = score(index[i], terms);
      if (s > 0) rows.push({ s: s, e: index[i] });
    }
    rows.sort(function (a, b) { return b.s - a.s; });
    render(rows.slice(0, 10).map(function (r) { return r.e; }), q);
  }

  var timer = null;
  input.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(run, 110);
  });

  input.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { input.value = ""; render([], ""); input.blur(); }
    if (ev.key === "ArrowDown") {
      var first = list.querySelector("a");
      if (first) { ev.preventDefault(); first.focus(); }
    }
  });

  list.addEventListener("keydown", function (ev) {
    var links = Array.prototype.slice.call(list.querySelectorAll("a"));
    var i = links.indexOf(document.activeElement);
    if (ev.key === "ArrowDown" && i > -1 && links[i + 1]) { ev.preventDefault(); links[i + 1].focus(); }
    if (ev.key === "ArrowUp") {
      ev.preventDefault();
      if (i > 0) links[i - 1].focus(); else input.focus();
    }
    if (ev.key === "Escape") { input.focus(); render([], ""); }
  });

  document.addEventListener("click", function (ev) {
    if (!list.contains(ev.target) && ev.target !== input) render([], "");
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "/" || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (document.activeElement && document.activeElement.isContentEditable) return;
    ev.preventDefault();
    input.focus();
    input.select();
  });
})();
