/* Modo "Probar con mi negocio" + versión completa activada por pago.
   Se carga con: <script src="https://leandrotvr.github.io/prueba.js"></script> */
(function () {
  if (window.LMPrueba) return;
  // ===== Editá solo esta sección: precios, links de pago y textos de los planes =====
  var P = {
    wa: "5493777416857",
    mp: { turnos: "https://mpago.la/1A4Y8eH", catalogo: "https://mpago.la/1Yj1BTN", cobros: "https://mpago.la/2JgAaqh", stock: "https://mpago.la/2uWuK1q", pack: "https://mpago.la/1N9wukc" },
    precios: { turnos: 9900, catalogo: 7900, cobros: 7900, stock: 9900, pack: 24900 },
    nombres: { turnos: "Turnos online con seña", catalogo: "Catálogo y pedidos por WhatsApp", cobros: "Cobros y recordatorios", stock: "Control de stock" },
    incluye: {
      turnos: "Reservas reales de tus clientes, agenda sin límites y todos tus horarios.",
      catalogo: "Todos los productos que quieras, tu propio link y cambios cuando actualices tus precios.",
      cobros: "Todos tus clientes y vencimientos, con recordatorios que llevan tu link de pago.",
      stock: "Productos ilimitados, cantidades que se guardan solas, avisos de reposición y pedido al proveedor por WhatsApp."
    },
    vigencia: "Precios por mes, en pesos argentinos, vigentes a octubre 2026.",
    sb: { url: "https://hodjmhsqcbmyyjdkxmxp.supabase.co", key: "sb_publishable_XN9f3BDQe3sUNnh3PYglZA_my11T3_M" }
  };
  // ================================================================================
  function money(n) { return "$" + Number(n).toLocaleString("es-AR"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sk(key) { return "lm_prueba_" + key; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function waLink(txt) { return "https://wa.me/" + P.wa + "?text=" + encodeURIComponent(txt); }

  /* ---------- Backend ---------- */
  function rpcSync(name, args) {
    try {
      var x = new XMLHttpRequest(); x.open("POST", P.sb.url + "/rest/v1/rpc/" + name, false);
      x.setRequestHeader("apikey", P.sb.key); x.setRequestHeader("Content-Type", "application/json");
      x.send(JSON.stringify(args));
      if (x.status >= 200 && x.status < 300) return x.responseText ? JSON.parse(x.responseText) : null;
    } catch (e) {}
    return undefined;
  }
  function rpc(name, args) {
    return fetch(P.sb.url + "/rest/v1/rpc/" + name, { method: "POST", headers: { apikey: P.sb.key, "Content-Type": "application/json" }, body: JSON.stringify(args) })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} if (!r.ok) throw new Error((j && j.message) || String(r.status)); return j; }); });
  }
  function syncCuenta(codigo) {
    return fetch(P.sb.url + "/functions/v1/lm-sync", { method: "POST", headers: { apikey: P.sb.key, "Content-Type": "application/json" }, body: JSON.stringify({ codigo: codigo }) })
      .then(function (r) { return r.json(); }).catch(function () { return {}; });
  }

  /* ---------- Cuenta (versión completa) ---------- */
  var qs = new URLSearchParams(location.search), C_COD = qs.get("c"), C_KEY = qs.get("k"), ACC = null;
  if (C_COD && /^[a-z0-9]{6,12}$/i.test(C_COD)) {
    var v = C_KEY ? rpcSync("lm_admin", { p_codigo: C_COD, p_clave: C_KEY }) : undefined;
    if (v) { ACC = v; ACC.admin = true; ACC.clave = C_KEY; }
    else { v = rpcSync("lm_ver", { p_codigo: C_COD }); ACC = v ? v : { error: true }; ACC.admin = false; }
    ACC.codigo = C_COD;
  }
  var ACTIVO = !!(ACC && ACC.estado === "activo");
  function cuentaLocal(key) { try { return JSON.parse(lsGet("lm_cuenta_" + key)) || null; } catch (e) { return null; } }
  function load(key) {
    if (ACC && ACC.producto === key && ACC.config) return ACC.config;
    try { var s = lsGet(sk(key)); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  function save(key, o) { return lsSet(sk(key), JSON.stringify(o)); }
  function reset(key) { lsDel(sk(key)); }

  /* ---------- Estilos y helpers de UI ---------- */
  var CSS = ".lmp-bar{position:fixed;left:0;right:0;bottom:0;z-index:2147482500;background:#12201A;color:#EAF0EC;font:600 14px/1.3 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;padding:10px 14px;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;box-shadow:0 -4px 16px rgba(0,0,0,.25)}" +
    ".lmp-bar span{opacity:.95}.lmp-b{border:0;border-radius:10px;padding:9px 14px;font:700 14px system-ui,sans-serif;cursor:pointer;background:#5FD3B3;color:#12201A;text-decoration:none;display:inline-block;text-align:center}" +
    ".lmp-b.o{background:transparent;color:#EAF0EC;border:1.5px solid rgba(255,255,255,.4)}.lmp-b.g{background:#1FA855;color:#fff}.lmp-b[disabled]{opacity:.5;cursor:not-allowed}" +
    ".lmp-ov{position:fixed;inset:0;z-index:2147483200;background:rgba(10,20,15,.6);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}" +
    ".lmp-ov.full{background:#F5F6F2;align-items:center}" +
    ".lmp-m{background:#fff;color:#17221D;width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;padding:20px 20px 24px}" +
    "@media(min-width:600px){.lmp-ov{align-items:center}.lmp-m{border-radius:20px}}" +
    ".lmp-m h2{margin:0 0 4px;font-size:21px}.lmp-m p{margin:0 0 12px;color:#3B4842;font-size:14px}" +
    ".lmp-m label{display:block;font:700 13px system-ui,sans-serif;margin:12px 0 4px}.lmp-m small{display:block;color:#55625B;font-size:12.5px;margin-top:3px}" +
    ".lmp-m input,.lmp-m textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #D3DAD5;border-radius:10px;font:15px system-ui,sans-serif;color:#17221D;background:#fff}" +
    ".lmp-m input[type=color]{height:44px;padding:3px}.lmp-m textarea{min-height:130px;resize:vertical}" +
    ".lmp-err{background:#FBE7E5;color:#B3261E;border-radius:10px;padding:10px 12px;font-size:13.5px;margin-top:12px}.lmp-okb{background:#DDF3EA;color:#0B5A47;border-radius:10px;padding:10px 12px;font-size:13.5px;margin-top:12px}" +
    ".lmp-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.lmp-row .lmp-b{flex:1;min-width:120px;padding:12px}" +
    ".lmp-m .lmp-b{background:#0B7A63;color:#fff}.lmp-m .lmp-b.o{background:#fff;color:#17221D;border:1.5px solid #D3DAD5}.lmp-m .lmp-b.g{background:#1FA855}" +
    ".lmp-price{background:#F0F4EF;border-radius:14px;padding:14px 16px;margin:10px 0}.lmp-price b{font-size:26px}.lmp-price small{display:inline;font-size:13px}" +
    ".lmp-x{float:right;background:none;border:0;font-size:24px;cursor:pointer;color:#55625B;line-height:1}body{padding-bottom:64px}" +
    ".lmp-link{word-break:break-all;background:#F0F4EF;border-radius:10px;padding:10px 12px;font-size:13px;margin:6px 0}" +
    ".lmp-spin{display:inline-block;width:14px;height:14px;border:2px solid #0B7A63;border-top-color:transparent;border-radius:50%;animation:lmps 1s linear infinite;vertical-align:-2px;margin-right:6px}@keyframes lmps{to{transform:rotate(360deg)}}";
  var CSS2 = ".lmp-b{transition:transform .12s,box-shadow .12s}.lmp-b:hover{transform:translateY(-1px)}.lmp-b:active{transform:scale(.96)}" +
    ".lmp-m{animation:lmpUp .28s ease-out}@keyframes lmpUp{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}" +
    ".lmp-toast{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:2147483600;background:#12201A;color:#fff;padding:12px 18px;border-radius:999px;font:700 15px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);animation:lmpT 3.2s ease forwards;max-width:92vw;text-align:center}" +
    "@keyframes lmpT{0%{opacity:0;transform:translate(-50%,-14px)}10%,85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-10px)}}" +
    ".lmp-cf{position:fixed;top:-14px;width:9px;height:14px;z-index:2147483500;pointer-events:none;animation:lmpF linear forwards}@keyframes lmpF{to{transform:translateY(108vh) rotate(720deg)}}" +
    ".lm-rv{opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .5s ease}.lm-rv.in{opacity:1;transform:none}" +
    ".lmp-chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.lmp-chip{border:1.5px solid #0B7A63;background:#fff;color:#0B7A63;border-radius:999px;padding:7px 12px;font:600 13px system-ui,sans-serif;cursor:pointer}.lmp-chip:active{transform:scale(.95)}" +
    "@media(prefers-reduced-motion:reduce){.lmp-m,.lmp-toast{animation:none}.lm-rv{opacity:1;transform:none;transition:none}.lmp-b{transition:none}}";
  function css() { if (document.getElementById("lmp-css")) return; var s = document.createElement("style"); s.id = "lmp-css"; s.textContent = CSS + CSS2; document.head.appendChild(s); }
  function el(html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstChild; }
  function close(ov) { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); }
  function modal(html) {
    css();
    var ov = el('<div class="lmp-ov" role="dialog" aria-modal="true"><div class="lmp-m"><button class="lmp-x" aria-label="Cerrar">×</button>' + html + "</div></div>");
    ov.querySelector(".lmp-x").onclick = function () { close(ov); };
    ov.addEventListener("click", function (e) { if (e.target === ov) close(ov); });
    document.body.appendChild(ov); return ov;
  }
  function copiar(txt, btn) {
    function ok() { if (btn) { var t = btn.textContent; btn.textContent = "¡Copiado!"; setTimeout(function () { btn.textContent = t; }, 1500); } }
    try { navigator.clipboard.writeText(txt).then(ok, function () { window.prompt("Copiá este enlace:", txt); }); } catch (e) { window.prompt("Copiá este enlace:", txt); }
  }
  var BASE = location.origin + location.pathname;
  function urlPublica(cod) { return BASE + "?c=" + cod; }
  function urlPanel(cod, k) { return BASE + "?c=" + cod + "&k=" + k; }
  var LAST = null;
  function hideNav() { var st = document.createElement("style"); st.textContent = ".lm-nav{display:none!important}"; document.head.appendChild(st); }
  function guardar(patch) {
    if (!(ACC && ACC.admin && ACTIVO)) return Promise.resolve();
    var m = {}, k; for (k in ACC.config) m[k] = ACC.config[k]; for (k in patch) m[k] = patch[k]; ACC.config = m;
    return rpc("lm_guardar", { p_codigo: ACC.codigo, p_clave: ACC.clave, p_config: m });
  }

  /* ---------- Precio / activación ---------- */
  function plans(key, why) {
    var n = P.nombres[key] || "", pr = P.precios[key], pk = P.precios.pack, cfg = load(key);
    var ov = modal("<h2>Versión completa</h2><p>" + (why ? esc(why) + " " : "") + "<b>" + esc(n) + "</b>: " + esc(P.incluye[key] || "") + "</p>" +
      '<div class="lmp-price"><b>' + money(pr) + "</b> <small>por mes</small><br><small>Pack con los 4 productos: <b>" + money(pk) + "</b> por mes</small></div>" +
      "<p>Se activa sola apenas pagás, sin esperar a nadie. Tus datos de la prueba pasan tal cual. Podés cancelar cuando quieras desde Mercado Pago.</p>" +
      '<div class="lmp-row">' + (cfg && LAST ? '<button class="lmp-b" id="lmp-act">Activar versión completa</button>' : '<button class="lmp-b" id="lmp-first">Primero probala con tus datos</button>') +
      '<button class="lmp-b o" id="lmp-ped" style="color:#12201A;border-color:#12201A">¿Algo a medida? Contame</button></div>' +
      '<p style="margin-top:12px"><small>' + esc(P.vigencia) + "</small></p>");
    var a = ov.querySelector("#lmp-act"); if (a) a.onclick = function () { close(ov); activar(LAST); };
    var pd = ov.querySelector("#lmp-ped"); if (pd) pd.onclick = function () { close(ov); pedir(n); };
    var f = ov.querySelector("#lmp-first"); if (f) f.onclick = function () { close(ov); if (LAST) form(LAST); };
  }

  function activar(o) {
    var key = o.key, cfg = load(key), cta = cuentaLocal(key);
    if (cta && cta.codigo) return pasoPago(o, cta);
    var ov = modal("<h2>Activar " + esc(P.nombres[key]) + "</h2><p>Dejá tu email y pagá la suscripción: se activa sola.</p>" +
      '<label for="lmp-em">Tu email</label><input id="lmp-em" type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com">' +
      "<small>Usá el mismo email con el que pagás en Mercado Pago. Si usás otro, podés indicarlo en el paso siguiente.</small><div id=\"lmp-e\"></div>" +
      '<div class="lmp-row"><button class="lmp-b" id="lmp-go">Continuar</button></div>');
    var go = ov.querySelector("#lmp-go");
    go.onclick = function () {
      var em = ov.querySelector("#lmp-em").value.trim(), e = ov.querySelector("#lmp-e");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { e.innerHTML = '<div class="lmp-err">Revisá el email.</div>'; return; }
      go.disabled = true; go.textContent = "Un momento...";
      rpc("lm_crear", { p_producto: key, p_email: em, p_config: cfg || {} }).then(function (r) {
        var c = { codigo: r.codigo, clave: r.clave, email: em }; lsSet("lm_cuenta_" + key, JSON.stringify(c)); close(ov); pasoPago(o, c);
      }).catch(function (err) {
        go.disabled = false; go.textContent = "Continuar";
        e.innerHTML = '<div class="lmp-err">' + (/demasiadas/.test(err.message) ? "Hiciste demasiados intentos hoy. Probá mañana o escribime por WhatsApp." : "No se pudo continuar. Revisá tu conexión e intentá de nuevo.") + "</div>";
      });
    };
  }

  function pasoPago(o, c) {
    var key = o.key, vivo = true, ov;
    function ok(estado) {
      vivo = false; confeti(90); vibra();
      var pan = urlPanel(c.codigo, c.clave), pub = urlPublica(c.codigo);
      ov.querySelector(".lmp-m").innerHTML = '<button class="lmp-x" aria-label="Cerrar">×</button><h2>¡Listo, ya está activo! 🎉</h2><p>Tu versión completa funciona sin límites. Te mandamos estos enlaces también por email.</p>' +
        "<label>Tu panel (solo tuyo, guardalo)</label><div class=\"lmp-link\">" + esc(pan) + "</div>" +
        (o.privado ? "" : "<label>Enlace para compartir con tus clientes</label><div class=\"lmp-link\">" + esc(pub) + "</div>") +
        '<div class="lmp-row"><a class="lmp-b" href="' + esc(pan) + '">Abrir mi panel</a>' + (o.privado ? "" : '<button class="lmp-b o" id="lmp-cp">Copiar enlace para mis clientes</button>') + "</div>";
      ov.querySelector(".lmp-x").onclick = function () { close(ov); };
      var cp2 = ov.querySelector("#lmp-cp"); if (cp2) cp2.onclick = function () { copiar(pub, cp2); };
    }
    function chequear() {
      if (!vivo) return;
      syncCuenta(c.codigo).then(function () { return rpc("lm_ver", { p_codigo: c.codigo }); }).then(function (r) {
        if (!vivo) return;
        if (r && r.estado === "activo") ok(); else setTimeout(chequear, 6000);
      }).catch(function () { if (vivo) setTimeout(chequear, 8000); });
    }
    ov = modal("<h2>Último paso: pagá la suscripción</h2><p>Se abre Mercado Pago en otra pestaña. Cuando termines, volvé a esta pantalla: se activa sola.</p>" +
      '<div class="lmp-row"><a class="lmp-b" href="' + esc(P.mp[key]) + '" target="_blank" rel="noopener">Pagar ' + money(P.precios[key]) + "/mes</a>" +
      '<a class="lmp-b o" href="' + esc(P.mp.pack) + '" target="_blank" rel="noopener">Mejor el pack de los 4 · ' + money(P.precios.pack) + "/mes</a></div>" +
      '<div class="lmp-okb"><span class="lmp-spin"></span>Esperando tu pago… Email registrado: <b>' + esc(c.email || "") + "</b></div>" +
      '<label for="lmp-mp">¿Pagás con otro email en Mercado Pago?</label><input id="lmp-mp" type="email" placeholder="email de tu cuenta de Mercado Pago"><div id="lmp-e"></div>' +
      '<div class="lmp-row"><button class="lmp-b o" id="lmp-vin">Usar este email</button></div>');
    var xb = ov.querySelector(".lmp-x"); xb.onclick = function () { vivo = false; close(ov); };
    ov.querySelector("#lmp-vin").onclick = function () {
      var em = ov.querySelector("#lmp-mp").value.trim(), e = ov.querySelector("#lmp-e");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { e.innerHTML = '<div class="lmp-err">Revisá el email.</div>'; return; }
      rpc("lm_vincular", { p_codigo: c.codigo, p_clave: c.clave, p_email_mp: em }).then(function () { e.innerHTML = '<div class="lmp-okb">Listo, lo tomamos en cuenta.</div>'; chequear(); })
        .catch(function () { e.innerHTML = '<div class="lmp-err">No se pudo guardar. Probá de nuevo.</div>'; });
    };
    chequear();
  }

  /* ---------- Formulario de personalización ---------- */
  function form(o) {
    var panel = !!(ACC && ACC.admin && ACTIVO && ACC.producto === o.key);
    var cur = load(o.key) || {};
    var body = o.fields.map(function (f) {
      var v = cur[f.id] != null ? cur[f.id] : (f.def != null ? f.def : "");
      if (f.type === "list") v = (Array.isArray(v) ? v : []).join("\n");
      var c = f.type === "list" ? '<textarea id="lmpf-' + f.id + '" placeholder="' + esc(f.placeholder || "") + '">' + esc(v) + "</textarea>" :
        '<input id="lmpf-' + f.id + '" type="' + (f.type || "text") + '" value="' + esc(v) + '" placeholder="' + esc(f.placeholder || "") + '">';
      return '<label for="lmpf-' + f.id + '">' + esc(f.label) + "</label>" + c + (f.hint ? "<small>" + esc(f.hint) + "</small>" : "");
    }).join("");
    var ov = modal("<h2>" + esc(panel ? "Editar mi " + (o.cosa || "negocio") : o.title) + "</h2><p>" + esc(o.intro || "") + (panel ? "" : " <b>Límite de la prueba gratis:</b> " + esc(o.limit) + ".") + "</p>" + body +
      '<div id="lmp-err"></div><div class="lmp-row"><button class="lmp-b" id="lmp-save">Guardar</button>' + (!panel && Object.keys(load(o.key) || {}).length ? '<button class="lmp-b o" id="lmp-reset">Borrar mi prueba</button>' : "") + "</div>");
    function err(t, up) { var e = ov.querySelector("#lmp-err"); e.innerHTML = t ? '<div class="lmp-err">' + esc(t) + (up ? ' <a href="#" id="lmp-up">Ver la versión completa</a>' : "") + "</div>" : ""; var u = ov.querySelector("#lmp-up"); if (u) u.onclick = function (ev) { ev.preventDefault(); close(ov); plans(o.key, "La prueba tiene un tope."); }; }
    ov.querySelector("#lmp-save").onclick = function () {
      var vals = {};
      for (var i = 0; i < o.fields.length; i++) {
        var f = o.fields[i], raw = ov.querySelector("#lmpf-" + f.id).value;
        if (f.type === "list") {
          var lines = raw.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
          if (f.req && !lines.length) return err("Completá: " + f.label + ".");
          if (!panel && f.max && lines.length > f.max) return err("La prueba gratis permite hasta " + f.max + " líneas en «" + f.label + "». Tenés " + lines.length + ".", true);
          vals[f.id] = lines;
        } else {
          raw = raw.trim();
          if (f.req && !raw) return err("Completá: " + f.label + ".");
          vals[f.id] = f.type === "number" ? Number(raw.replace(/[^\d.]/g, "")) || 0 : raw;
        }
      }
      var msg = o.check ? o.check(vals) : "";
      if (msg) return err(msg);
      if (panel) {
        var merged = {}; for (var k in cur) merged[k] = cur[k]; for (var k2 in vals) merged[k2] = vals[k2];
        var b = ov.querySelector("#lmp-save"); b.disabled = true; b.textContent = "Guardando...";
        return rpc("lm_guardar", { p_codigo: ACC.codigo, p_clave: ACC.clave, p_config: merged }).then(function () { celebrar("¡Guardado! Ya está en vivo ✨"); location.reload(); })
          .catch(function () { b.disabled = false; b.textContent = "Guardar"; err("No se pudo guardar. Revisá tu conexión."); });
      }
      if (!save(o.key, vals)) return err("Tu navegador no permite guardar datos (¿modo privado?). Probá en una ventana normal.");
      celebrar("¡Listo! Así se ve tu " + (o.cosa || "negocio") + " 🎉"); location.reload();
    };
    var r = ov.querySelector("#lmp-reset");
    if (r) r.onclick = function () { reset(o.key); lsDel("lm_cuenta_" + o.key); location.reload(); };
  }

  /* ---------- Barra inferior ---------- */
  function aviso(txt) {
    css(); var ov = el('<div class="lmp-ov full"><div class="lmp-m" style="border-radius:20px;text-align:center"><h2>' + esc(txt) + "</h2><p>Si sos el dueño, escribime y lo resolvemos al instante.</p>" +
      '<div class="lmp-row"><a class="lmp-b g" href="' + waLink("Hola Leandro, tengo un problema con mi enlace.") + '" target="_blank" rel="noopener">Escribir por WhatsApp</a></div></div></div>');
    document.body.appendChild(ov);
  }
  function refrescar() {
    if (!ACC || ACC.error) return;
    var tk = "lm_sync_" + ACC.codigo, last = Number(lsGet(tk) || 0);
    if (ACTIVO && Date.now() - last < 3 * 3600e3) return;
    lsSet(tk, String(Date.now()));
    syncCuenta(ACC.codigo).then(function (r) { if (r && r.estado && (r.estado === "activo") !== ACTIVO) location.reload(); });
  }
  /* ---------- App instalable (PWA) ---------- */
  var DIP = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); DIP = e; });
  window.addEventListener("appinstalled", function () { DIP = null; lsSet("lm_inst_ok", "1"); });
  function enApp() { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } }
  function icono(txt, size) {
    var c = document.createElement("canvas"); c.width = c.height = size; var g = c.getContext("2d");
    g.fillStyle = "#0B7A63"; g.fillRect(0, 0, size, size); g.fillStyle = "#fff";
    g.font = "bold " + Math.round(size * 0.55) + "px system-ui,Arial,sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(txt, size / 2, size / 2 + size * 0.03); return c.toDataURL("image/png");
  }
  function pwa(nombre) {
    try {
      nombre = String(nombre || "Mi panel").trim() || "Mi panel";
      var ini = nombre.charAt(0).toUpperCase();
      var man = { name: nombre, short_name: nombre.slice(0, 12), start_url: location.href, scope: location.origin + location.pathname.replace(/[^\/]*$/, ""), display: "standalone", background_color: "#F5F6F2", theme_color: "#0B7A63",
        icons: [{ src: icono(ini, 192), sizes: "192x192", type: "image/png" }, { src: icono(ini, 512), sizes: "512x512", type: "image/png" }] };
      var l = document.createElement("link"); l.rel = "manifest"; l.href = URL.createObjectURL(new Blob([JSON.stringify(man)], { type: "application/manifest+json" })); document.head.appendChild(l);
      var a = document.createElement("link"); a.rel = "apple-touch-icon"; a.href = icono(ini, 180); document.head.appendChild(a);
      [["apple-mobile-web-app-capable", "yes"], ["apple-mobile-web-app-title", nombre.slice(0, 12)], ["mobile-web-app-capable", "yes"]].forEach(function (p) { var m = document.createElement("meta"); m.name = p[0]; m.content = p[1]; document.head.appendChild(m); });
    } catch (e) {}
  }
  function instalar() {
    if (DIP) { DIP.prompt(); DIP.userChoice.then(function () { DIP = null; }); return; }
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    modal("<h2>📲 Instalar en tu celular</h2>" + (ios
      ? "<ol><li>Abrí esta página en <b>Safari</b>.</li><li>Tocá el botón <b>Compartir</b> (el cuadrado con una flecha hacia arriba).</li><li>Elegí <b>«Agregar a inicio»</b> y confirmá.</li></ol>"
      : "<ol><li>Tocá los <b>tres puntos ⋮</b> arriba a la derecha del navegador.</li><li>Elegí <b>«Instalar aplicación»</b> o <b>«Agregar a la pantalla principal»</b>.</li><li>Confirmá. Te queda un ícono para abrirlo con un toque.</li></ol>") +
      "<p>Quedará con el ícono de tu negocio, como cualquier app.</p>");
  }
  function ofrecerInstalar() {
    if (enApp() || lsGet("lm_inst_ok") || lsGet("lm_inst_no") || !/android|iphone|ipad|ipod/i.test(navigator.userAgent)) return;
    setTimeout(function () {
      var m = modal('<h2>📲 Llevá tu panel en el celular</h2><p>Instalalo y lo abrís con un toque desde la pantalla de inicio, como cualquier app. Es gratis y no ocupa espacio.</p><p><button class="lmp-b" id="lmp-ins">Instalar ahora</button> <button class="lmp-b o" id="lmp-no">Ahora no</button></p>');
      m.querySelector("#lmp-ins").onclick = function () { lsSet("lm_inst_no", "1"); m.querySelector(".lmp-x").click(); instalar(); };
      m.querySelector("#lmp-no").onclick = function () { lsSet("lm_inst_no", "1"); m.querySelector(".lmp-x").click(); };
    }, 1500);
  }
  /* ---------- Detalles que dan gusto ---------- */
  function reducido() { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function vibra() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }
  function toast(msg) { css(); var t = el('<div class="lmp-toast" role="status">' + esc(msg) + "</div>"); document.body.appendChild(t); setTimeout(function () { close(t); }, 3300); }
  function confeti(n) {
    if (reducido()) return; css(); var cols = ["#5FD3B3", "#0B7A63", "#F5B942", "#E4572E", "#4C8DF6"];
    for (var i = 0; i < (n || 60); i++) {
      var d = document.createElement("i"); d.className = "lmp-cf"; d.style.left = Math.random() * 100 + "vw"; d.style.background = cols[i % cols.length];
      d.style.animationDuration = (1.4 + Math.random() * 1.4) + "s"; d.style.animationDelay = (Math.random() * 0.4) + "s"; document.body.appendChild(d);
      (function (x) { setTimeout(function () { close(x); }, 3600); })(d);
    }
  }
  function celebrar(msg) { try { sessionStorage.setItem("lm_celebra", msg); } catch (e) {} }
  function pendiente() { try { var m = sessionStorage.getItem("lm_celebra"); if (m) { sessionStorage.removeItem("lm_celebra"); setTimeout(function () { toast(m); confeti(70); vibra(); }, 300); } } catch (e) {} }
  function contar() {
    if (reducido()) return;
    [].forEach.call(document.querySelectorAll(".k b"), function (b) {
      var raw = b.textContent, dig = raw.replace(/\D/g, ""); if (!dig || dig.length > 9) return;
      var fin = parseInt(dig, 10), pre = raw.charAt(0) === "$" ? "$" : "", t0 = null; if (fin <= 0) return;
      function paso(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 700), v = Math.round(fin * (1 - Math.pow(1 - p, 3))); if (p < 1) { b.textContent = pre + v.toLocaleString("es-AR"); requestAnimationFrame(paso); } else b.textContent = raw; }
      requestAnimationFrame(paso);
    });
  }
  function revelar() {
    if (reducido() || !window.IntersectionObserver) return; css();
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.08 });
    [].forEach.call(document.querySelectorAll(".card,.how>div,.k"), function (x) { x.classList.add("lm-rv"); io.observe(x); });
  }
  window.addEventListener("load", function () { setTimeout(function () { contar(); revelar(); pendiente(); }, 200); });
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest("[data-p]")) { toast("¡Cobrado! 🎉"); confeti(35); vibra(); return; }
    if (t.closest("[data-d],.lmp-b,.btn,.b")) vibra();
  });
  function pedir(origen) {
    var n = ACC && ACC.producto ? (P.nombres[ACC.producto] || "") : (origen || "");
    var ov = modal('<h2>💬 Contame qué necesitás</h2><p>Si algo no funciona, querés una mejora o ninguna opción te cierra del todo, escribilo acá y lo armamos para vos. Sin compromiso.</p>' +
      '<div class="lmp-chips">' + ["Algo no funciona", "Una mejora", "Un dato o campo más", "Algo a medida"].map(function (c) { return '<button type="button" class="lmp-chip">' + esc(c) + "</button>"; }).join("") + "</div>" +
      '<label for="lmp-need">Tu mensaje</label><textarea id="lmp-need" placeholder="Ej.: quiero que mis clientes puedan subir una foto del producto"></textarea>' +
      '<div class="lmp-row"><a class="lmp-b g" id="lmp-snd" href="#" target="_blank" rel="noopener" style="text-decoration:none">Enviármelo por WhatsApp</a></div>');
    var ta = ov.querySelector("#lmp-need");
    [].forEach.call(ov.querySelectorAll(".lmp-chip"), function (c) { c.onclick = function () { if (!ta.value) ta.value = c.textContent + ": "; ta.focus(); vibra(); }; });
    ov.querySelector("#lmp-snd").onclick = function () {
      this.href = waLink("Hola Leandro! " + (ACC && ACC.codigo ? "Soy cliente de " + n + " (código " + ACC.codigo + "). " : (n ? "Estuve viendo " + n + ". " : "")) + (ta.value.trim() || "Quiero consultarte por una función a medida."));
    };
  }
  function ayuda() { pedir(); }
  function mount(o) {
    css(); LAST = o;
    if (C_COD && (!ACC || ACC.error)) return aviso("Este enlace no es válido");
    if (ACC && ACC.producto === o.key) {
      refrescar();
      if (ACTIVO) hideNav();
      if (!ACC.admin) { if (o.privado) { aviso("Este panel es privado"); return; } if (!ACTIVO) aviso("Este negocio no está disponible por ahora"); return; }
      var bar = el('<div class="lmp-bar" role="region" aria-label="Mi panel"></div>');
      if (ACTIVO) {
        bar.innerHTML = '<span>Mi panel · versión completa</span><button class="lmp-b o" id="lmp-ed">Editar</button>' + (o.privado ? "" : '<button class="lmp-b" id="lmp-cp">Copiar enlace para mis clientes</button>') +
          (enApp() ? "" : '<button class="lmp-b o" id="lmp-in">📲 Instalar app</button>') + '<button class="lmp-b o" id="lmp-ay">¿Ayuda o mejoras?</button>' + (ACC.producto === "turnos" && ACC.reservas ? '<button class="lmp-b o" id="lmp-rs">Reservas (' + ACC.reservas.length + ")</button>" : "");
        bar.querySelector("#lmp-ed").onclick = function () { form(o); };
        var cpb = bar.querySelector("#lmp-cp"); if (cpb) cpb.onclick = function (e) { copiar(urlPublica(ACC.codigo), e.target); };
        var inb = bar.querySelector("#lmp-in"); if (inb) inb.onclick = instalar;
        pwa(ACC.config && ACC.config.nombre || P.nombres[ACC.producto]); ofrecerInstalar();
        var ay = bar.querySelector("#lmp-ay"); if (ay) ay.onclick = function () { ayuda(); };
        var rs = bar.querySelector("#lmp-rs");
        if (rs) rs.onclick = function () {
          var f = function (d) { var p = String(d).split("-"); return p[2] + "/" + p[1]; };
          var ov = modal("<h2>Reservas de tus clientes</h2>" + (ACC.reservas.length ? ACC.reservas.map(function (r) { return "<p><b>" + f(r.fecha) + " " + esc(r.hora) + "</b> · " + esc(r.nombre) + ' · <a href="https://wa.me/' + esc(String(r.tel).replace(/\D/g, "")) + '" target="_blank" rel="noopener">' + esc(r.tel) + '</a> · <label style="white-space:nowrap"><input type="checkbox" data-sena="' + r.id + '"' + (r.sena ? " checked" : "") + "> Seña recibida</label></p>"; }).join("") : "<p>Todavía no hay reservas.</p>"));
          ov.addEventListener("change", function (e) { var c = e.target; if (!c.dataset || !c.dataset.sena) return; var id = Number(c.dataset.sena), val = c.checked; rpc("lm_sena", { p_codigo: ACC.codigo, p_clave: ACC.clave, p_id: id, p_valor: val }).then(function () { ACC.reservas.forEach(function (r) { if (r.id === id) r.sena = val; }); }, function () { c.checked = !val; }); });
        };
      } else {
        bar.innerHTML = '<span>Esperando la confirmación de tu pago</span><button class="lmp-b" id="lmp-st">Ver estado</button>';
        bar.querySelector("#lmp-st").onclick = function () { pasoPago(o, { codigo: ACC.codigo, clave: ACC.clave, email: ACC.email }); };
      }
      document.body.appendChild(bar); return;
    }
    var cfg = load(o.key), cta = cuentaLocal(o.key);
    var bar2 = el('<div class="lmp-bar" role="region" aria-label="Versión de prueba"></div>');
    if (cfg) {
      bar2.innerHTML = "<span>Versión de prueba gratis · " + esc(o.limit) + '</span><button class="lmp-b o" id="lmp-ed">Editar</button><button class="lmp-b" id="lmp-up">' + (cta ? "Terminar mi activación" : "Pasar a la completa · " + money(P.precios[o.key]) + "/mes") + "</button>";
    } else {
      bar2.innerHTML = "<span>¿Es para tu " + esc(o.cosa || "negocio") + "? Probalo gratis con tus datos.</span>" + '<button class="lmp-b" id="lmp-ed">Probar con mi ' + esc(o.cosa || "negocio") + '</button><button class="lmp-b o" id="lmp-up">Ver precio</button>';
    }
    bar2.querySelector("#lmp-ed").onclick = function () { form(o); };
    bar2.querySelector("#lmp-up").onclick = function () { cfg ? activar(o) : plans(o.key); };
    document.body.appendChild(bar2);
  }

  window.LMPrueba = { planes: P, money: money, load: load, save: save, reset: reset, mount: mount, plans: plans, esc: esc, waLink: waLink,
    rpc: rpc, pedir: pedir, guardar: guardar, cuenta: ACC, activo: ACTIVO, admin: !!(ACC && ACC.admin && ACTIVO) };
  /* Botón "Compartir QR" (nunca incluye claves) */
  (function () { var q = document.createElement("script"); q.src = "https://leandrotvr.github.io/qr.js"; q.async = true; document.head.appendChild(q); })();
})();
