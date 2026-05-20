// Chess Demo Booking - Teacher Portal Controller

document.addEventListener("DOMContentLoaded", () => {
    TeacherController.init();
});

class TeacherController {
    static init() {
        this.activeTeacherId = "";
        this.activeBookingId = null;

        this.cacheDOM();
        this.bindEvents();
        this.initializeProfileSwitcher();
    }

    static cacheDOM() {
        this.switcher = document.getElementById("teacher-profile-switcher");
        this.dashPic = document.getElementById("teacher-dash-pic");
        this.dashName = document.getElementById("teacher-dash-name");
        this.dashExp = document.getElementById("teacher-dash-exp");
        this.dashStars = document.getElementById("teacher-dash-stars");

        // KPI Widgets
        this.metricToday = document.getElementById("coach-metric-today");
        this.metricTotal = document.getElementById("coach-metric-total");
        this.metricLeaves = document.getElementById("coach-metric-leaves");
        this.metricStudents = document.getElementById("coach-metric-students");

        // List Grid
        this.demosList = document.getElementById("teacher-demos-list");

        // Modals
        this.modalFeedback = document.getElementById("modal-feedback");
        this.closeFeedback = document.getElementById("modal-close-feedback");
        this.feedbackForm = document.getElementById("feedback-submit-form");

        // Modal inputs
        this.feedAttendance = document.getElementById("feed-attendance");
        this.feedNotes = document.getElementById("feed-notes");
        this.feedCourse = document.getElementById("feed-course");
        this.feedRecommend = document.getElementById("feed-recommend-paid");

        // Reschedule Modal
        this.modalResched = document.getElementById("modal-resched");
        this.closeResched = document.getElementById("modal-close-resched");
        this.reschedDate = document.getElementById("resched-date");
        this.reschedSlot = document.getElementById("resched-slot");
    }

    static bindEvents() {
        // Toggle Switcher profile
        this.switcher.addEventListener("change", () => {
            this.activeTeacherId = this.switcher.value;
            this.loadProfile();
        });

        // Close modal
        this.closeFeedback.addEventListener("click", () => this.closeModal());
        if(this.closeResched) {
            this.closeResched.addEventListener("click", () => this.closeModal());
        }

        // Submit feedback Form
        this.feedbackForm.addEventListener("submit", (e) => {
            e.preventDefault();
            this.saveEvaluationFeedback();
        });
    }

    static openModal(bookingId) {
        this.activeBookingId = bookingId;
        this.modalFeedback.classList.add("active");
    }

    static closeModal() {
        this.modalFeedback.classList.remove("active");
        if(this.modalResched) this.modalResched.classList.remove("active");
        this.feedbackForm.reset();
        this.activeBookingId = null;
    }

