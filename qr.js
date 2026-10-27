/* Botón "Compartir QR": muestra un código QR que apunta a la página actual.
   Nunca incluye claves: en paneles privados no aparece. */
(function () {
  if (window.__lmqr) return; window.__lmqr = 1;
  var q = new URLSearchParams(location.search), c = q.get("c"), k = q.get("k"), p = location.pathname;
  var privada = /\/(cobros|stock)\//.test(p);
  if (privada && (c || k)) return;
  var url = location.origin + p + (c ? "?c=" + encodeURIComponent(c) : "?r=qr");
  function esc(s) { return String(s).replace(/[&<>"']/g, function (x) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[x]; }); }
  function cargarLib(cb) {
    if (window.qrcode) return cb();
    var s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
    s.onload = cb; s.onerror = function () { cb(); }; document.head.appendChild(s);
  }
  function abrir() {
    cargarLib(function () {
      var svg = "";
      try { var m = window.qrcode(0, "M"); m.addData(url); m.make(); svg = m.createSvgTag({ cellSize: 8, margin: 0, scalable: true }); } catch (e) {}
      var ov = document.createElement("div");
      ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Código QR de esta página");
      ov.style.cssText = "position:fixed;inset:0;z-index:2147483300;background:rgba(10,20,15,.65);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
      var t = esc((document.title || "").replace(/\s*[·|-]\s*Leandro Maciel.*$/, "").slice(0, 60));
      ov.innerHTML = '<div style="background:#fff;color:#12201A;border-radius:20px;padding:22px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)">' +
        '<div style="font-weight:700;font-size:17px;margin-bottom:12px;overflow-wrap:anywhere">' + (t || "Escaneá para abrir") + '</div>' +
        '<div style="width:240px;height:240px;margin:0 auto 12px;padding:10px;border:3px solid #5FD3B3;border-radius:16px;background:#fff">' + (svg ? svg.replace("<svg", '<svg style="width:100%;height:100%;display:block"') : "<p>No se pudo generar el QR.</p>") + '</div>' +
        '<div style="font-size:14px;color:#3B4842;margin-bottom:12px">Apuntá la cámara del celular al código.</div>' +
        '<div style="font-size:12px;color:#55625B;overflow-wrap:anywhere;margin-bottom:14px">' + esc(url) + '</div>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button type="button" id="lmqr-cp" style="border:0;border-radius:10px;padding:10px 16px;font:700 15px system-ui,sans-serif;background:#0B7A63;color:#fff;cursor:pointer;min-height:44px">Copiar enlace</button>' +
        '<button type="button" id="lmqr-x" style="border:1.5px solid #12201A;border-radius:10px;padding:10px 16px;font:700 15px system-ui,sans-serif;background:#fff;color:#12201A;cursor:pointer;min-height:44px">Cerrar</button></div></div>';
      function cerrar() { if (ov.parentNode) ov.parentNode.removeChild(ov); document.removeEventListener("keydown", tecla); }
      function tecla(e) { if (e.key === "Escape") cerrar(); }
      ov.addEventListener("click", function (e) { if (e.target === ov) cerrar(); });
      document.addEventListener("keydown", tecla);
      document.body.appendChild(ov);
      ov.querySelector("#lmqr-x").onclick = cerrar; ov.querySelector("#lmqr-x").focus();
      ov.querySelector("#lmqr-cp").onclick = function (e) {
        var b = e.target, tx = b.textContent;
        function ok() { b.textContent = "¡Copiado!"; setTimeout(function () { b.textContent = tx; }, 1500); }
        try { navigator.clipboard.writeText(url).then(ok, function () { window.prompt("Copiá este enlace:", url); }); } catch (x) { window.prompt("Copiá este enlace:", url); }
      };
    });
  }
  function boton() {
    var b = document.createElement("button"); b.type = "button"; b.id = "lmqr-btn"; b.setAttribute("aria-label", "Compartir esta página con un código QR"); b.textContent = "Compartir QR";
    b.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:2147482400;border:1.5px solid #0B7A63;border-radius:999px;padding:9px 14px;background:#fff;color:#0B7A63;font:700 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.18);min-height:40px";
    b.onclick = abrir; document.body.appendChild(b);
    function ubicar() { var bar = document.querySelector(".lmp-bar"); b.style.bottom = (bar ? bar.offsetHeight + 12 : 12) + "px"; }
    ubicar(); setTimeout(ubicar, 600); window.addEventListener("resize", ubicar);
  }
  if (document.readyState === "complete") boton(); else window.addEventListener("load", function () { setTimeout(boton, 300); });
})();
