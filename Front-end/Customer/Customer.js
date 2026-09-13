// Wait for the DOM content to fully load before running the script
document.addEventListener('DOMContentLoaded', () => {
    
    // Select the mobile menu button and the navigation links
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    // Add a click event listener to the mobile menu button if it exists
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            // Toggle the 'active' class on the nav-links element
            navLinks.classList.toggle('active');
            
            // Change the button icon between hamburger and close symbol
            if (navLinks.classList.contains('active')) {
                mobileMenuBtn.innerHTML = '✖'; // Close icon
            } else {
                mobileMenuBtn.innerHTML = '☰'; // Hamburger icon
            }
        });
    }

    // --- Request a Custom AR/VR Model: submit to backend ---
    const requestForm = document.querySelector('.request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = requestForm.querySelector('.submit-btn');
            const originalBtnText = submitBtn.innerText;
            submitBtn.disabled = true;
            submitBtn.innerText = 'Submitting...';

            const formData = new FormData();
            formData.append('fullName', document.getElementById('fullName').value);
            formData.append('workEmail', document.getElementById('workEmail').value);
            formData.append('targetPlatform', document.getElementById('targetPlatform').value);
            formData.append('specifications', document.getElementById('specifications').value);

            const fileInput = document.getElementById('blueprintFile');
            if (fileInput.files.length > 0) {
                formData.append('blueprintFile', fileInput.files[0]);
            }

            try {
                const response = await fetch('http://localhost:5000/api/requests', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (data.success) {
                    alert('Your request has been submitted successfully! Our team will get back to you shortly.');
                    requestForm.reset();
                } else {
                    alert('Submission failed: ' + (data.message || 'Unknown error'));
                }
            } catch (error) {
                alert('Could not reach the server. Make sure the backend is running (npm start) at http://localhost:5000');
                console.error('Request submission error:', error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        });
    }

});

// Function to handle card video playback on click
function playVideo(cardElement) {
    const video = cardElement.querySelector('video');
    if (video) {
        if (video.paused) {
            video.play();
            video.controls = true; // Shows play/pause/volume controls when playing
        } else {
            video.pause();
        }
    }
}