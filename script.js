// 🌙 Modo claro/oscuro
const botonTema = document.getElementById("tema-toggle");

// Cambiar entre temas claro y oscuro
botonTema.addEventListener("click", () => {
  // Cambia la clase 'dark-mode' del cuerpo de la página
  document.body.classList.toggle("dark-mode");

  // Guarda la preferencia del tema en el almacenamiento local del navegador
  localStorage.setItem("tema", document.body.classList.contains("dark-mode") ? "oscuro" : "claro");
});

// Al cargar la página, recuperar la preferencia del usuario para el tema
window.addEventListener("DOMContentLoaded", () => {
  // Si la preferencia es "oscuro", aplica el modo oscuro
  if (localStorage.getItem("tema") === "oscuro") {
    document.body.classList.add("dark-mode");
  }
});

// 📩 Validación de formulario
const form = document.getElementById("formulario-contacto");
const mensajeExito = document.getElementById("mensaje-exito");

form.addEventListener("submit", function (e) {
  e.preventDefault();  // Prevenir el envío tradicional del formulario

  // Obtener los valores de los campos del formulario
  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const mensaje = document.getElementById("mensaje").value.trim();

  // Validación básica: Verifica si algún campo está vacío
  if (!nombre || !email || !mensaje) {
    alert("Por favor, completá todos los campos.");
    return;
  }

  // Si todo es válido, resetear el formulario y mostrar mensaje de éxito
  form.reset();
  mensajeExito.style.display = "block";

  // Ocultar el mensaje de éxito después de 5 segundos
  setTimeout(() => {
    mensajeExito.style.display = "none";
  }, 5000);
});

// 🎯 Filtro de proyectos
const botonesFiltro = document.querySelectorAll(".filtro-btn");
const proyectos = document.querySelectorAll(".proyecto");

botonesFiltro.forEach(btn => {
  btn.addEventListener("click", () => {
    // Quitar la clase activa de todos los botones de filtro
    botonesFiltro.forEach(b => b.classList.remove("activo"));
    // Agregar la clase activa al botón clickeado
    btn.classList.add("activo");

    // Obtener el tipo de filtro seleccionado (todos, web o app)
    const filtro = btn.dataset.filtro;

    // Mostrar u ocultar proyectos según el filtro seleccionado
    proyectos.forEach(proy => {
      if (filtro === "todos" || proy.dataset.tipo === filtro) {
        proy.style.display = "block";  // Mostrar el proyecto
      } else {
        proy.style.display = "none";  // Ocultar el proyecto
      }
    });
  });
});
