document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const authAlert = document.getElementById('authAlert');
    const signupBtn = document.querySelector('.signup-btn');

    function showAlert(message, type = 'error') {
        authAlert.className = `auth-alert ${type}`;
        authAlert.innerHTML = `
            <i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i>
            <span>${message}</span>
        `;
        authAlert.style.display = 'flex';
    }

    function clearAlert() {
        authAlert.style.display = 'none';
        authAlert.innerHTML = '';
    }

    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearAlert();

        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation: Passwords Match
        if (password !== confirmPassword) {
            showAlert("Passwords do not match. Please re-enter.");
            return;
        }

        // Validation: Password Length
        if (password.length < 6) {
            showAlert("Password must be at least 6 characters long.");
            return;
        }

        // Button Loading State
        signupBtn.disabled = true;
        const originalBtnHtml = signupBtn.innerHTML;
        signupBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CREATING ACCOUNT...';

        try {
            let response;
            try {
                response = await fetch('http://localhost:5000/api/users/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fullname,
                        email: email,
                        password: password
                    })
                });
            } catch (err) {
                // Fallback to 127.0.0.1 if localhost has IPv6 resolution issue
                response = await fetch('http://127.0.0.1:5000/api/users/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fullname,
                        email: email,
                        password: password
                    })
                });
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                showAlert(data.message || "Failed to create account. Please try again.");
                signupBtn.disabled = false;
                signupBtn.innerHTML = originalBtnHtml;
                return;
            }

            // Success: Store Token & Profile
            if (data.token) {
                localStorage.setItem('ather_auth_token', data.token);
            }
            if (data.user) {
                localStorage.setItem('ather_user_data', JSON.stringify(data.user));
            }

            showAlert("Account created successfully! Redirecting...", "success");

            setTimeout(() => {
                if (data.user && data.user.role === 'admin') {
                    window.location.href = '../Admin/Admin.html';
                } else {
                    window.location.href = '../Customer/Customer.html';
                }
            }, 1200);

        } catch (error) {
            console.error("Sign-up Network Error:", error);
            showAlert("Unable to connect to server. Please ensure the backend server is running.");
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalBtnHtml;
        }
    });
});