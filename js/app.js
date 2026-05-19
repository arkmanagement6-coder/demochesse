// Chess Demo Booking - Shared Global Application Scripts
// Handles common UI patterns, notifications console, and dynamic page widgets

document.addEventListener("DOMContentLoaded", () => {
    // 0. Inject and Setup Mobile Hamburger menu
    setupMobileNav();
    
    // 1. Setup global notification center
    NotificationCenter.init();
    
    // 2. Setup FAQ collapsible items
    setupFAQAccordions();
    
    // 3. Highlight current page in navbar
    highlightActiveNavLink();
});

// FAQ Handler
function setupFAQAccordions() {
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(item => {
        item.addEventListener("click", () => {
            const isActive = item.classList.contains("active");
            
            // Close all items
            faqItems.forEach(i => i.classList.remove("active"));
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add("active");
            }
        });
    });
}

// Navbar Highlight
function highlightActiveNavLink() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".nav-links a");
    navLinks.forEach(link => {
        const linkPath = link.getAttribute("href");
        if (linkPath === currentPath) {
            link.style.color = "var(--primary)";
            link.style.fontWeight = "600";
            link.style.textShadow = "0 0 8px var(--primary-glow)";
        }
    });
}

// Dynamic Hamburger Mobile Nav Injection & Handler
function setupMobileNav() {
    const headerContainer = document.querySelector(".header-container");
    if (!headerContainer) return;
    
    // Create and inject Hamburger Button if not exists
    if (!document.getElementById("mobile-toggle")) {
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "mobile-nav-toggle";
        toggleBtn.id = "mobile-toggle";
        toggleBtn.setAttribute("aria-label", "Toggle navigation");
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        
        const nav = headerContainer.querySelector("nav");
        if (nav) {
            headerContainer.insertBefore(toggleBtn, nav);
        } else {
            headerContainer.appendChild(toggleBtn);
        }
    }
    
    const mobileToggle = document.getElementById("mobile-toggle");
    const navLinks = document.querySelector(".nav-links");
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            const icon = mobileToggle.querySelector("i");
            
            if (navLinks.classList.contains("active")) {
                icon.className = "fa-solid fa-xmark";
                
                // Inject overlay
                let overlay = document.getElementById("mobile-nav-overlay");
                if (!overlay) {
                    overlay = document.createElement("div");
                    overlay.id = "mobile-nav-overlay";
                    overlay.style.position = "fixed";
                    overlay.style.top = "0";
                    overlay.style.left = "0";
                    overlay.style.width = "100%";
                    overlay.style.height = "100%";
                    overlay.style.background = "rgba(17, 24, 39, 0.4)";
                    overlay.style.backdropFilter = "blur(4px)";
                    overlay.style.zIndex = "1002";
                    document.body.appendChild(overlay);
                    
                    overlay.addEventListener("click", () => {
                        navLinks.classList.remove("active");
                        icon.className = "fa-solid fa-bars";
                        overlay.remove();
                    });
                }
            } else {
                icon.className = "fa-solid fa-bars";
                const overlay = document.getElementById("mobile-nav-overlay");
                if (overlay) overlay.remove();
            }
        });
        
        // Auto-close menu when clicking links on same page
        const links = navLinks.querySelectorAll("a");
        links.forEach(l => {
            l.addEventListener("click", () => {
                navLinks.classList.remove("active");
                const icon = mobileToggle.querySelector("i");
                if (icon) icon.className = "fa-solid fa-bars";
                const overlay = document.getElementById("mobile-nav-overlay");
                if (overlay) overlay.remove();
            });
        });
    }
}

// ----------------------------------------------------
// Global Toast System
// ----------------------------------------------------
class Toast {
    static show(title, message, type = "success") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.style.position = "fixed";
            container.style.top = "20px";
            container.style.right = "20px";
            container.style.zIndex = "999";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "10px";
            container.style.pointerEvents = "none";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `glass-card`;
        toast.style.padding = "16px 20px";
        toast.style.width = "320px";
        toast.style.pointerEvents = "auto";
        toast.style.animation = "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards";
        toast.style.display = "flex";
        toast.style.flexDirection = "column";
        toast.style.gap = "4px";
        toast.style.borderLeft = `4px solid ${type === "success" ? "var(--accent)" : type === "warning" ? "#F59E0B" : "#EF4444"}`;

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.fontWeight = "700";
        header.style.fontSize = "14px";
        header.innerHTML = `<span>${title}</span>`;

        const body = document.createElement("div");
        body.style.fontSize = "12px";
        body.style.color = "var(--text-secondary)";
        body.innerText = message;

