// Chess Demo Booking - Admin Console Controller

document.addEventListener("DOMContentLoaded", () => {
    AdminController.init();
});

class AdminController {
    static init() {
        this.activeBookingId = null;
        this.cacheDOM();
        this.bindEvents();
        
        // Load default views
        this.loadMetrics();
        this.loadActivityLogs();
        this.loadBookingsTable();
        this.loadTeacherRosters();
        this.loadCRMPipeline();
        this.renderReports();
    }

    static cacheDOM() {
        // Navigation
        this.sidebarLinks = document.querySelectorAll(".sidebar-link");
        this.sections = document.querySelectorAll(".admin-section");

        // Metrics widgets
        this.metricToday = document.getElementById("metric-today");
        this.metricPending = document.getElementById("metric-pending");
        this.metricCompleted = document.getElementById("metric-completed");
        this.metricConversion = document.getElementById("metric-conversion");

        // Table bodies
        this.activityLogBody = document.getElementById("activity-log-table-body");
        this.bookingsTableBody = document.getElementById("bookings-table-body");
        this.bookingSearch = document.getElementById("booking-search");

        // Modals
        this.modalResched = document.getElementById("modal-reschedule");
        this.modalReassign = document.getElementById("modal-reassign");
        this.modalAddt = document.getElementById("modal-add-teacher");

        // Close selectors
        this.closeResched = document.getElementById("modal-close-resched");
        this.closeReassign = document.getElementById("modal-close-reassign");
        this.closeAddt = document.getElementById("modal-close-addt");

        // Action Buttons
        this.btnSaveResched = document.getElementById("btn-save-resched");
        this.btnSaveReassign = document.getElementById("btn-save-reassign");
        this.btnAddtOpen = document.getElementById("btn-add-teacher");
        this.addtForm = document.getElementById("add-teacher-form");

        // Modal inputs
        this.reschedDate = document.getElementById("resched-date-input");
        this.reschedSlot = document.getElementById("resched-slot-input");
        this.reassignSelect = document.getElementById("reassign-teacher-select");

        // Roster Grid
        this.rosterGrid = document.getElementById("teachers-roster-grid");
        
        // Reports
        this.barChart = document.getElementById("reports-bar-chart");
        this.horizChart = document.getElementById("reports-horizontal-chart");
    }

