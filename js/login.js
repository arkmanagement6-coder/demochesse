// Chess Demo Booking - Login Controller

document.addEventListener("DOMContentLoaded", () => {
    // If already logged in, redirect away
    if (window.Auth && window.Auth.session) {
        if (window.Auth.session.role === 'admin') window.location.href = "admin.html";
        else if (window.Auth.session.role === 'teacher') window.location.href = "teacher.html";
        else window.location.href = "index.html"; // Redirect students to index for now
    }

    const roleBtns = document.querySelectorAll(".role-btn");
    let currentRole = "student";

    roleBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            roleBtns.forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentRole = e.currentTarget.getAttribute("data-role");
            
            // Helpful placeholder hints based on role
            const emailInput = document.getElementById("login-email");
            if (currentRole === 'admin') {
                emailInput.placeholder = "admin@parashchess.com";
            } else if (currentRole === 'teacher') {
                emailInput.placeholder = "coach@example.com";
            } else {
                emailInput.placeholder = "student@example.com";
            }
        });
    });

    const loginForm = document.getElementById("login-form");
    const errorBox = document.getElementById("login-error");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        errorBox.style.display = "none";
        
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        const success = window.Auth.login(email, password, currentRole);
        
        if (success) {
            // Re-direct based on role
            if (currentRole === 'admin') window.location.href = "admin.html";
            else if (currentRole === 'teacher') window.location.href = "teacher.html";
            else window.location.href = "index.html";
        } else {
            errorBox.style.display = "block";
            // Shake animation for error
            loginForm.style.transform = "translateX(-5px)";
            setTimeout(() => loginForm.style.transform = "translateX(5px)", 100);
            setTimeout(() => loginForm.style.transform = "translateX(-5px)", 200);
            setTimeout(() => loginForm.style.transform = "translateX(5px)", 300);
            setTimeout(() => loginForm.style.transform = "translateX(0)", 400);
        }
    });
});
