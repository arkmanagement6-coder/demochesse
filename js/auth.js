// Chess Demo Booking - Global Authentication Controller

class Auth {
    static init() {
        this.session = JSON.parse(localStorage.getItem("chess_active_session"));
        this.updateNav();
    }

    static login(email, password, role) {
        let user = null;

        if (role === 'admin') {
            if (email === 'admin@parashchess.com' && password === 'admin123') {
                user = { id: 'admin', name: 'System Admin', email, role: 'admin' };
            }
        } else if (role === 'teacher') {
            const teachers = window.ChessDB ? window.ChessDB.getTeachers() : JSON.parse(localStorage.getItem("chess_teachers"));
            const t = teachers.find(t => t.email === email && t.password === password);
            if (t) {
                user = { id: t.id, name: t.name, email: t.email, role: 'teacher' };
            }
        } else if (role === 'student') {
            const bookings = window.ChessDB ? window.ChessDB.getBookings() : JSON.parse(localStorage.getItem("chess_bookings"));
            const b = bookings.find(b => b.email === email && b.password === password);
            if (b) {
                user = { id: b.id, name: b.studentName, email: b.email, role: 'student' };
            }
        }

        if (user) {
            localStorage.setItem("chess_active_session", JSON.stringify(user));
            this.session = user;
            return true;
        }
        return false;
    }

    static logout() {
        localStorage.removeItem("chess_active_session");
        this.session = null;
        window.location.href = "login.html";
    }

    static protect(roleRequired) {
        if (!this.session) {
            this.session = JSON.parse(localStorage.getItem("chess_active_session"));
        }
        if (!this.session || this.session.role !== roleRequired) {
            window.location.href = "login.html";
        }
    }

    static updateNav() {
        const navLinks = document.querySelector('.nav-links');
        const ctaBtn = document.getElementById('nav-cta-btn');
        
        if (!navLinks) return;

        // If ctaBtn exists, let's wrap it in a flex container if not already done
        let buttonGroup = document.getElementById('nav-button-group');
        if (ctaBtn && !buttonGroup) {
            buttonGroup = document.createElement('div');
            buttonGroup.id = 'nav-button-group';
            buttonGroup.style.display = 'flex';
            buttonGroup.style.alignItems = 'center';
            buttonGroup.style.gap = '12px';
            
            // Insert buttonGroup before ctaBtn
            ctaBtn.parentNode.insertBefore(buttonGroup, ctaBtn);
            // Move ctaBtn inside buttonGroup
            buttonGroup.appendChild(ctaBtn);
        }

        if (this.session) {
            // Logged in State
            let dashboardLink = "index.html";
            if (this.session.role === 'admin') dashboardLink = "admin.html";
            if (this.session.role === 'teacher') dashboardLink = "teacher.html";
            if (this.session.role === 'student') dashboardLink = "student.html";
            
            navLinks.innerHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="book.html">Book Demo</a></li>
                <li><a href="${dashboardLink}">My Dashboard</a></li>
                <li><a href="#" onclick="Auth.logout()" style="color:#F87171;">Logout (${this.session.name.split(' ')[0]})</a></li>
            `;
            
            if (buttonGroup) {
                // Hide outline Login button if present
                const loginBtn = document.getElementById('nav-login-btn');
                if (loginBtn) loginBtn.style.display = 'none';

                if (this.session.role === 'student') {
                    ctaBtn.style.display = 'inline-block';
                    ctaBtn.innerText = "Enter Classroom";
                    ctaBtn.href = "student.html";
                    ctaBtn.className = "btn btn-primary";
                } else if (this.session.role === 'admin') {
                    ctaBtn.style.display = 'inline-block';
                    ctaBtn.innerText = "Admin Panel";
                    ctaBtn.href = "admin.html";
                    ctaBtn.className = "btn btn-primary";
                } else if (this.session.role === 'teacher') {
                    ctaBtn.style.display = 'inline-block';
                    ctaBtn.innerText = "Coach Portal";
                    ctaBtn.href = "teacher.html";
                    ctaBtn.className = "btn btn-primary";
                } else {
                    ctaBtn.style.display = 'none';
                }
            }
        } else {
            // Logged out State
            navLinks.innerHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="book.html">Book Demo</a></li>
                <li><a href="login.html">Admin Hub</a></li>
                <li><a href="login.html">Teacher Portal</a></li>
            `;
            
            if (buttonGroup) {
                ctaBtn.style.display = 'inline-block';
                ctaBtn.innerText = "Book Free Class";
                ctaBtn.href = "book.html";
                ctaBtn.className = "btn btn-primary";

                // Add outline Login button dynamically
                const currentPath = window.location.pathname.split("/").pop() || "index.html";
                if (currentPath === "login.html") {
                    const loginBtn = document.getElementById('nav-login-btn');
                    if (loginBtn) loginBtn.style.display = 'none';
                } else {
                    let loginBtn = document.getElementById('nav-login-btn');
                    if (!loginBtn) {
                        loginBtn = document.createElement('a');
                        loginBtn.id = 'nav-login-btn';
                        loginBtn.href = 'login.html';
                        loginBtn.className = 'btn btn-secondary';
                        loginBtn.style.padding = '10px 20px';
                        loginBtn.style.fontSize = '14px';
                        loginBtn.style.textDecoration = 'none';
                        loginBtn.style.display = 'inline-flex';
                        loginBtn.style.alignItems = 'center';
                        loginBtn.style.gap = '6px';
                        loginBtn.style.borderRadius = '8px';
                        loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
                        
                        // Insert Login button before Book Free Class button
                        buttonGroup.insertBefore(loginBtn, ctaBtn);
                    } else {
                        loginBtn.style.display = 'inline-flex';
                    }
                }
            }
        }
    }
}

// Bulletproof execution hook matching document readiness
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        Auth.init();
    });
} else {
    Auth.init();
}

window.Auth = Auth;
