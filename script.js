document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const body = document.body;
  const html = document.documentElement;

  // Revisa si hay un tema guardado en localStorage
  const savedTheme = localStorage.getItem('theme');

  // Si hay un tema guardado, lo aplica. De lo contrario, revisa la preferencia del sistema.
  if (savedTheme) {
    html.setAttribute('data-bs-theme', savedTheme);
    themeToggleBtn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  } else {
    // Revisa la preferencia de tema del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDark ? 'dark' : 'light';
    html.setAttribute('data-bs-theme', initialTheme);
    themeToggleBtn.textContent = initialTheme === 'dark' ? '🌙' : '☀️';
  }

  // Agrega el 'event listener' al botón
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Establece el nuevo tema
    html.setAttribute('data-bs-theme', newTheme);
    
    // Actualiza el ícono del botón
    themeToggleBtn.textContent = newTheme === 'dark' ? '🌙' : '☀️';

    // Guarda el nuevo tema en localStorage
    localStorage.setItem('theme', newTheme);
  });
});
