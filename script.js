// Agregar evento de envío del formulario
document.getElementById("contact-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Evita el envío real del formulario

    // Obtener los valores de los campos
    var name = document.getElementById("name").value;
    var email = document.getElementById("email").value;
    var message = document.getElementById("message").value;
    
    // Validación simple
    if (name === "" || email === "" || message === "") {
        showFeedback("Por favor, completa todos los campos.", "error");
    } else {
        showFeedback("¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.", "success");
        // Aquí podrías agregar código para enviar el formulario a un servidor
    }
});

// Función para mostrar mensajes de éxito o error
function showFeedback(message, type) {
    var feedbackElement = document.getElementById("form-feedback");
    feedbackElement.textContent = message;
    feedbackElement.className = type; // success o error
    feedbackElement.style.display = "block";
}

