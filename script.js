// Alternar modo claro/oscuro
const botonTema = document.getElementById("tema-toggle");

botonTema.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  // Guardar preferencia en localStorage
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("tema", "oscuro");
  } else {
    localStorage.setItem("tema", "claro");
  }
});

// Cargar preferencia previa
window.addEventListener("DOMContentLoaded", () => {
  const temaGuardado = localStorage.getItem("tema");
  if (temaGuardado === "oscuro") {
    document.body.classList.add("dark-mode");
  }
});
