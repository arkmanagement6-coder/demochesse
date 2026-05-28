// Chess Demo Booking - Staff Portal Login Controller

document.addEventListener("DOMContentLoaded", () => {
    // If already logged in, redirect away to the appropriate portal
    if (window.Auth && window.Auth.session) {
        if (window.Auth.session.role === 'admin') window.location.href = "admin.html";
        else if (window.Auth.session.role === 'teacher') window.location.href = "teacher.html";
        else window.location.href = "index.html"; 
    }

    const roleBtns = document.querySelectorAll(".role-btn");
    let currentRole = "teacher"; // Default active role on the portal login page

    roleBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            roleBtns.forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentRole = e.currentTarget.getAttribute("data-role");
            
            // Set input placeholder hints based on role
            const emailInput = document.getElementById("login-email");
            if (currentRole === 'admin') {
                emailInput.placeholder = "admin@parashchess.com";
            } else {
                emailInput.placeholder = "coach@example.com";
            }
        });
    });

    // Quick fill credentials handler
    const quickBtns = document.querySelectorAll(".quick-fill-btn");
    quickBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const role = e.currentTarget.getAttribute("data-role");
            const email = e.currentTarget.getAttribute("data-email");
            const pass = e.currentTarget.getAttribute("data-pass");

            // 1. Select the correct tab
            const targetTab = document.querySelector(`.role-btn[data-role="${role}"]`);
            if (targetTab) {
                targetTab.click();
            }

            // 2. Populate inputs
            document.getElementById("login-email").value = email;
            document.getElementById("login-password").value = pass;

            window.Toast.show("Credentials Filled", `Selected ${role.toUpperCase()} role and filled details. Click Authenticate to enter.`, "success");
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