    static bindEvents() {
        // Tab switching
        this.sidebarLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                this.sidebarLinks.forEach(l => l.classList.remove("active"));
                this.sections.forEach(s => s.classList.remove("active"));

                const activeLink = e.currentTarget;
                activeLink.classList.add("active");
                
                const targetId = activeLink.getAttribute("data-target");
                document.getElementById(targetId).classList.add("active");
            });
        });

        // Search action
        this.bookingSearch.addEventListener("input", () => this.loadBookingsTable());

        // Modal closures
        this.closeResched.addEventListener("click", () => this.closeModal(this.modalResched));
        this.closeReassign.addEventListener("click", () => this.closeModal(this.modalReassign));
        this.closeAddt.addEventListener("click", () => this.closeModal(this.modalAddt));

        // Save reschedule action
        this.btnSaveResched.addEventListener("click", () => this.saveReschedule());

        // Save reassignment action
        this.btnSaveReassign.addEventListener("click", () => this.saveReassignment());

        // Add Coach triggers
        this.btnAddtOpen.addEventListener("click", () => this.openModal(this.modalAddt));
        this.addtForm.addEventListener("submit", (e) => {
            e.preventDefault();
            this.saveNewTeacher();
        });
    }

    // Modal Helpers
    static openModal(modal) {
        modal.classList.add("active");
    }

    static closeModal(modal) {
        modal.classList.remove("active");
        this.activeBookingId = null;
    }

    // Metric KPI Computations
    static loadMetrics() {
        const bookings = window.ChessDB.getBookings();
        const todayStr = new Date().toISOString().split("T")[0];

        // 1. Scheduled today
        const todayCount = bookings.filter(b => b.date === todayStr && b.status !== "Cancelled").length;
        this.metricToday.innerText = todayCount;

        // 2. Pending Classes
        const pendingCount = bookings.filter(b => b.status === "Demo Booked").length;
        this.metricPending.innerText = pendingCount;

        // 3. Completed classes
        const completedCount = bookings.filter(b => b.status === "Demo Attended").length;
        this.metricCompleted.innerText = completedCount;

        // 4. Conversion Rate (Attended leads converted to full package paid classes)
        const totalAttendedLeads = bookings.filter(b => b.status === "Demo Attended").length;
        const convertedCount = bookings.filter(b => b.crmStatus === "Converted").length;
        
        let convRate = 0;
        if (totalAttendedLeads > 0) {
            convRate = Math.round((convertedCount / totalAttendedLeads) * 100);
        }
        this.metricConversion.innerText = `${convRate}%`;
    }

    // Recent System logs
    static loadActivityLogs() {
        const logs = window.ChessDB.getLogs().slice(0, 5); // display latest 5
        this.activityLogBody.innerHTML = "";

        if (logs.length === 0) {
            this.activityLogBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No activity recorded.</td></tr>`;
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement("tr");
            const time = new Date(log.timestamp).toLocaleTimeString();
            
            tr.innerHTML = `
                <td style="color:var(--text-muted); font-size:12px;">${time}</td>
                <td><span class="notif-channel channel-${log.type}">${log.type}</span></td>
                <td style="font-size:13px;">${log.message}</td>
            `;
            this.activityLogBody.appendChild(tr);
        });
    }

    // Booking management operations
    static loadBookingsTable() {
        const bookings = window.ChessDB.getBookings();
        const query = this.bookingSearch.value.toLowerCase();
        
        this.bookingsTableBody.innerHTML = "";

        const filtered = bookings.filter(b => 
            b.studentName.toLowerCase().includes(query) ||
            b.parentName.toLowerCase().includes(query) ||
            b.teacherName.toLowerCase().includes(query) ||
            b.city.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            this.bookingsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No booking records found.</td></tr>`;
            return;
        }

        filtered.reverse().forEach(b => {
            const tr = document.createElement("tr");
            
            // Format status styling
            let statusBadge = `<span class="badge badge-pending">Booked</span>`;
            if (b.status === "Demo Attended") statusBadge = `<span class="badge badge-success">Attended</span>`;
            if (b.status === "Cancelled") statusBadge = `<span class="badge badge-cancelled">Cancelled</span>`;

            // CRM Stage colors
            let crmColor = "var(--text-secondary)";
            if (b.crmStatus === "Converted") crmColor = "var(--accent)";
            if (b.crmStatus === "Lost") crmColor = "#EF4444";

            tr.innerHTML = `
                <td>
                    <div style="font-weight:600;">${b.studentName}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${b.city}, ${b.country} (${b.level})</div>
                </td>
                <td>
                    <div>${b.date}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${b.slot}</div>
                </td>
                <td>${b.teacherName}</td>
                <td>${b.paymentStatus === "Paid" ? "💎 Premium" : "🆓 Free"}</td>
                <td>${statusBadge}</td>
                <td style="font-weight:600; color:${crmColor}; text-transform:capitalize;">${b.crmStatus}</td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="action-icon-btn" title="Reschedule" onclick="AdminController.triggerReschedule('${b.id}')">🕒</button>
                        <button class="action-icon-btn" title="Reassign Coach" onclick="AdminController.triggerReassign('${b.id}')">👤</button>
                        <button class="action-icon-btn" title="Mark Attended" onclick="AdminController.markAttended('${b.id}')">✅</button>
                        <button class="action-icon-btn" title="Cancel Booking" onclick="AdminController.cancelBooking('${b.id}')" style="color:#EF4444;">&times;</button>
                    </div>
                </td>
            `;
            this.bookingsTableBody.appendChild(tr);
        });
    }

    // Reschedule Operations
    static triggerReschedule(id) {
        const bookings = window.ChessDB.getBookings();
        const booking = bookings.find(b => b.id === id);
        if (!booking) return;

        this.activeBookingId = id;
        this.reschedDate.value = booking.date;
        this.reschedSlot.value = booking.slot;
        
        this.openModal(this.modalResched);
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
            booking.status = "Demo Booked"; // reverts cancellation status if active
            window.ChessDB.saveBookings(bookings);

            // Log activity trigger
            window.NotificationCenter.dispatch("system", `Admin rescheduled booking for ${booking.studentName} to ${date} at ${slot}.`);
            window.NotificationCenter.triggerStudentConfirmation(booking.studentName, booking.parentName, date, slot, booking.teacherName, "whatsapp");

            this.closeModal(this.modalResched);
            this.refreshAllData();
            window.Toast.show("Success", "Rescheduled successfully. Notification alert triggered.", "success");
        }
    }

    // Reassign Operations
    static triggerReassign(id) {
        const bookings = window.ChessDB.getBookings();
        const booking = bookings.find(b => b.id === id);
        if (!booking) return;

        this.activeBookingId = id;
        
        // Find qualified coaches matching level and slot in directory
        const teachers = window.ChessDB.getTeachers();
        this.reassignSelect.innerHTML = "";

        const eligible = teachers.filter(t => 
            t.expertise.includes(booking.level) && 
            t.languages.includes(booking.language)
        );

        if (eligible.length === 0) {
            // fallback load all teachers
            teachers.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t.id;
                opt.innerText = `${t.name} (Mismatch expertise / language)`;
                this.reassignSelect.appendChild(opt);
            });
        } else {
            eligible.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t.id;
                opt.innerText = `${t.name} (Match! Score priority: ${t.priorityScore})`;
                if (booking.teacherId === t.id) opt.selected = true;
                this.reassignSelect.appendChild(opt);
            });
        }

        this.openModal(this.modalReassign);
    }

    static saveReassignment() {
        const teacherId = this.reassignSelect.value;
        const teachers = window.ChessDB.getTeachers();
        const selectedTeacher = teachers.find(t => t.id === teacherId);

        if (!selectedTeacher) return;

        const bookings = window.ChessDB.getBookings();
        const booking = bookings.find(b => b.id === this.activeBookingId);
        
        if (booking) {
            booking.teacherId = teacherId;
            booking.teacherName = selectedTeacher.name;
            window.ChessDB.saveBookings(bookings);

            window.NotificationCenter.dispatch("system", `Admin manual override: Reassigned coach ${selectedTeacher.name} to student ${booking.studentName}.`);
            window.NotificationCenter.triggerTeacherConfirmation(selectedTeacher.name, booking.studentName, booking.level, booking.date, booking.slot);

            this.closeModal(this.modalReassign);
            this.refreshAllData();
            window.Toast.show("Success", `Reassigned to coach ${selectedTeacher.name}!`, "success");
        }
    }

    // Direct Quick Actions
    static markAttended(id) {
        const bookings = window.ChessDB.getBookings();
        const booking = bookings.find(b => b.id === id);
        if (booking) {
            booking.status = "Demo Attended";
            booking.crmStatus = "Demo attended";
            window.ChessDB.saveBookings(bookings);

            window.NotificationCenter.dispatch("system", `Student ${booking.studentName} attended demo with coach ${booking.teacherName}.`);
            window.NotificationCenter.dispatch("whatsapp", `Hi ${booking.parentName}, hope you enjoyed Kabir's class with Coach ${booking.teacherName}. Register paid enrollment dashboard plan to proceed.`);
            
            this.refreshAllData();
            window.Toast.show("Session Completed", "Status marked as attended.", "success");
        }
    }

    static cancelBooking(id) {
        if (!confirm("Are you sure you want to cancel this scheduled demo booking?")) return;

        const bookings = window.ChessDB.getBookings();
        const booking = bookings.find(b => b.id === id);
        if (booking) {
            booking.status = "Cancelled";
            booking.crmStatus = "Lost";
            window.ChessDB.saveBookings(bookings);

            window.NotificationCenter.dispatch("system", `Demo booking for student ${booking.studentName} was cancelled by Admin.`);
            window.NotificationCenter.dispatch("sms", `Alert: Demo session for student ${booking.studentName} has been cancelled.`);
            
            this.refreshAllData();
            window.Toast.show("Cancelled", "Booking has been deactivated.", "warning");
        }
    }

    // Teachers directory manager
    static loadTeacherRosters() {
        const teachers = window.ChessDB.getTeachers();
        this.rosterGrid.innerHTML = "";

        teachers.forEach(t => {
            const card = document.createElement("div");
            card.className = "glass-card benefit-card interactive";
            card.style.textAlign = "left";
            card.style.padding = "24px";
            card.style.display = "flex";
            card.style.gap = "16px";

            // Generate slots indicators list
            const slotsText = t.slots.join(", ");

            card.innerHTML = `
                <img src="${t.avatar}" style="width:72px; height:72px; border-radius:50%; border:2px solid var(--primary); object-fit:cover;">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <h4 style="font-size:16px;">${t.name}</h4>
                        <span style="font-size:11px; color:#FBBF24;">★ ${t.rating}</span>
                    </div>
                    <p style="font-size:11px; color:var(--text-secondary); margin-bottom:8px;">${t.experience}</p>
                    
                    <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">
                        🗣️ <span style="color:var(--text-secondary);">${t.languages.join(", ")}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
                        ⏰ <span style="color:var(--text-secondary);">${slotsText}</span>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:10px;">
                        <span style="font-size:11px; color:var(--text-muted);">${t.activeStudents} active students</span>
                        <button type="button" class="btn btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="AdminController.toggleCoachLeave('${t.id}')">Toggle Leave</button>
                    </div>
                </div>
            `;
            this.rosterGrid.appendChild(card);
        });
    }

    static toggleCoachLeave(id) {
        const teachers = window.ChessDB.getTeachers();
        const teacher = teachers.find(t => t.id === id);
        if (!teacher) return;

        const dateToday = new Date().toISOString().split("T")[0];
        
        if (!teacher.leaves) teacher.leaves = [];
        
        const exists = teacher.leaves.includes(dateToday);
        if (exists) {
            teacher.leaves = teacher.leaves.filter(d => d !== dateToday);
            window.Toast.show("Status Updated", `Coach ${teacher.name} is now available today!`, "success");
        } else {
            teacher.leaves.push(dateToday);
            window.Toast.show("Status Updated", `Coach ${teacher.name} marked on leave today.`, "warning");
        }

        window.ChessDB.saveTeachers(teachers);
        this.loadTeacherRosters();
    }

    static saveNewTeacher() {
        const name = document.getElementById("addt-name").value;
        const exp = document.getElementById("addt-exp").value;
        const langs = document.getElementById("addt-langs").value.split(",").map(s => s.trim());
        const levels = document.getElementById("addt-exp-levels").value.split(",").map(s => s.trim());
        const slots = document.getElementById("addt-slots").value.split(",").map(s => s.trim());

        const teachers = window.ChessDB.getTeachers();
        const id = "t_" + name.toLowerCase().replace(/\s+/g, "_");

        const newCoach = {
            id,
            name,
            experience: exp,
            rating: 4.8,
            languages: langs,
            expertise: levels,
            slots: slots,
            maxDemosPerDay: 4,
            priorityScore: 80,
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
            activeStudents: 0,
            leaves: []
        };

        teachers.push(newCoach);
        window.ChessDB.saveTeachers(teachers);

        window.NotificationCenter.dispatch("system", `New coach profile registered for ${name}.`);

        this.closeModal(this.modalAddt);
        this.addtForm.reset();
        this.refreshAllData();
        window.Toast.show("Saved", "New Coach added to roster directory.", "success");
    }

    // CRM Kanban Board controller
    static loadCRMPipeline() {
        const bookings = window.ChessDB.getBookings();
        const leads = window.ChessDB.getCRMLeads();

        // Combine bookings and direct leads to model the CRM pipeline
        const allEntities = [
            ...bookings.map(b => ({ id: b.id, name: b.studentName, details: `${b.level} • ${b.city}`, email: b.email, crmStatus: b.crmStatus, isBooking: true })),
            ...leads.map(l => ({ id: l.id, name: l.name, details: `${l.level} • Inquire`, email: l.email, crmStatus: l.crmStatus, isBooking: false }))
        ];

        const columns = {
            "New lead": document.getElementById("col-new-lead"),
            "Demo booked": document.getElementById("col-demo-booked"),
            "Demo attended": document.getElementById("col-demo-attended"),
            "Follow up": document.getElementById("col-follow-up"),
            "Converted": document.getElementById("col-converted"),
            "Lost": document.getElementById("col-lost")
        };

        const badges = {
            "New lead": document.getElementById("badge-new-lead"),
            "Demo booked": document.getElementById("badge-demo-booked"),
            "Demo attended": document.getElementById("badge-demo-attended"),
            "Follow up": document.getElementById("badge-follow-up"),
            "Converted": document.getElementById("badge-converted"),
            "Lost": document.getElementById("badge-lost")
        };

        // Reset
        Object.values(columns).forEach(col => { if(col) col.innerHTML = ""; });
        
        // Count Map
        let countMap = { "New lead": 0, "Demo booked": 0, "Demo attended": 0, "Follow up": 0, "Converted": 0, "Lost": 0 };

        allEntities.forEach(ent => {
            const statusKey = ent.crmStatus ? ent.crmStatus.toLowerCase() : "new lead";
            const colView = columns[statusKey];
            
            if (colView) {
                countMap[statusKey]++;
                
                const card = document.createElement("div");
                card.className = "glass-card crm-card";
                
                // Create navigation actions click
                card.innerHTML = `
                    <h4>${ent.name}</h4>
                    <p>${ent.details}</p>
                    <p style="color:var(--text-muted); font-size:9px;">${ent.email}</p>
                    <div class="crm-card-actions">
                        <span style="cursor:pointer;" onclick="AdminController.shiftCRMStage('${ent.id}', '${statusKey}', 'prev', ${ent.isBooking})">◀</span>
                        <span style="font-size:9px; text-transform:uppercase; color:var(--text-muted);">${ent.isBooking ? "Booking" : "Lead"}</span>
                        <span style="cursor:pointer;" onclick="AdminController.shiftCRMStage('${ent.id}', '${statusKey}', 'next', ${ent.isBooking})">▶</span>
                    </div>
                `;
                colView.appendChild(card);
            }
        });

        // Set counts badges
        Object.keys(badges).forEach(k => {
            if (badges[k]) badges[k].innerText = countMap[k];
        });
    }

    static shiftCRMStage(id, currentStage, direction, isBooking) {
        const pipelineStages = ["New lead", "Demo booked", "Demo attended", "Follow up", "Converted", "Lost"];
        let idx = pipelineStages.indexOf(pipelineStages.find(s => s.toLowerCase() === currentStage.toLowerCase()));
        
        if (direction === "next") idx = Math.min(pipelineStages.length - 1, idx + 1);
        if (direction === "prev") idx = Math.max(0, idx - 1);

        const newStage = pipelineStages[idx];

        if (isBooking) {
            const bookings = window.ChessDB.getBookings();
            const booking = bookings.find(b => b.id === id);
            if (booking) {
                booking.crmStatus = newStage.toLowerCase();
                
                // Keep booking status synchronized
                if (newStage === "Lost") booking.status = "Cancelled";
                if (newStage === "Demo booked") booking.status = "Demo Booked";
                if (newStage === "Demo attended") booking.status = "Demo Attended";

                window.ChessDB.saveBookings(bookings);
            }
        } else {
            const leads = window.ChessDB.getCRMLeads();
            const lead = leads.find(l => l.id === id);
            if (lead) {
                lead.crmStatus = newStage;
                window.ChessDB.saveCRMLeads(leads);
            }
        }

        window.NotificationCenter.dispatch("system", `CRM Pipeline Shift: Lead ${id} moved to [${newStage}] stage.`);
        
        this.refreshAllData();
        window.Toast.show("Lead Moved", `Stage updated to ${newStage}.`, "success");
    }

    // Canvas charts metrics
    static renderReports() {
        const bookings = window.ChessDB.getBookings();
        
        // 1. Popular Slot statistics
        const slots = ["10:00 AM", "11:00 AM", "12:00 PM", "03:00 PM", "06:00 PM"];
        this.barChart.innerHTML = "";
        
        // find max booking count to scale
        let maxCount = 0;
        let counts = {};
        
        slots.forEach(s => {
            const count = bookings.filter(b => b.slot === s && b.status !== "Cancelled").length;
            counts[s] = count;
            if (count > maxCount) maxCount = count;
        });

        slots.forEach(s => {
            const count = counts[s];
            // scale height in %
            const scaleHeight = maxCount > 0 ? (count / maxCount) * 180 + 20 : 20;

            const barContainer = document.createElement("div");
            barContainer.style.display = "flex";
            barContainer.style.flexDirection = "column";
            barContainer.style.alignItems = "center";
            barContainer.style.flex = "1";
            barContainer.style.position = "relative";

            const bar = document.createElement("div");
            bar.className = "btn-primary";
            bar.style.width = "40px";
            bar.style.height = `${scaleHeight}px`;
            bar.style.borderRadius = "4px 4px 0 0";
            bar.style.position = "relative";
            bar.style.boxShadow = "var(--shadow-glow)";
            
            // hover count tooltip
            bar.innerHTML = `<span style="position:absolute; top:-24px; left:50%; transform:translateX(-50%); font-size:10px; font-weight:700; color:var(--text-primary);">${count}</span>`;

            barContainer.appendChild(bar);
            this.barChart.appendChild(barContainer);
        });

        // 2. Coach share horizontal allocation chart
        const teachers = window.ChessDB.getTeachers();
        this.horizChart.innerHTML = "";

        const totalActiveBookings = bookings.filter(b => b.status !== "Cancelled").length;

        teachers.forEach(t => {
            const allocatedCount = bookings.filter(b => b.teacherId === t.id && b.status !== "Cancelled").length;
            
            let percent = 0;
            if (totalActiveBookings > 0) {
                percent = Math.round((allocatedCount / totalActiveBookings) * 100);
            }

            const scaleRow = document.createElement("div");
            scaleRow.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span>${t.name}</span>
                    <span style="font-weight:600; color:var(--primary);">${allocatedCount} classes (${percent}%)</span>
                </div>
                <div style="width:100%; height:8px; background:rgba(255,255,255,0.04); border-radius:4px; overflow:hidden;">
                    <div style="width:${percent}%; height:100%; background:linear-gradient(to right, var(--primary), #C084FC); border-radius:4px;"></div>
                </div>
            `;
            this.horizChart.appendChild(scaleRow);
        });
    }

    static refreshAllData() {
        this.loadMetrics();
        this.loadActivityLogs();
        this.loadBookingsTable();
        this.loadTeacherRosters();
        this.loadCRMPipeline();
        this.renderReports();
    }
}

// Global Exports for inline DOM click events
window.AdminController = AdminController;
