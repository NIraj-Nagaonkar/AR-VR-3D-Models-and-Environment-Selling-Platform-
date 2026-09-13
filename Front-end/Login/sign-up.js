document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');

    signupForm.addEventListener('submit', function(event) {
        // Prevent default page reload for testing
        event.preventDefault();

        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Basic validation: Check if passwords match
        if (password !== confirmPassword) {
            alert("Passwords do not match. Please try again.");
            return; // Stop the function here if they don't match
        }

        if(fullname && email && password) {
            console.log('Sign Up form submitted successfully!');
            console.log('Name:', fullname);
            console.log('Email:', email);
            
            // Add your backend registration logic here later
            alert("Account creation successful! (Demo)");
        }
    });
});