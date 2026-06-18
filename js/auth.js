// Chess Demo Booking - Global Authentication Controller

class Auth {
    static init() {
        try {
            this.session = JSON.parse(localStorage.getItem("chess_active_session"));
        } catch (e) {
            console.error("Auth init session parsing failed, resetting:", e);
            localStorage.removeItem("chess_active_session");
            this.session = null;
        }
        this.updateNav();
    }

    static login(email, password, role) {
        let user = null;

        if (role === 'admin') {
            let adminCreds = { email: 'admin@parashchess.com', password: 'admin123' };
            try {
                const stored = localStorage.getItem("chess_admin_credentials");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && parsed.email && parsed.password) {
                        adminCreds = parsed;
                    }
                }
            } catch (e) {
                console.error("Failed to parse admin credentials from localStorage:", e);
            }
            if (email === adminCreds.email && password === adminCreds.password) {
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
        const currentRole = this.session ? this.session.role : null;
        localStorage.removeItem("chess_active_session");
        this.session = null;
        if (currentRole === 'admin' || currentRole === 'teacher') {
            window.location.href = "portal.html";
        } else {
            window.location.href = "login.html";
        }
    }

    static protect(roleRequired) {
        if (!this.session) {
            this.session = JSON.parse(localStorage.getItem("chess_active_session"));
        }
        if (!this.session || this.session.role !== roleRequired) {
            if (roleRequired === 'admin' || roleRequired === 'teacher') {
                window.location.href = "portal.html";
            } else {
                window.location.href = "login.html";
            }
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

        const currentPath = window.location.pathname.split("/").pop() || "index.html";
        const isHomePage = currentPath === "index.html" || currentPath === "";

        if (isHomePage) {
            // Keep home page extremely clean and clear of all center menu options
            navLinks.innerHTML = '';
            navLinks.style.display = 'none';
            
            // Still manage action buttons on the right
            if (buttonGroup) {
                if (this.session) {
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
                        ctaBtn.innerText = "Book Free Demo";
                        ctaBtn.href = "admin.html";
                        ctaBtn.className = "btn btn-primary";
                    } else if (this.session.role === 'teacher') {
                        ctaBtn.style.display = 'inline-block';
                        ctaBtn.innerText = "Book Free Demo";
                        ctaBtn.href = "teacher.html";
                        ctaBtn.className = "btn btn-primary";
                    } else {
                        ctaBtn.style.display = 'none';
                    }
                } else {
                    ctaBtn.style.display = 'inline-block';
                    ctaBtn.innerText = "Book Free Demo";
                    ctaBtn.href = "book.html";
                    ctaBtn.className = "btn btn-primary";

                    // Hide outline Login button on the homepage
                    const loginBtn = document.getElementById('nav-login-btn');
                    if (loginBtn) loginBtn.style.display = 'none';
                }
            }
        } else if (this.session) {
            navLinks.style.display = 'flex';
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
                    ctaBtn.innerText = "Book Free Demo";
                    ctaBtn.href = "admin.html";
                    ctaBtn.className = "btn btn-primary";
                } else if (this.session.role === 'teacher') {
                    ctaBtn.style.display = 'inline-block';
                    ctaBtn.innerText = "Book Free Demo";
                    ctaBtn.href = "teacher.html";
                    ctaBtn.className = "btn btn-primary";
                } else {
                    ctaBtn.style.display = 'none';
                }
            }
        } else {
            navLinks.style.display = 'flex';
            // Logged out State
            navLinks.innerHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="book.html">Book Demo</a></li>
            `;
            
            if (buttonGroup) {
                ctaBtn.style.display = 'inline-block';
                ctaBtn.innerText = "Book Free Demo";
                ctaBtn.href = "book.html";
                ctaBtn.className = "btn btn-primary";

                // Add outline Login button dynamically
                if (currentPath === "login.html" || currentPath === "portal.html") {
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
