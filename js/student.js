// Chess Demo Booking - Student Portal Controller

document.addEventListener("DOMContentLoaded", () => {
    StudentController.init();
});

class StudentController {
    static init() {
        if (window.Auth) {
            window.Auth.protect('student');
            this.studentEmail = window.Auth.session.email;
        } else {
            this.studentEmail = "";
            window.location.href = "login.html";
            return;
        }

        this.cacheDOM();
        this.loadDashboardData();
    }

    static cacheDOM() {
        // Welcomes
        this.headerName = document.getElementById("student-header-name");
        this.welcomeTitle = document.getElementById("student-dash-welcome");
        
        // KPIs
        this.kpiDate = document.getElementById("student-kpi-date");
        this.kpiSlot = document.getElementById("student-kpi-slot");
        this.kpiLevel = document.getElementById("student-kpi-level");
        this.kpiEmail = document.getElementById("student-kpi-email");
        this.kpiCoach = document.getElementById("student-kpi-coach");

        // Demo details
        this.demoCardId = document.getElementById("demo-card-id");
        this.demoStatusBadge = document.getElementById("demo-status-badge");
        this.demoDateVal = document.getElementById("demo-date-val");
        this.demoSlotVal = document.getElementById("demo-slot-val");
        this.demoTimezoneVal = document.getElementById("demo-timezone-val");
        this.demoMeetBtn = document.getElementById("demo-meet-btn");
        this.demoMeetNote = document.getElementById("demo-meet-note");
        this.diagnosticContent = document.getElementById("diagnostic-content");

        // Profile panel
        this.profileStudentName = document.getElementById("profile-student-name");
        this.profileParentName = document.getElementById("profile-parent-name");
        this.profileMobile = document.getElementById("profile-mobile");
        this.profileLocation = document.getElementById("profile-location");
        this.profileAge = document.getElementById("profile-age");

        // Coach info
        this.assignedCoachInfo = document.getElementById("assigned-coach-info");
    }

