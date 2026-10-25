/* Modo "Probar con mi negocio": personalización guardada en el navegador, límites visibles y paso a la versión completa.
   Se carga con: <script src="https://leandrotvr.github.io/prueba.js"></script> */
(function () {
  if (window.LMPrueba) return;
  // ===== Editá solo esta sección: precios, links de pago y textos de los planes =====
  var P = {
    wa: "5493777416857",
    // Link de suscripción de Mercado Pago por producto. Vacío = el botón abre WhatsApp en su lugar.
    mp: { turnos: "", catalogo: "", cobros: "", stock: "", pack: "" },
    precios: { turnos: 9900, catalogo: 7900, cobros: 7900, stock: 9900, pack: 24900 },
    nombres: { turnos: "Turnos online con seña", catalogo: "Catálogo y pedidos por WhatsApp", cobros: "Cobros y recordatorios", stock: "Control de stock" },
    incluye: {
      turnos: "Cobro real de la seña con Mercado Pago, agenda sin límites y aviso inmediato cuando alguien reserva.",
      catalogo: "Todos los productos que quieras, tu propio link y cambios cuando actualices tus precios.",
      cobros: "Todos tus clientes y vencimientos, con recordatorios que llevan tu link de pago.",
      stock: "Productos ilimitados, ventas, compras y avisos de reposición."
    },
    vigencia: "Precios por mes, en pesos argentinos, vigentes a octubre 2026."
  };
  // ================================================================================
  function money(n) { return "$" + Number(n).toLocaleString("es-AR"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sk(key) { return "lm_prueba_" + key; }
  function load(key) { try { var s = localStorage.getItem(sk(key)); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function save(key, o) { try { localStorage.setItem(sk(key), JSON.stringify(o)); return true; } catch (e) { return false; } }
  function reset(key) { try { localStorage.removeItem(sk(key)); } catch (e) {} }
  function waLink(txt) { return "https://wa.me/" + P.wa + "?text=" + encodeURIComponent(txt); }

  var CSS = ".lmp-bar{position:fixed;left:0;right:0;bottom:0;z-index:2147482500;background:#12201A;color:#EAF0EC;font:600 14px/1.3 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;padding:10px 14px;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;box-shadow:0 -4px 16px rgba(0,0,0,.25)}" +
    ".lmp-bar span{opacity:.95}.lmp-b{border:0;border-radius:10px;padding:9px 14px;font:700 14px system-ui,sans-serif;cursor:pointer;background:#5FD3B3;color:#12201A}" +
    ".lmp-b.o{background:transparent;color:#EAF0EC;border:1.5px solid rgba(255,255,255,.4)}.lmp-b.g{background:#1FA855;color:#fff;text-decoration:none;display:inline-block;text-align:center}" +
    ".lmp-ov{position:fixed;inset:0;z-index:2147483200;background:rgba(10,20,15,.6);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}" +
    ".lmp-m{background:#fff;color:#17221D;width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;padding:20px 20px 24px}" +
    "@media(min-width:600px){.lmp-ov{align-items:center}.lmp-m{border-radius:20px}}" +
    ".lmp-m h2{margin:0 0 4px;font-size:21px}.lmp-m p{margin:0 0 12px;color:#3B4842;font-size:14px}" +
    ".lmp-m label{display:block;font:700 13px system-ui,sans-serif;margin:12px 0 4px}.lmp-m small{display:block;color:#55625B;font-size:12.5px;margin-top:3px}" +
    ".lmp-m input,.lmp-m textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #D3DAD5;border-radius:10px;font:15px system-ui,sans-serif;color:#17221D;background:#fff}" +
    ".lmp-m input[type=color]{height:44px;padding:3px}.lmp-m textarea{min-height:130px;resize:vertical}" +
    ".lmp-err{background:#FBE7E5;color:#B3261E;border-radius:10px;padding:10px 12px;font-size:13.5px;margin-top:12px}" +
    ".lmp-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.lmp-row .lmp-b{flex:1;min-width:120px;padding:12px}" +
    ".lmp-price{background:#F0F4EF;border-radius:14px;padding:14px 16px;margin:10px 0}.lmp-price b{font-size:26px}.lmp-price small{display:inline;font-size:13px}" +
    ".lmp-x{float:right;background:none;border:0;font-size:24px;cursor:pointer;color:#55625B;line-height:1}body{padding-bottom:64px}";
  function css() { if (document.getElementById("lmp-css")) return; var s = document.createElement("style"); s.id = "lmp-css"; s.textContent = CSS; document.head.appendChild(s); }
  function el(html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstChild; }
  function close(ov) { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); }

  function plans(key, why) {
    css();
    var n = P.nombres[key] || "", pr = P.precios[key], pk = P.precios.pack;
    var mp = P.mp[key] || "";
    var cta = mp ? '<a class="lmp-b" style="text-decoration:none;display:block;text-align:center" href="' + esc(mp) + '" target="_blank" rel="noopener">Pagar con Mercado Pago</a>' : "";
    var ov = el('<div class="lmp-ov" role="dialog" aria-modal="true"><div class="lmp-m"><button class="lmp-x" aria-label="Cerrar">×</button>' +
      "<h2>Versión completa</h2><p>" + (why ? esc(why) + " " : "") + "<b>" + esc(n) + "</b>: " + esc(P.incluye[key] || "") + "</p>" +
      '<div class="lmp-price"><b>' + money(pr) + "</b> <small>por mes</small><br><small>Pack con los 4 productos: <b>" + money(pk) + "</b> por mes</small></div>" +
      "<p>Si pasás a la versión completa la dejo armada con tus datos reales. Tu configuración de prueba se guarda solo en este navegador.</p>" +
      '<div class="lmp-row">' + cta + '<a class="lmp-b g" href="' + waLink("Hola Leandro, probé la versión gratis de " + n + " y quiero la completa.") + '" target="_blank" rel="noopener">Consultar por WhatsApp</a></div>' +
      '<p style="margin-top:12px"><small>' + esc(P.vigencia) + "</small></p></div></div>");
    ov.querySelector(".lmp-x").onclick = function () { close(ov); };
    ov.addEventListener("click", function (e) { if (e.target === ov) close(ov); });
    document.body.appendChild(ov);
  }

  function form(o) {
    css();
    var cur = load(o.key) || {};
    var body = o.fields.map(function (f) {
      var v = cur[f.id] != null ? cur[f.id] : (f.def != null ? f.def : "");
      if (f.type === "list") v = (Array.isArray(v) ? v : []).join("\n");
      var c = f.type === "list" ? '<textarea id="lmpf-' + f.id + '" placeholder="' + esc(f.placeholder || "") + '">' + esc(v) + "</textarea>" :
        '<input id="lmpf-' + f.id + '" type="' + (f.type || "text") + '" value="' + esc(v) + '" placeholder="' + esc(f.placeholder || "") + '">';
      return '<label for="lmpf-' + f.id + '">' + esc(f.label) + "</label>" + c + (f.hint ? "<small>" + esc(f.hint) + "</small>" : "");
    }).join("");
    var ov = el('<div class="lmp-ov" role="dialog" aria-modal="true"><div class="lmp-m"><button class="lmp-x" aria-label="Cerrar">×</button><h2>' + esc(o.title) + "</h2><p>" + esc(o.intro || "") + " <b>Límite de la prueba gratis:</b> " + esc(o.limit) + ".</p>" + body +
      '<div id="lmp-err"></div><div class="lmp-row"><button class="lmp-b" id="lmp-save">Guardar y ver mi prueba</button>' + (cur && Object.keys(cur).length ? '<button class="lmp-b o" style="color:#17221D;border-color:#D3DAD5" id="lmp-reset">Borrar mi prueba</button>' : "") + "</div></div></div>");
    function err(t, up) { var e = ov.querySelector("#lmp-err"); e.innerHTML = t ? '<div class="lmp-err">' + esc(t) + (up ? ' <a href="#" id="lmp-up">Ver la versión completa</a>' : "") + "</div>" : ""; var u = ov.querySelector("#lmp-up"); if (u) u.onclick = function (ev) { ev.preventDefault(); close(ov); plans(o.key, "La prueba tiene un tope."); }; }
    ov.querySelector(".lmp-x").onclick = function () { close(ov); };
    ov.addEventListener("click", function (e) { if (e.target === ov) close(ov); });
    ov.querySelector("#lmp-save").onclick = function () {
      var vals = {};
      for (var i = 0; i < o.fields.length; i++) {
        var f = o.fields[i], raw = ov.querySelector("#lmpf-" + f.id).value;
        if (f.type === "list") {
          var lines = raw.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
          if (f.req && !lines.length) return err("Completá: " + f.label + ".");
          if (f.max && lines.length > f.max) return err("La prueba gratis permite hasta " + f.max + " líneas en «" + f.label + "». Tenés " + lines.length + ".", true);
          vals[f.id] = lines;
        } else {
          raw = raw.trim();
          if (f.req && !raw) return err("Completá: " + f.label + ".");
          vals[f.id] = f.type === "number" ? Number(raw.replace(/[^\d.]/g, "")) || 0 : raw;
        }
      }
      var msg = o.check ? o.check(vals) : "";
      if (msg) return err(msg);
      if (!save(o.key, vals)) return err("Tu navegador no permite guardar datos (¿modo privado?). Probá en una ventana normal.");
      location.reload();
    };
    var r = ov.querySelector("#lmp-reset");
    if (r) r.onclick = function () { reset(o.key); location.reload(); };
    document.body.appendChild(ov);
  }

  function mount(o) {
    css();
    var cfg = load(o.key);
    var bar = el('<div class="lmp-bar" role="region" aria-label="Versión de prueba"></div>');
    if (cfg) {
      bar.innerHTML = "<span>Versión de prueba gratis · " + esc(o.limit) + '</span><button class="lmp-b o" id="lmp-ed">Editar</button><button class="lmp-b" id="lmp-up">Pasar a la completa · ' + money(P.precios[o.key]) + "/mes</button>";
    } else {
      bar.innerHTML = "<span>¿Es para tu " + esc(o.cosa || "negocio") + "? Probalo gratis con tus datos.</span>" + '<button class="lmp-b" id="lmp-ed">Probar con mi ' + esc(o.cosa || "negocio") + '</button><button class="lmp-b o" id="lmp-up">Ver precio</button>';
    }
    bar.querySelector("#lmp-ed").onclick = function () { form(o); };
    bar.querySelector("#lmp-up").onclick = function () { plans(o.key); };
    document.body.appendChild(bar);
  }

  window.LMPrueba = { planes: P, money: money, load: load, save: save, reset: reset, mount: mount, plans: plans, esc: esc, waLink: waLink };
})();
