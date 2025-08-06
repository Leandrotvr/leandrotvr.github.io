document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevenir el envío del formulario

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // Validación básica de campos
    if (name === '' || email === '' || message === '') {
        showFeedback('error', 'Por favor, rellena todos los campos.');
    } else {
        showFeedback('success', '¡Mensaje enviado correctamente!');
        // Aquí puedes agregar la lógica para enviar los datos (por ejemplo, con fetch o AJAX)
        // Recuerda integrar un backend para recibir estos datos, o usar un servicio de formulario
    }
});

function showFeedback(type, message) {
    const feedbackElement = document.getElementById('form-feedback');
    feedbackElement.textContent = message;
    feedbackElement.className = type;
    feedbackElement.style.display = 'block';

    // Ocultar el mensaje después de 5 segundos
    setTimeout(function() {
        feedbackElement.style.display = 'none';
    }, 5000);
}



