/* Barra de navegación común a todos los proyectos de Leandro Maciel.
   Se carga con: <script src="https://leandrotvr.github.io/nav.js" defer></script> */
(function () {
  if (window.__lmNav) return; window.__lmNav = true;
  // Contador de visitas (GoatCounter). Poné acá SOLO el nombre de tu cuenta, ej.: "leandromaciel". Vacío = no cuenta nada.
  var GOATCOUNTER = "leandrotvr";
  if (GOATCOUNTER && !(window.CONFIG && window.CONFIG.goatcounter)) {
    var gc = document.createElement("script"); gc.async = true;
    gc.setAttribute("data-goatcounter", "https://" + GOATCOUNTER + ".goatcounter.com/count");
    gc.src = "https://gc.zgo.at/count.js"; document.head.appendChild(gc);
  }
  var B = "https://leandrotvr.github.io";
  var items = [
    { k: "inicio",   t: "Inicio",     h: B + "/",                                   m: /^\/$|^\/index\.html$/ },
    { k: "turnos",   t: "Turnos",     h: B + "/demo-turnos/",                       m: /^\/demo-turnos\// },
    { k: "cobros",   t: "Cobros",     h: B + "/cobros/",                            m: /^\/cobros\// },
    { k: "catalogo", t: "Catálogo",   h: B + "/catalogo/",                          m: /^\/catalogo\// },
    { k: "stock",    t: "Stock",      h: B + "/portfolio-automatizaciones/#caso-stock", m: null },
    { k: "planillas",t: "Planillas",  h: B + "/portfolio-automatizaciones/",        m: /^\/portfolio-automatizaciones\// }
  ];
  var path = location.pathname, hash = location.hash;
  var css = ".lm-nav{grid-column:1/-1;justify-self:stretch;width:100%;min-width:0;box-sizing:border-box;position:sticky;top:0;z-index:2147483000;background:#12201A;color:#EAF0EC;font:600 14px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.18)}" +
    ".lm-nav-in{min-width:0;max-width:1100px;margin:0 auto;padding:0 14px;display:flex;align-items:center;gap:6px;min-height:46px}" +
    ".lm-nav a{color:#C6D6CE;text-decoration:none;padding:8px 11px;border-radius:999px;white-space:nowrap}" +
    ".lm-nav a:hover{background:rgba(255,255,255,.1);color:#fff}" +
    ".lm-nav a.lm-on{background:#5FD3B3;color:#12201A}" +
    ".lm-nav .lm-brand{color:#fff;font-weight:800;margin-right:6px;padding-left:0}" +
    ".lm-nav .lm-links{min-width:0;display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;flex:1}" +
    ".lm-nav .lm-links::-webkit-scrollbar{display:none}" +
    ".lm-nav .lm-wa{background:#0B7A63;color:#fff;margin-left:auto}" +
    "@media(max-width:560px){.lm-nav .lm-brand span{display:none}.lm-nav .lm-wa{display:none}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var nav = document.createElement("nav"); nav.className = "lm-nav"; nav.setAttribute("aria-label", "Proyectos de Leandro Maciel");
  var links = items.map(function (i) {
    var on = i.k === "stock" ? (/^\/portfolio-automatizaciones\//.test(path) && hash === "#caso-stock") :
             i.k === "planillas" ? (/^\/portfolio-automatizaciones\//.test(path) && hash !== "#caso-stock") : i.m.test(path);
    return '<a href="' + i.h + '"' + (on ? ' class="lm-on" aria-current="page"' : "") + ">" + i.t + "</a>";
  }).join("");
  nav.innerHTML = '<div class="lm-nav-in"><a class="lm-brand" href="' + B + '/">LM<span> · Leandro Maciel</span></a><div class="lm-links">' + links +
    '</div><a class="lm-wa" href="https://wa.me/5493777416857?text=Hola%20Leandro%2C%20vi%20tu%20p%C3%A1gina%20y%20quiero%20consultarte" target="_blank" rel="noopener">WhatsApp</a></div>';
  function mount() { document.body.insertBefore(nav, document.body.firstChild); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
