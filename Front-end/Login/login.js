document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const authAlert = document.getElementById('authAlert');
    const loginBtn = document.querySelector('.login-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.querySelector('.remember-me input[type="checkbox"]');

    // Auto-fill remembered email if available
    const savedEmail = localStorage.getItem('ather_remembered_email');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
    }

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

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearAlert();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showAlert("Please enter both email and password.");
            return;
        }

        // Remember Me persistence
        if (rememberMeCheckbox && rememberMeCheckbox.checked) {
            localStorage.setItem('ather_remembered_email', email);
        } else {
            localStorage.removeItem('ather_remembered_email');
        }

        // Button Loading State
        loginBtn.disabled = true;
        const originalBtnText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> LOGGING IN...';

        try {
            let response;
            try {
                response = await fetch('http://localhost:5000/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
            } catch (err) {
                // Fallback to 127.0.0.1 if localhost has IPv6 resolution issue
                response = await fetch('http://127.0.0.1:5000/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                showAlert(data.message || "Invalid email or password. Please try again.");
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalBtnText;
                return;
            }

            // Success: Store Token & User Information
            if (data.token) {
                localStorage.setItem('ather_auth_token', data.token);
            }
            if (data.user) {
                localStorage.setItem('ather_user_data', JSON.stringify(data.user));
            }

            showAlert("Login successful! Redirecting...", "success");

            setTimeout(() => {
                if (data.user && data.user.role === 'admin') {
                    window.location.href = '../Admin/Admin.html';
                } else {
                    window.location.href = '../Customer/Customer.html';
                }
            }, 1000);

        } catch (error) {
            console.error("Login Network Error:", error);
            showAlert("Unable to connect to server. Please ensure the backend server is running.");
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalBtnText;
        }
    });
});