    static loadDashboardData() {
        const bookings = window.ChessDB.getBookings();
        // Find bookings matching student email (latest first)
        const myBookings = bookings.filter(b => b.email === this.studentEmail);
        
        if (myBookings.length === 0) {
            window.Toast.show("No Booking Found", "No registered demo found for your account details.", "warning");
            document.body.innerHTML = `
                <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:20px; background:radial-gradient(circle, #f9fafb 0%, #f3f4f6 100%);">
                    <i class="fa-solid fa-chess-king" style="font-size:48px; color:var(--primary);"></i>
                    <h2 style="font-size:24px; font-weight:700;">No Booking Record Found</h2>
                    <p style="color:var(--text-secondary); max-width:400px; text-align:center;">We could not locate any active demo class booking matching <strong>${this.studentEmail}</strong>. Please schedule a class first.</p>
                    <div style="display:flex; gap:12px;">
                        <a href="book.html" class="btn btn-primary">Book Demo Class</a>
                        <button onclick="Auth.logout()" class="btn btn-secondary">Logout</button>
                    </div>
                </div>
            `;
            return;
        }

        // Use the latest booking record
        const booking = myBookings[myBookings.length - 1];

        // 1. Render welcomes
        if (this.headerName) this.headerName.innerText = booking.studentName;
        if (this.welcomeTitle) this.welcomeTitle.innerText = `Welcome back, ${booking.studentName}!`;

        // 2. Render KPIs
        if (this.kpiDate) this.kpiDate.innerText = this.formatDate(booking.date);
        if (this.kpiSlot) this.kpiSlot.innerText = booking.slot;
        if (this.kpiLevel) this.kpiLevel.innerText = booking.level;
        if (this.kpiEmail) {
            this.kpiEmail.innerText = booking.email;
            this.kpiEmail.title = booking.email;
        }
        if (this.kpiCoach) this.kpiCoach.innerText = booking.teacherName;

        // 3. Render Demo Card info
        if (this.demoCardId) this.demoCardId.innerText = `BOOKING ID: ${booking.id}`;
        
        if (this.demoStatusBadge) {
            this.demoStatusBadge.innerText = booking.status;
            this.demoStatusBadge.className = "badge"; // reset
            if (booking.status === "Demo Booked") this.demoStatusBadge.classList.add("badge-pending");
            else if (booking.status === "Demo Attended") this.demoStatusBadge.classList.add("badge-success");
            else if (booking.status === "Cancelled") this.demoStatusBadge.classList.add("badge-cancelled");
        }

        if (this.demoDateVal) this.demoDateVal.innerText = this.formatDate(booking.date);
        if (this.demoSlotVal) this.demoSlotVal.innerText = booking.slot;
        if (this.demoTimezoneVal) this.demoTimezoneVal.innerText = `${booking.timezone} • ${booking.language}`;
        
        if (this.demoMeetBtn) {
            if (booking.status === "Cancelled") {
                this.demoMeetBtn.removeAttribute("href");
                this.demoMeetBtn.style.pointerEvents = "none";
                this.demoMeetBtn.style.opacity = "0.4";
                this.demoMeetBtn.innerHTML = `<i class="fa-solid fa-ban"></i> Classroom Suspended`;
                if (this.demoMeetNote) this.demoMeetNote.innerText = "This class has been cancelled.";
            } else {
                this.demoMeetBtn.href = `classroom.html?id=${booking.id}`;
            }
        }

        // 4. Render Profile Specs
        if (this.profileStudentName) this.profileStudentName.innerText = booking.studentName;
        if (this.profileParentName) this.profileParentName.innerText = booking.parentName;
        if (this.profileMobile) this.profileMobile.innerText = booking.mobile;
        if (this.profileLocation) this.profileLocation.innerText = `${booking.city}, ${booking.country}`;
        if (this.profileAge) this.profileAge.innerText = `${booking.age} Years Old (Grade: ${booking.grade || 'N/A'})`;

        // 5. Fetch Coach details
        const teachers = window.ChessDB.getTeachers();
        const coach = teachers.find(t => t.id === booking.teacherId);
        
        if (this.assignedCoachInfo) {
            if (coach) {
                this.assignedCoachInfo.innerHTML = `
                    <img src="${coach.avatar}" alt="${coach.name}" class="coach-card-avatar">
                    <div style="flex: 1;">
                        <h4 style="font-size:14px; font-weight:600; color:var(--text-primary);">${coach.name}</h4>
                        <p style="font-size:11px; color:var(--text-secondary); margin: 2px 0;">${coach.experience}</p>
                        <div style="color: #F59E0B; font-size:11px;">★ ${coach.rating} ratings</div>
                    </div>
                `;
            } else {
                this.assignedCoachInfo.innerHTML = `
                    <div style="display:flex; align-items:center; gap:12px; padding:8px; color:var(--text-muted); font-size:12px;">
                        <i class="fa-solid fa-user-tie" style="font-size:24px;"></i>
                        <span>Coach profile details are unavailable.</span>
                    </div>
                `;
            }
        }

        // 6. Diagnostic Feedback Rendering
        if (this.diagnosticContent) {
            if (booking.feedback) {
                this.diagnosticContent.innerHTML = `
                    <div class="feedback-section">
                        <p style="font-size:13px; color:var(--text-primary); margin-bottom:12px; line-height:1.5;">
                            <strong>Assessment Notes:</strong><br>${booking.feedback}
                        </p>
                        <div style="font-size:12px; color:var(--primary); font-weight:600; display:flex; align-items:center; gap:6px;">
                            <i class="fa-solid fa-graduation-cap"></i> 
                            <span>Recommended Course: ${booking.recommendedCourse}</span>
                        </div>
                    </div>
                `;
            } else {
                this.diagnosticContent.innerHTML = `
                    <div style="text-align:center; padding: 24px; color:var(--text-muted); font-size:12px; background:rgba(255,255,255,0.01); border-radius:var(--radius-sm); border:1px dashed var(--border-color); margin-top:10px;">
                        <i class="fa-solid fa-hourglass-half" style="font-size:20px; color:var(--text-muted); margin-bottom:8px; display:block; opacity:0.6;"></i>
                        <p>No assessment feedback logged yet. Diagnostic report will be published here after your live trial session with the coach!</p>
                    </div>
                `;
            }
        }
    }

    static formatDate(dateStr) {
        if (!dateStr) return "--";
        try {
            const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
            const d = new Date(dateStr);
            return d.toLocaleDateString("en-US", options);
        } catch (e) {
            return dateStr;
        }
    }
}

window.StudentController = StudentController;