    // Load Initial switcher dropdown
    static initializeProfileSwitcher() {
        const teachers = window.ChessDB.getTeachers();
        this.switcher.innerHTML = "";

        teachers.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.innerText = t.name;
            this.switcher.appendChild(opt);
        });

        // Set default profile Aarav Sharma
        if (teachers.length > 0) {
            this.activeTeacherId = teachers[0].id;
            this.switcher.value = this.activeTeacherId;
            this.loadProfile();
        }
    }

    // Render active teacher specs
    static loadProfile() {
        const teachers = window.ChessDB.getTeachers();
        const coach = teachers.find(t => t.id === this.activeTeacherId);
        if (!coach) return;

        // Render card
        this.dashPic.src = coach.avatar;
        this.dashName.innerText = coach.name;
        this.dashExp.innerText = coach.experience;
        this.dashStars.innerText = `★ ${coach.rating} Star Ratings`;

        // Render Widgets & List
        this.loadMetrics(coach);
        this.loadAssignedDemos();
    }

    // Calculate Coach stats
    static loadMetrics(coach) {
        const bookings = window.ChessDB.getBookings();
        const todayStr = new Date().toISOString().split("T")[0];

        // 1. Demos Today
        const todayCount = bookings.filter(b => 
            b.teacherId === coach.id && 
            b.date === todayStr && 
            b.status === "Demo Booked"
        ).length;
        this.metricToday.innerText = todayCount;

        // 2. Total demos scheduled in record
        const totalCount = bookings.filter(b => b.teacherId === coach.id && b.status !== "Cancelled").length;
        this.metricTotal.innerText = totalCount;

        // 3. Leaves registered count
        const leavesCount = coach.leaves ? coach.leaves.length : 0;
        this.metricLeaves.innerText = `${leavesCount} days`;

        // 4. Long term student roster
        this.metricStudents.innerText = coach.activeStudents;
    }

    static loadAssignedDemos() {
        const bookings = window.ChessDB.getBookings();
        const teachers = window.ChessDB.getTeachers();
        const coach = teachers.find(t => t.id === this.activeTeacherId);
        const filtered = bookings.filter(b => b.teacherId === this.activeTeacherId);
        
        this.demosList.innerHTML = "";

        if (filtered.length === 0) {
            this.demosList.innerHTML = `
                <div class="glass-card" style="grid-column:span 2; padding:40px; text-align:center; color:var(--text-muted);">
                    <p style="font-size:14px;">No demo bookings allocated on your roster card currently.</p>
                </div>
            `;
            return;
        }

        filtered.reverse().forEach(b => {
            const card = document.createElement("div");
            card.className = "glass-card";
            card.style.padding = "24px";
            card.style.position = "relative";
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.gap = "12px";

            // Status badges
            let badgeHtml = `<span class="badge badge-pending">Scheduled</span>`;
            if (b.status === "Demo Attended") badgeHtml = `<span class="badge badge-success">Attended</span>`;
            if (b.status === "Cancelled") badgeHtml = `<span class="badge badge-cancelled">Cancelled</span>`;

            // Render details
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11px; color:var(--text-muted);">${b.date} • ${b.slot}</span>
                    ${badgeHtml}
                </div>
                
                <div>
                    <h3 style="font-size:18px;">${b.studentName}</h3>
                    <p style="font-size:11px; color:var(--text-secondary);">Age: ${b.age} • Level: ${b.level} • Spoken: ${b.language}${coach && coach.phoneAccessApproved && b.mobile ? ` • <strong style="color:var(--primary);">📞 ${b.mobile}</strong>` : ''}</p>
                </div>

                <p style="font-size:12px; color:var(--text-secondary); background:rgba(255,255,255,0.02); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                    💡 <strong style="color:var(--text-primary);">Student Profile:</strong> ${b.notes || "No initial briefing."}
                </p>
                
                ${b.feedback ? `
                    <div style="font-size:12px; color:var(--accent); border-top:1px solid var(--border-color); padding-top:10px;">
                        🎯 <strong>Evaluation Submitted:</strong> ${b.feedback}
                        <br><span style="font-size:10px; color:var(--text-muted);">Recommended: ${b.recommendedCourse}</span>
                    </div>
                ` : ""}

                <div style="display:flex; gap:10px; margin-top:auto; padding-top:10px; border-top:1px solid var(--border-color);">
                    <a href="${b.meetingLink}" target="_blank" class="btn btn-primary" style="flex:1; padding:8px 16px; font-size:12px; text-align:center;">
                        Join Classroom
                    </a>
                    ${!b.feedback && b.status !== "Cancelled" ? `
                        <button type="button" class="btn btn-secondary" style="padding:8px 16px; font-size:12px; flex:1;" onclick="TeacherController.triggerReschedule('${b.id}')">
                            Reschedule
                        </button>
                        <button type="button" class="btn btn-secondary" style="padding:8px 16px; font-size:12px; flex:1;" onclick="TeacherController.openEvaluation('${b.id}')">
                            Log Feedback
                        </button>
                    ` : ""}
                </div>
            `;
            this.demosList.appendChild(card);
        });
    }

    static openEvaluation(bookingId) {
        this.openModal(bookingId);
    }

    // Reschedule
    static triggerReschedule(bookingId) {
        const bookings = window.ChessDB.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;

        this.activeBookingId = bookingId;
        this.reschedDate.value = booking.date;
        this.reschedSlot.value = booking.slot;
        
        this.modalResched.classList.add("active");
    }

    static saveReschedule() {
        const date = this.reschedDate.value;
        const slot = this.reschedSlot.value;

        if (!date || !slot) {
            window.Toast.show("Error", "Please pick valid date and slot.", "danger");
            return;
        }

        const bookings = window.ChessDB.getBookings();
        const booking = bookings.find(b => b.id === this.activeBookingId);
        if (booking) {
            booking.date = date;
            booking.slot = slot;
            booking.status = "Demo Booked";
            window.ChessDB.saveBookings(bookings);

            window.NotificationCenter.dispatch("system", `Coach rescheduled booking for ${booking.studentName} to ${date} at ${slot}.`);
            window.NotificationCenter.triggerStudentConfirmation(booking.studentName, booking.parentName, date, slot, booking.teacherName, "whatsapp");
            window.NotificationCenter.triggerStudentConfirmation(booking.studentName, booking.parentName, date, slot, booking.teacherName, "email");

            this.closeModal();
            this.loadProfile();
            window.Toast.show("Success", "Rescheduled successfully. Notification alert triggered.", "success");
        }
    }

    // Submit report and update statuses
    static saveEvaluationFeedback() {
        const attendance = this.feedAttendance.value;
        const notes = this.feedNotes.value;
        const course = this.feedCourse.value;
        const recommendPaid = this.feedRecommend.checked;

        const bookings = window.ChessDB.getBookings();
        const booking = bookings.find(b => b.id === this.activeBookingId);

        if (booking) {
            booking.status = attendance;
            booking.feedback = notes;
            booking.recommendedCourse = course;

            if (attendance === "Cancelled") {
                booking.crmStatus = "Lost";
            } else {
                // If recommended converted, set conversion stage directly
                booking.crmStatus = recommendPaid ? "Converted" : "Demo attended";
            }

            window.ChessDB.saveBookings(bookings);

            // Trigger simulated teacher notifications to student parent
            window.NotificationCenter.dispatch("system", `Coach ${booking.teacherName} submitted diagnostic feedback for student ${booking.studentName}.`);
            
            if (attendance !== "Cancelled") {
                window.NotificationCenter.dispatch("email", `Parash Chess Assessment Report for ${booking.studentName}: ${notes}. Recommended Curriculum Course Track: ${course}. Register paid enrollment details plan.`);
            }

            // Close, reset & refresh view
            this.closeModal();
            this.loadProfile();
            window.Toast.show("Report Submitted", "Diagnostic report synced with CRM platform pipeline successfully.", "success");
        }
    }
}

// Global hook for inline cards buttons click
window.TeacherController = TeacherController;
