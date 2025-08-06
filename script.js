// 🌙 Modo claro / oscuro con localStorage
const botonTema = document.getElementById("tema-toggle");

botonTema.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("tema", "oscuro");
  } else {
    localStorage.setItem("tema", "claro");
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const temaGuardado = localStorage.getItem("tema");
  if (temaGuardado === "oscuro") {
    document.body.classList.add("dark-mode");
  }
});

// 📩 Validación y simulación de envío del formulario
const form = document.getElementById("formulario-contacto");
const mensajeExito = document.getElementById("mensaje-exito");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const mensaje = document.getElementById("mensaje").value.trim();

  if (nombre === "" || email === "" || mensaje === "") {
    alert("Por favor, completá todos los campos.");
    return;
  }

  form.reset();
  mensajeExito.style.display = "block";

  setTimeout(() => {
    mensajeExito.style.display = "none";
  }, 5000);
});
