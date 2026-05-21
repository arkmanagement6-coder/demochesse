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

        if (this.session) {
            // Logged in State
            let dashboardLink = "index.html";
            if (this.session.role === 'admin') dashboardLink = "admin.html";
            if (this.session.role === 'teacher') dashboardLink = "teacher.html";
            
            navLinks.innerHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="book.html">Book Demo</a></li>
                <li><a href="${dashboardLink}">My Dashboard</a></li>
                <li><a href="#" onclick="Auth.logout()" style="color:#F87171;">Logout (${this.session.name.split(' ')[0]})</a></li>
            `;
            if (ctaBtn) {
                if (this.session.role === 'student') {
                    ctaBtn.style.display = 'inline-block';
                } else {
                    ctaBtn.style.display = 'none';
                }
            }
        } else {
            // Logged out State
            navLinks.innerHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="book.html">Book Demo</a></li>
                <li><a href="login.html" style="color:var(--primary);">Login Portal</a></li>
            `;
            if (ctaBtn) ctaBtn.style.display = 'inline-block';
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    Auth.init();
});

window.Auth = Auth;