        toast.appendChild(header);
        toast.appendChild(body);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "slideOut 0.3s forwards";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Add slideOut keyframes to document head
const style = document.createElement('style');
style.innerHTML = `
@keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100px); }
}
`;
document.head.appendChild(style);

// ----------------------------------------------------
// Notification Center & Floating Drawer
// ----------------------------------------------------
class NotificationCenter {
    static init() {
        // Prevent double insertion
        if (document.getElementById("notif-drawer-container")) return;

        // Create Container
        const container = document.createElement("div");
        container.id = "notif-drawer-container";
        
        // Drawer HTML Structure
        container.innerHTML = `
            <!-- Floating Notification Bell -->
            <button class="notification-bell-btn" id="notif-bell">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
                <div class="bell-badge" id="bell-badge">0</div>
            </button>

            <!-- Slide-out Drawer Panel -->
            <div class="notif-drawer" id="notif-drawer">
                <div class="notif-header">
                    <h3 style="font-size: 18px; font-weight: 700;">Simulated CRM Logs</h3>
                    <div style="display:flex; gap: 10px; align-items:center;">
                        <button id="clear-notif" style="background:none; border:none; color:var(--text-muted); font-size:11px; cursor:pointer;">Clear All</button>
                        <span id="close-notif" class="modal-close">&times;</span>
                    </div>
                </div>
                <div class="notif-list" id="notif-list-view">
                    <!-- Logs dynamically loaded -->
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Bind Actions
        const bellBtn = document.getElementById("notif-bell");
        const closeBtn = document.getElementById("close-notif");
        const clearBtn = document.getElementById("clear-notif");
        const drawer = document.getElementById("notif-drawer");

        bellBtn.addEventListener("click", () => {
            drawer.classList.toggle("active");
            this.loadLogs();
        });

        closeBtn.addEventListener("click", () => {
            drawer.classList.remove("active");
        });

        clearBtn.addEventListener("click", () => {
            localStorage.setItem("chess_logs", JSON.stringify([]));
            this.loadLogs();
            Toast.show("Cleared Logs", "Simulated notification pipeline is cleared.");
        });

        // Initialize Counter
        this.updateBadgeCount();
        
        // Poll for updates (simplified check for testing)
        setInterval(() => this.updateBadgeCount(), 2000);
    }

    static updateBadgeCount() {
        const logs = window.ChessDB.getLogs();
        const badge = document.getElementById("bell-badge");
        if (badge) {
            badge.innerText = logs.length;
            badge.style.display = logs.length > 0 ? "flex" : "none";
        }
    }

    static loadLogs() {
        const logs = window.ChessDB.getLogs();
        const listView = document.getElementById("notif-list-view");
        if (!listView) return;

        listView.innerHTML = "";

        if (logs.length === 0) {
            listView.innerHTML = `
                <div style="text-align:center; padding: 40px 0; color:var(--text-muted); font-size:13px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; opacity:0.5;"><path d="M22 12h-6l-3 9L9 3l-3 9H2"></path></svg>
                    <p>No simulated logs recorded yet.</p>
                </div>
            `;
            return;
        }

        logs.forEach(log => {
            const card = document.createElement("div");
            card.className = "notif-card";
            
            const timeAgo = this.formatTime(new Date(log.timestamp));
            
            card.innerHTML = `
                <div class="notif-meta">
                    <span class="notif-channel channel-${log.type}">${log.type}</span>
                    <span class="notif-time">${timeAgo}</span>
                </div>
                <div style="word-break: break-word;">${log.message}</div>
            `;
            listView.appendChild(card);
        });

        this.updateBadgeCount();
    }

    static formatTime(date) {
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        return date.toLocaleDateString();
    }

    /**
     * Triggers a live simulated notification and logs it
     * @param {string} type 'whatsapp' | 'email' | 'sms' | 'system'
     * @param {string} message Text message contents
     */
    static dispatch(type, message) {
        window.ChessDB.addLog(type, message);
        this.updateBadgeCount();
        
        let prefix = "📲 SMS";
        if (type === "whatsapp") prefix = "💬 WhatsApp";
        if (type === "email") prefix = "✉️ Email Sent";
        if (type === "system") prefix = "⚙️ Engine Match";

        Toast.show(prefix, message, type === "system" ? "warning" : "success");
    }

    // High fidelity template triggerers
    static triggerStudentConfirmation(studentName, parentName, date, slot, teacherName, method = "whatsapp") {
        const msg = `Hi ${parentName}, your 1-on-1 Chess Demo class for ${studentName} is confirmed with Coach ${teacherName} on ${date} at ${slot}. Join link: https://meet.google.com/chess-demo`;
        this.dispatch(method, msg);
    }

    static triggerTeacherConfirmation(teacherName, studentName, level, date, slot) {
        const msg = `Hi Coach ${teacherName}, a new ${level} Chess Demo has been scheduled with student ${studentName} on ${date} at ${slot}. Briefing profile updated in your portal.`;
        this.dispatch("email", msg);
    }
}

window.NotificationCenter = NotificationCenter;
window.Toast = Toast;
