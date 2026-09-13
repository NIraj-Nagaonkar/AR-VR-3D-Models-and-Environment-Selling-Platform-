document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', function(event) {
        // Prevent default submission for testing
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if(email && password) {
            console.log('Form submitted successfully!');
            console.log('Email:', email);
            // Add your backend authentication logic here
        }
    });
});