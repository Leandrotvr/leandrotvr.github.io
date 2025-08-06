// 🌙 Modo claro/oscuro
const botonTema = document.getElementById("tema-toggle");

botonTema.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("tema", document.body.classList.contains("dark-mode") ? "oscuro" : "claro");
});

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("tema") === "oscuro") {
    document.body.classList.add("dark-mode");
  }
});

// 📩 Validación de formulario
const form = document.getElementById("formulario-contacto");
const mensajeExito = document.getElementById("mensaje-exito");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const mensaje = document.getElementById("mensaje").value.trim();

  if (!nombre || !email || !mensaje) {
    alert("Por favor, completá todos los campos.");
    return;
  }

  form.reset();
  mensajeExito.style.display = "block";

  setTimeout(() => {
    mensajeExito.style.display = "none";
  }, 5000);
});

// 🎯 Filtro de proyectos
const botonesFiltro = document.querySelectorAll(".filtro-btn");
const proyectos = document.querySelectorAll(".proyecto");

botonesFiltro.forEach(btn => {
  btn.addEventListener("click", () => {
    botonesFiltro.forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");

    const filtro = btn.dataset.filtro;

    proyectos.forEach(proy => {
      if (filtro === "todos" || proy.dataset.tipo === filtro) {
        proy.style.display = "block";
      } else {
        proy.style.display = "none";
      }
    });
  });
});

