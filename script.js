document.getElementById('contact-form').addEventListener('submit', function(event) {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();
  const feedback = document.getElementById('form-feedback');

  if (!name || !email || !message) {
    showFeedback('Por favor, completá todos los campos.', 'error');
  } else {
    showFeedback('Mensaje enviado. Gracias por contactarme.', 'success');
    this.reset();
  }

  function showFeedback(msg, type) {
    feedback.textContent = msg;
    feedback.className = type;
    feedback.classList.remove('hidden');
    setTimeout(() => {
      feedback.classList.add('hidden');
    }, 5000);
  }
});


