// DOM Elements
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const sections = document.querySelectorAll('section');
const faqQuestions = document.querySelectorAll('.faq__question');
const form = document.getElementById('reservaForm');

// Mobile Menu Toggle
menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    nav.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', 
        menuToggle.classList.contains('active'));
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

sections.forEach(section => {
    section.classList.add('fade-in');
    observer.observe(section);
});

// FAQ Accordion
faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isActive = answer.classList.contains('active');
        
        // Close all answers
        document.querySelectorAll('.faq__answer').forEach(a => {
            a.classList.remove('active');
            a.style.height = '0px';
        });
        document.querySelectorAll('.faq__question').forEach(q => {
            q.setAttribute('aria-expanded', 'false');
        });

        // Open clicked answer if it wasn't active
        if (!isActive) {
            answer.classList.add('active');
            answer.style.height = answer.scrollHeight + 'px';
            question.setAttribute('aria-expanded', 'true');
        }
    });
});

// Initialize Flatpickr
const fpInstance = flatpickr("#fecha", {
    locale: "es",
    minDate: "today",
    disable: [
        function(date) {
            return date.getDay() === 0; // Disable Sundays
        }
    ],
    onChange: function(selectedDates) {
        updateTimeSlots(selectedDates[0]);
    }
});

// Update available time slots based on service and date
function updateTimeSlots(selectedDate) {
    const horaSelect = document.getElementById('hora');
    const servicioSelect = document.getElementById('servicio');
    
    if (!selectedDate || !servicioSelect.value) {
        horaSelect.disabled = true;
        horaSelect.innerHTML = '<option value="">Selecciona primero una fecha y servicio</option>';
        return;
    }

    // Enable hora select
    horaSelect.disabled = false;
    
    // Generate time slots (9:00 - 18:00)
    const timeSlots = [];
    for (let hour = 9; hour <= 18; hour++) {
        // Skip 14:00 (lunch break)
        if (hour !== 14) {
            timeSlots.push(`${hour}:00`);
            if (hour !== 18) timeSlots.push(`${hour}:30`);
        }
    }

    // Clear and populate time slots
    horaSelect.innerHTML = '';
    timeSlots.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        horaSelect.appendChild(option);
    });
}

// Handle service selection
document.getElementById('servicio').addEventListener('change', () => {
    const selectedDate = fpInstance.selectedDates[0];
    if (selectedDate) {
        updateTimeSlots(selectedDate);
    }
});

// Form Validation and Submission with Webhook Integration
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Basic form validation
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
            field.style.borderColor = '#d32f2f';
        } else {
            field.classList.remove('error');
            field.style.borderColor = '';
        }
    });
    
    if (!isValid) {
        showFormResponse('Por favor, completa todos los campos necesarios para tu experiencia.', false);
        return;
    }
    
    // Prepare form data
    const datosReserva = {
        nombre: form.nombre.value,
        email: form.email.value,
        telefono: form.telefono.value,
        servicio: form.servicio.value,
        fecha: form.fecha.value,
        hora: form.hora.value,
        mensaje: form.mensaje.value,
        fechaEnvio: new Date().toISOString()
    };
    
    // Update UI during submission
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Procesando tu reserva...';
    
    try {
        // Send to webhook
        const response = await fetch('https://n8ninstance.mavie.cfd/webhook-test/c00c3549-04de-4dff-9696-f0fd92fb6fc4', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosReserva)
        });

        if (!response.ok) {
            throw new Error('Error en el envío');
        }

        // Success flow
        showFormResponse('¡Tu cita está casi lista! Te enviaremos la confirmación pronto.', true);
        form.reset();
        
    } catch (error) {
        showFormResponse('Lo sentimos, ha ocurrido un error. Por favor, inténtalo de nuevo o contáctanos directamente.', false);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Utility function to show response messages
function showFormResponse(message, isSuccess) {
    const responseElement = document.querySelector('.form-response');
    const responseText = responseElement.querySelector('.response-text');
    
    responseElement.classList.remove('success', 'error');
    responseElement.classList.add(isSuccess ? 'success' : 'error');
    responseText.textContent = message;
    
    // Show message with animation
    responseElement.classList.add('show');
    
    // Hide message after 5 seconds
    setTimeout(() => {
        responseElement.classList.remove('show');
    }, 5000);
}
