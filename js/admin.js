// Chess Demo Booking - Admin Console Controller

document.addEventListener("DOMContentLoaded", () => {
    AdminController.init();
});

class AdminController {
    static init() {
        if (window.Auth) {
            window.Auth.protect('admin');
        }
        this.activeBookingId = null;
        this.editingTeacherId = null;
        this.cacheDOM();
        this.bindEvents();
        
        // Load default views
        this.loadMetrics();
        this.loadActivityLogs();
        this.loadBookingsTable();
        this.loadTeacherRosters();
        this.loadCRMPipeline();
        this.renderReports();
        this.loadDetailedReports();

        // Initialize tomorrow's date as default roster planner date
        if (this.rosterDateSelect) {
            const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            this.rosterDateSelect.value = tomorrowStr;
            this.loadRosterPlanner();
        }
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
        this.modalAdds = document.getElementById("modal-add-student");
        this.modalStudentDetails = document.getElementById("modal-student-details");
        this.modalTeacherDetails = document.getElementById("modal-teacher-details");

        // Close selectors
        this.closeResched = document.getElementById("modal-close-resched");
        this.closeReassign = document.getElementById("modal-close-reassign");
        this.closeAddt = document.getElementById("modal-close-addt");
        this.closeAdds = document.getElementById("modal-close-adds");
        this.closeStudentDetails = document.getElementById("modal-close-student-details");
        this.closeTeacherDetails = document.getElementById("modal-close-teacher-details");

        // Action Buttons
        this.btnSaveResched = document.getElementById("btn-save-resched");
        this.btnSaveReassign = document.getElementById("btn-save-reassign");
        this.btnAddtOpen = document.getElementById("btn-add-teacher");
        this.btnAddsOpen = document.getElementById("btn-add-student");
        this.addtForm = document.getElementById("add-teacher-form");
        this.addsForm = document.getElementById("add-student-form");
        this.btnGenPassTeacher = document.getElementById("btn-gen-pass-teacher");
        this.btnGenPassStudent = document.getElementById("btn-gen-pass-student");
        this.addsTeacherSelect = document.getElementById("adds-teacher");

        // Modal inputs
        this.reschedDate = document.getElementById("resched-date-input");
        this.reschedSlot = document.getElementById("resched-slot-input");
        this.reassignSelect = document.getElementById("reassign-teacher-select");

        // Roster Grid & Planner
        this.rosterGrid = document.getElementById("teachers-roster-grid");
        this.rosterDateSelect = document.getElementById("roster-date-select");
        this.btnLoadRosterDefaults = document.getElementById("btn-load-roster-defaults");
        this.btnSendRosterBriefing = document.getElementById("btn-send-roster-briefing");
        this.btnSaveRoster = document.getElementById("btn-save-roster");
        this.rosterPlannerContainer = document.getElementById("roster-planner-container");
        
        // Student Details content container
        this.studentDetailsContent = document.getElementById("student-details-content");

        // Reports
        this.barChart = document.getElementById("reports-bar-chart");
        this.horizChart = document.getElementById("reports-horizontal-chart");

        // Detailed Reports
        this.detailedReportsTableBody = document.getElementById("detailed-reports-table-body");
        this.reportFilterSearch = document.getElementById("report-filter-search");
        this.reportFilterStatus = document.getElementById("report-filter-status");
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
        if (this.bookingSearch) this.bookingSearch.addEventListener("input", () => this.loadBookingsTable());

        // Reports Filter action
        if (this.reportFilterSearch) this.reportFilterSearch.addEventListener("input", () => this.loadDetailedReports());
        if (this.reportFilterStatus) this.reportFilterStatus.addEventListener("change", () => this.loadDetailedReports());

        // Modal closures
        this.closeResched.addEventListener("click", () => this.closeModal(this.modalResched));
        this.closeReassign.addEventListener("click", () => this.closeModal(this.modalReassign));
        this.closeAddt.addEventListener("click", () => this.closeModal(this.modalAddt));
        if (this.closeAdds) {
            this.closeAdds.addEventListener("click", () => this.closeModal(this.modalAdds));
        }
        if (this.closeStudentDetails) {
            this.closeStudentDetails.addEventListener("click", () => this.closeModal(this.modalStudentDetails));
        }
        if (this.closeTeacherDetails) {
            this.closeTeacherDetails.addEventListener("click", () => this.closeModal(this.modalTeacherDetails));
        }

        // Save reschedule action
        this.btnSaveResched.addEventListener("click", () => this.saveReschedule());

        // Save reassignment action
        this.btnSaveReassign.addEventListener("click", () => this.saveReassignment());

        // Add Coach triggers
        this.btnAddtOpen.addEventListener("click", () => {
            this.editingTeacherId = null;
            this.addtForm.reset();
            const modalTitle = this.modalAddt.querySelector('.modal-header h3');
            if (modalTitle) {
                modalTitle.innerText = "Add New Chess Coach";
            }
            const avatarInput = document.getElementById("addt-avatar");
            if (avatarInput) {
                avatarInput.required = true;
            }
            
            // Reset custom dropdown state
            const allAddtCheckboxes = document.querySelectorAll('input[name="addt-slot-checkbox"]');
            allAddtCheckboxes.forEach(cb => {
                cb.checked = false;
                const parent = cb.closest(".dropdown-slot-item");
                if (parent) {
                    parent.classList.remove("checked");
                }
            });
            const selectedTextVal = document.getElementById("addt-slots-selected-text");
            if (selectedTextVal) {
                selectedTextVal.innerText = "Select Available Slots";
            }

            this.openModal(this.modalAddt);
        });
        this.addtForm.addEventListener("submit", (e) => {
            e.preventDefault();
            this.saveNewTeacher();
        });

        // Add Student triggers
        if (this.btnAddsOpen) {
            this.btnAddsOpen.addEventListener("click", () => this.openAddStudentModal());
        }
        if (this.addsForm) {
            this.addsForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.saveNewStudent();
            });
        }
        if (this.btnGenPassTeacher) {
            this.btnGenPassTeacher.addEventListener("click", () => {
                const pass = this.generateRandomPassword();
                document.getElementById("addt-password").value = pass;
                window.Toast.show("Generated", `Coach password generated: ${pass}`, "success");
            });
        }
        if (this.btnGenPassStudent) {
            this.btnGenPassStudent.addEventListener("click", () => {
                const pass = this.generateRandomPassword();
                document.getElementById("adds-password").value = pass;
                window.Toast.show("Generated", `Student password generated: ${pass}`, "success");
            });
        }

        // Roster Planner triggers
        if (this.rosterDateSelect) {
            this.rosterDateSelect.addEventListener("change", () => this.loadRosterPlanner());
        }
        if (this.btnSaveRoster) {
            this.btnSaveRoster.addEventListener("click", () => this.saveRoster());
        }
        if (this.btnLoadRosterDefaults) {
            this.btnLoadRosterDefaults.addEventListener("click", () => this.loadRosterDefaults());
        }
        if (this.btnSendRosterBriefing) {
            this.btnSendRosterBriefing.addEventListener("click", () => this.sendDailyBriefings());
        }

        // Custom dropdown toggle
        const dropdownBtn = document.getElementById("addt-slots-dropdown-btn");
        const dropdownContent = document.getElementById("addt-slots-dropdown-content");
        const selectedText = document.getElementById("addt-slots-selected-text");
        const chevron = dropdownBtn ? dropdownBtn.querySelector("i") : null;

        if (dropdownBtn && dropdownContent) {
            dropdownBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = dropdownContent.style.display === "block";
                dropdownContent.style.display = isOpen ? "none" : "block";
                if (chevron) {
                    chevron.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
                }
            });

            document.addEventListener("click", (e) => {
                if (!e.target.closest("#addt-slots-dropdown")) {
                    dropdownContent.style.display = "none";
                    if (chevron) {
                        chevron.style.transform = "rotate(0deg)";
                    }
                }
            });
        }

        // Custom checkboxes update inside dropdown
        const addtCheckboxes = document.querySelectorAll('input[name="addt-slot-checkbox"]');
        const updateDropdownText = () => {
            const checkedCount = document.querySelectorAll('input[name="addt-slot-checkbox"]:checked').length;
            if (selectedText) {
                if (checkedCount === 0) {
                    selectedText.innerText = "Select Available Slots";
                } else if (checkedCount === 1) {
                    selectedText.innerText = "1 Slot Selected";
                } else {
                    selectedText.innerText = `${checkedCount} Slots Selected`;
                }
            }
        };

        addtCheckboxes.forEach(cb => {
            cb.addEventListener("change", () => {
                const parent = cb.closest(".dropdown-slot-item");
                if (parent) {
                    if (cb.checked) {
                        parent.classList.add("checked");
                    } else {
                        parent.classList.remove("checked");
                    }
                }
                updateDropdownText();
            });
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
        if (!this.activityLogBody) return;
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
                        <button class="action-icon-btn" title="View Student Details" onclick="AdminController.viewStudentDetails('${b.id}')">🔍</button>
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
            window.NotificationCenter.triggerStudentConfirmation(booking.studentName, booking.parentName, date, slot, booking.teacherName, "email");

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
        if (!confirm("Are you sure you want to completely delete this scheduled demo booking?")) return;

        let bookings = window.ChessDB.getBookings();
        const booking = bookings.find(b => b.id === id);
        if (booking) {
            bookings = bookings.filter(b => b.id !== id);
            window.ChessDB.saveBookings(bookings);

            window.NotificationCenter.dispatch("system", `Demo booking for student ${booking.studentName} was deleted by Admin.`);
            
            this.refreshAllData();
            window.Toast.show("Deleted", "Booking has been removed completely.", "warning");
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

            const phoneBtnTitle = t.phoneAccessApproved ? "Revoke Phone Access" : "Approve Phone Access";
            const phoneBtnIcon = t.phoneAccessApproved ? "🔓" : "🔒";
            const phoneBtnBg = t.phoneAccessApproved ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.1)";
            const phoneBtnColor = t.phoneAccessApproved ? "#10b981" : "inherit";

            card.innerHTML = `
                <img src="${t.avatar}" style="width:72px; height:72px; border-radius:50%; border:2px solid var(--primary); object-fit:cover; cursor:pointer;" onclick="AdminController.viewTeacherDetails('${t.id}')">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <h4 style="font-size:16px; cursor:pointer; color:var(--primary);" onclick="AdminController.viewTeacherDetails('${t.id}')">${t.name}</h4>
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
                        <div style="display:flex; gap:6px;">
                            <button type="button" class="btn btn-secondary" style="padding:4px 8px; font-size:10px; background:${phoneBtnBg}; border-color:transparent; color:${phoneBtnColor};" title="${phoneBtnTitle}" onclick="AdminController.toggleTeacherPhoneAccess('${t.id}')">${phoneBtnIcon} Phone</button>
                            <button type="button" class="btn btn-secondary" style="padding:4px 8px; font-size:10px; background:rgba(255,255,255,0.1); border-color:transparent;" title="Edit Coach" onclick="AdminController.editTeacher('${t.id}')">✏️ Edit</button>
                            <button type="button" class="btn btn-secondary" style="padding:4px 8px; font-size:10px; background:rgba(245,158,11,0.1); border-color:transparent; color:#f59e0b;" title="Reset Password" onclick="AdminController.resetTeacherPassword('${t.id}')">🔑 Pass</button>
                            <button type="button" class="btn btn-secondary" style="padding:4px 8px; font-size:10px; background:rgba(239,68,68,0.1); border-color:transparent; color:#ef4444;" title="Delete Coach" onclick="AdminController.deleteTeacher('${t.id}')">🗑️ Del</button>
                            <button type="button" class="btn btn-primary" style="padding:4px 8px; font-size:10px;" onclick="AdminController.viewTeacherDetails('${t.id}')">🔍 View</button>
                        </div>
                    </div>
                </div>
            `;
            this.rosterGrid.appendChild(card);
        });
    }

    static toggleTeacherPhoneAccess(teacherId) {
        let teachers = window.ChessDB.getTeachers();
        let teacher = teachers.find(t => t.id === teacherId);
        if (teacher) {
            teacher.phoneAccessApproved = !teacher.phoneAccessApproved;
            window.ChessDB.saveTeachers(teachers);
            this.loadTeacherRosters();
            window.Toast.show("Access Updated", `Phone access ${teacher.phoneAccessApproved ? 'granted' : 'revoked'} for ${teacher.name}.`, "success");
        }
    }

    static viewTeacherDetails(teacherId) {
        const teachers = window.ChessDB.getTeachers();
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) return;

        const bookings = window.ChessDB.getBookings();
        const tBookings = bookings.filter(b => b.teacherId === teacherId);
        
        let totalTaken = 0, pending = 0, notJoined = 0, rescheduled = 0;
        
        const candidatesHtml = tBookings.map(b => {
            let statusColor = "var(--text-secondary)";
            let isPending = b.status === "Demo Booked" && new Date(b.date) >= new Date(new Date().toISOString().split('T')[0]);
            
            if (b.status === "Demo Attended") {
                totalTaken++;
                statusColor = "#10b981"; // green
            } else if (b.status === "Rescheduled") {
                rescheduled++;
                statusColor = "#f59e0b"; // yellow
            } else if (b.status === "Cancelled" || b.status === "No Show" || b.crmStatus === "Lost") {
                notJoined++;
                statusColor = "#ef4444"; // red
            } else if (isPending) {
                pending++;
                statusColor = "#3b82f6"; // blue
            } else {
                statusColor = "var(--text-secondary)";
            }

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px;">
                    <div>
                        <div style="font-weight:600; color:var(--primary); font-size:13px; cursor:pointer; text-decoration:underline;" onclick="AdminController.viewStudentDetails('${b.id}')">${b.studentName}</div>
                        <div style="font-size:11px; color:var(--text-muted);">${b.date} • ${b.slot}</div>
                    </div>
                    <span style="font-size:11px; padding:4px 8px; border-radius:4px; background:${statusColor}20; color:${statusColor}; border:1px solid ${statusColor}40;">${b.status}</span>
                </div>
            `;
        }).join("");

        const content = `
            <div style="display:flex; align-items:center; gap:16px; border-bottom:1px solid var(--border-color); padding-bottom:16px; margin-bottom:16px;">
                <img src="${teacher.avatar}" style="width:64px; height:64px; border-radius:50%; border:2px solid var(--primary); object-fit:cover;">
                <div>
                    <h3 style="margin:0; font-size:18px;">${teacher.name}</h3>
                    <p style="margin:4px 0 0; font-size:12px; color:var(--text-secondary);">${teacher.experience}</p>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-bottom:20px;">
                <div style="background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.2); padding:12px; border-radius:8px; text-align:center;">
                    <div style="font-size:24px; font-weight:700; color:#10b981;">${totalTaken}</div>
                    <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase;">Taken</div>
                </div>
                <div style="background:rgba(59, 130, 246, 0.1); border:1px solid rgba(59, 130, 246, 0.2); padding:12px; border-radius:8px; text-align:center;">
                    <div style="font-size:24px; font-weight:700; color:#3b82f6;">${pending}</div>
                    <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase;">Pending</div>
                </div>
                <div style="background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.2); padding:12px; border-radius:8px; text-align:center;">
                    <div style="font-size:24px; font-weight:700; color:#ef4444;">${notJoined}</div>
                    <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase;">Not Joined</div>
                </div>
                <div style="background:rgba(245, 158, 11, 0.1); border:1px solid rgba(245, 158, 11, 0.2); padding:12px; border-radius:8px; text-align:center;">
                    <div style="font-size:24px; font-weight:700; color:#f59e0b;">${rescheduled}</div>
                    <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase;">Resched</div>
                </div>
            </div>

            <h4 style="font-size:14px; margin-bottom:12px;">Candidate Demo History</h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${candidatesHtml || `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">No demos found for this coach.</div>`}
            </div>
        `;

        const detailsContentContainer = document.getElementById("teacher-details-content");
        if(detailsContentContainer) {
            detailsContentContainer.innerHTML = content;
        }
        
        const modal = document.getElementById("modal-teacher-details");
        if(modal) {
            this.openModal(modal);
        }
    }

    static editTeacher(teacherId) {
        const teachers = window.ChessDB.getTeachers();
        const coach = teachers.find(t => t.id === teacherId);
        if (!coach) {
            window.Toast.show("Error", "Coach profile not found.", "danger");
            return;
        }

        this.editingTeacherId = teacherId;

        // Update modal title
        const modalTitle = this.modalAddt.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.innerText = "Edit Chess Coach Profile";
        }

        // Photo upload is optional during editing
        const avatarInput = document.getElementById("addt-avatar");
        if (avatarInput) {
            avatarInput.required = false;
            avatarInput.value = ""; // Clear file input
        }

        // Pre-fill text and select fields
        document.getElementById("addt-name").value = coach.name || "";
        document.getElementById("addt-email").value = coach.email || "";
        document.getElementById("addt-password").value = coach.password || "";
        document.getElementById("addt-phone").value = coach.phone || "";
        document.getElementById("addt-exp").value = coach.experience || "";
        document.getElementById("addt-langs").value = Array.isArray(coach.languages) ? coach.languages.join(", ") : "";
        document.getElementById("addt-exp-levels").value = Array.isArray(coach.expertise) ? coach.expertise.join(", ") : "";

        // Pre-fill slots checkboxes
        const allAddtCheckboxes = document.querySelectorAll('input[name="addt-slot-checkbox"]');
        let checkedCount = 0;
        allAddtCheckboxes.forEach(cb => {
            const isChecked = Array.isArray(coach.slots) && coach.slots.includes(cb.value);
            cb.checked = isChecked;
            const parent = cb.closest(".dropdown-slot-item");
            if (parent) {
                if (isChecked) {
                    parent.classList.add("checked");
                    checkedCount++;
                } else {
                    parent.classList.remove("checked");
                }
            }
        });

        // Update dropdown text display
        const selectedText = document.getElementById("addt-slots-selected-text");
        if (selectedText) {
            if (checkedCount === 0) {
                selectedText.innerText = "Select Available Slots";
            } else if (checkedCount === 1) {
                selectedText.innerText = "1 Slot Selected";
            } else {
                selectedText.innerText = `${checkedCount} Slots Selected`;
            }
        }

        // Open modal
        this.openModal(this.modalAddt);
    }

    static deleteTeacher(teacherId) {
        if(confirm("Are you sure you want to remove this coach?")) {
            let teachers = window.ChessDB.getTeachers();
            teachers = teachers.filter(t => t.id !== teacherId);
            window.ChessDB.saveTeachers(teachers);
            this.loadTeacherRosters();
            window.Toast.show("Deleted", "Coach profile has been removed.", "danger");
        }
    }

    static resetTeacherPassword(teacherId) {
        const teachers = window.ChessDB.getTeachers();
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) {
            window.Toast.show("Error", "Coach profile not found.", "danger");
            return;
        }

        const defaultPass = this.generateRandomPassword();
        const newPassword = prompt(`Enter a new password for Coach ${teacher.name}:`, defaultPass);
        if (newPassword === null) return; // user cancelled

        const trimmed = newPassword.trim();
        if (trimmed === "") {
            window.Toast.show("Error", "Password cannot be empty.", "danger");
            return;
        }

        teacher.password = trimmed;
        window.ChessDB.saveTeachers(teachers);

        // System notification
        window.NotificationCenter.dispatch("system", `Admin reset password for Coach ${teacher.name} to [${trimmed}].`);
        // Notify coach via email simulation
        window.NotificationCenter.dispatch("email", `Hi Coach ${teacher.name}, your account password has been reset by the Admin. Your new password is: ${trimmed}. Portal Dashboard: teacher.html.`);

        this.loadTeacherRosters();
        window.Toast.show("Password Reset", `Password updated successfully for ${teacher.name}!`, "success");
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
        const fileInput = document.getElementById("addt-avatar");
        const file = fileInput.files[0];

        const isEditing = !!this.editingTeacherId;

        if (!file && !isEditing) {
            window.Toast.show("Validation Failed", "Please upload a coach photo.", "danger");
            return;
        }

        const saveProcedure = (avatarBase64) => {
            const name = document.getElementById("addt-name").value;
            const email = document.getElementById("addt-email").value;
            const password = document.getElementById("addt-password").value.trim();
            const phone = document.getElementById("addt-phone").value;
            const exp = document.getElementById("addt-exp").value;
            const langs = document.getElementById("addt-langs").value.split(",").map(s => s.trim());
            const levels = document.getElementById("addt-exp-levels").value.split(",").map(s => s.trim());
            
            // Fetch selected slots from checkboxes
            const checkboxes = document.querySelectorAll('input[name="addt-slot-checkbox"]:checked');
            const slots = Array.from(checkboxes).map(cb => cb.value);

            if (slots.length === 0) {
                window.Toast.show("Validation Failed", "Please select at least one available slot.", "danger");
                return;
            }

            const teachers = window.ChessDB.getTeachers();

            if (isEditing) {
                const coachIndex = teachers.findIndex(t => t.id === this.editingTeacherId);
                if (coachIndex !== -1) {
                    const existingCoach = teachers[coachIndex];
                    existingCoach.name = name;
                    existingCoach.email = email;
                    existingCoach.phone = phone;
                    existingCoach.password = password;
                    existingCoach.experience = exp;
                    existingCoach.languages = langs;
                    existingCoach.expertise = levels;
                    existingCoach.slots = slots;
                    if (avatarBase64) {
                        existingCoach.avatar = avatarBase64;
                    }
                    window.ChessDB.saveTeachers(teachers);

                    window.NotificationCenter.dispatch("system", `Coach profile updated for ${name}.`);
                    window.Toast.show("Saved", "Coach profile updated successfully.", "success");
                }
            } else {
                const id = "t_" + name.toLowerCase().replace(/\s+/g, "_");

                const newCoach = {
                    id,
                    name,
                    email,
                    phone,
                    password, // Designated password from admin panel
                    experience: exp,
                    rating: 4.8,
                    languages: langs,
                    expertise: levels,
                    slots: slots,
                    maxDemosPerDay: 4,
                    priorityScore: 80,
                    avatar: avatarBase64 || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120",
                    activeStudents: 0,
                    leaves: [],
                    phoneAccessApproved: false
                };

                teachers.push(newCoach);
                window.ChessDB.saveTeachers(teachers);

                window.NotificationCenter.dispatch("system", `New coach profile registered for ${name}.`);
                // Dispatch credentials email
                window.NotificationCenter.dispatch("email", `Hi Coach ${name}, welcome to Parash Chess Academy! An account has been created for you. Login ID (Email): ${email}, Password: ${password}. Portal Dashboard: teacher.html.`);
                window.Toast.show("Saved", "New Coach added to roster directory.", "success");
            }

            this.closeModal(this.modalAddt);
            this.addtForm.reset();

            // Reset modal title and file field requirements
            const modalTitle = this.modalAddt.querySelector('.modal-header h3');
            if (modalTitle) {
                modalTitle.innerText = "Add New Chess Coach";
            }
            const avatarInput = document.getElementById("addt-avatar");
            if (avatarInput) {
                avatarInput.required = true;
            }
            this.editingTeacherId = null;

            // Reset custom dropdown state
            const allAddtCheckboxes = document.querySelectorAll('input[name="addt-slot-checkbox"]');
            allAddtCheckboxes.forEach(cb => {
                const parent = cb.closest(".dropdown-slot-item");
                if (parent) {
                    parent.classList.remove("checked");
                }
            });
            const selectedTextVal = document.getElementById("addt-slots-selected-text");
            if (selectedTextVal) {
                selectedTextVal.innerText = "Select Available Slots";
            }

            this.refreshAllData();
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => saveProcedure(e.target.result);
            reader.readAsDataURL(file);
        } else {
            saveProcedure(null);
        }
    }

    static openAddStudentModal() {
        if (this.addsForm) {
            this.addsForm.reset();
        }
        const todayStr = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById("adds-date");
        if (dateInput) {
            dateInput.value = todayStr;
        }
        
        // Populate teachers dropdown
        if (this.addsTeacherSelect) {
            const teachers = window.ChessDB.getTeachers() || [];
            this.addsTeacherSelect.innerHTML = teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
        }

        this.openModal(this.modalAdds);
    }

    static generateRandomPassword() {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let pass = "";
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    }

    static saveNewStudent() {
        const name = document.getElementById("adds-name").value.trim();
        const parentName = document.getElementById("adds-parent").value.trim();
        const email = document.getElementById("adds-email").value.trim();
        const phone = document.getElementById("adds-phone").value.trim();
        const age = parseInt(document.getElementById("adds-age").value.trim());
        const grade = document.getElementById("adds-grade").value.trim();
        const level = document.getElementById("adds-level").value;
        const language = document.getElementById("adds-language").value;
        const timezone = document.getElementById("adds-timezone").value;
        const city = document.getElementById("adds-city").value.trim();
        const country = document.getElementById("adds-country").value.trim();
        const date = document.getElementById("adds-date").value;
        const slot = document.getElementById("adds-slot").value;
        const password = document.getElementById("adds-password").value.trim();
        const teacherId = this.addsTeacherSelect.value;
        
        if (!name || !parentName || !email || !phone || !age || !city || !country || !date || !slot || !password || !teacherId) {
            window.Toast.show("Validation Failed", "Please fill in all required fields.", "danger");
            return;
        }

        const teachers = window.ChessDB.getTeachers() || [];
        const selectedTeacher = teachers.find(t => t.id === teacherId);
        const teacherName = selectedTeacher ? selectedTeacher.name : "Unassigned";

        const bookings = window.ChessDB.getBookings() || [];
        const newId = "b_" + Date.now();
        const meetingLink = "https://meet.google.com/chess-demo-" + Math.random().toString(36).substring(7);

        const newBooking = {
            id: newId,
            studentName: name,
            parentName: parentName,
            age: age,
            grade: grade || "",
            level: level,
            mobile: phone,
            email: email,
            city: city,
            country: country,
            date: date,
            slot: slot,
            timezone: timezone,
            language: language,
            teacherId: teacherId,
            teacherName: teacherName,
            status: "Demo Booked",
            paymentStatus: "Free",
            paymentAmount: 0,
            meetingLink: meetingLink,
            notes: "Manually registered by Admin.",
            crmStatus: "Demo booked",
            password: password
        };

        bookings.push(newBooking);
        window.ChessDB.saveBookings(bookings);

        // Notify System
        window.NotificationCenter.dispatch("system", `New student ${name} registered manually by Admin.`);
        
        // Notify student of password and login
        window.NotificationCenter.dispatch("email", `Hi ${name}, welcome to Parash Chess Academy! Your trial class has been scheduled with Coach ${teacherName} on ${date} at ${slot} (${timezone}). Your account has been created. Login ID: ${email}, Password: ${password}. Portal: student.html`);

        // Close modal and reset form
        this.closeModal(this.modalAdds);
        if (this.addsForm) {
            this.addsForm.reset();
        }

        // Refresh database tables and grids
        this.refreshAllData();
        window.Toast.show("Saved", "New Student registered and trial booking scheduled.", "success");
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
            "new lead": document.getElementById("col-new-lead"),
            "demo booked": document.getElementById("col-demo-booked"),
            "demo attended": document.getElementById("col-demo-attended"),
            "follow up": document.getElementById("col-follow-up"),
            "converted": document.getElementById("col-converted"),
            "lost": document.getElementById("col-lost")
        };

        const badges = {
            "new lead": document.getElementById("badge-new-lead"),
            "demo booked": document.getElementById("badge-demo-booked"),
            "demo attended": document.getElementById("badge-demo-attended"),
            "follow up": document.getElementById("badge-follow-up"),
            "converted": document.getElementById("badge-converted"),
            "lost": document.getElementById("badge-lost")
        };

        // Reset
        Object.values(columns).forEach(col => { if(col) col.innerHTML = ""; });
        
        // Count Map
        let countMap = { "new lead": 0, "demo booked": 0, "demo attended": 0, "follow up": 0, "converted": 0, "lost": 0 };

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
        const slots = [
            "10:00 AM",
            "11:00 AM",
            "12:00 PM",
            "01:00 PM",
            "02:00 PM",
            "03:00 PM",
            "04:00 PM",
            "05:00 PM",
            "06:00 PM",
            "07:00 PM",
            "08:00 PM",
            "09:00 PM"
        ];
        this.barChart.innerHTML = "";
        this.barChart.style.gap = "8px";
        
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
            const scaleHeight = maxCount > 0 ? (count / maxCount) * 160 + 20 : 20;

            const barContainer = document.createElement("div");
            barContainer.style.display = "flex";
            barContainer.style.flexDirection = "column";
            barContainer.style.alignItems = "center";
            barContainer.style.flex = "1";
            barContainer.style.position = "relative";

            const bar = document.createElement("div");
            bar.className = "btn-primary";
            bar.style.width = "20px";
            bar.style.height = `${scaleHeight}px`;
            bar.style.borderRadius = "4px 4px 0 0";
            bar.style.position = "relative";
            bar.style.boxShadow = "var(--shadow-glow)";
            
            // hover count tooltip
            bar.innerHTML = `<span style="position:absolute; top:-24px; left:50%; transform:translateX(-50%); font-size:10px; font-weight:700; color:var(--text-primary);">${count}</span>`;

            barContainer.appendChild(bar);

            // add label under bar
            const barLabel = document.createElement("span");
            barLabel.style.fontSize = "9px";
            barLabel.style.color = "var(--text-muted)";
            barLabel.style.marginTop = "8px";
            barLabel.style.whiteSpace = "nowrap";
            barLabel.innerText = s;
            barContainer.appendChild(barLabel);

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
        this.loadDetailedReports();
    }

    // --- DAILY ROSTER & STUDENT DETAILS EXTENSIONS ---

    static loadRosterPlanner() {
        if (!this.rosterPlannerContainer || !this.rosterDateSelect) return;
        const date = this.rosterDateSelect.value;
        if (!date) return;

        const teachers = window.ChessDB.getTeachers();
        const dailyRoster = window.ChessDB.getDailyRosterForDate(date);

        this.rosterPlannerContainer.innerHTML = "";

        teachers.forEach(t => {
            const rosteredSlots = dailyRoster[t.id] || [];

            const card = document.createElement("div");
            card.className = "glass-card";
            card.style.padding = "24px";
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.gap = "16px";
            card.style.border = "1px solid var(--border-color)";
            card.style.borderRadius = "16px";
            card.style.background = "var(--card-bg)";

            // Top Header row (Coach info)
            const headerRow = document.createElement("div");
            headerRow.style.display = "flex";
            headerRow.style.alignItems = "center";
            headerRow.style.justifyContent = "space-between";
            headerRow.style.width = "100%";

            const coachMeta = document.createElement("div");
            coachMeta.style.display = "flex";
            coachMeta.style.alignItems = "center";
            coachMeta.style.gap = "16px";
            coachMeta.innerHTML = `
                <img src="${t.avatar}" style="width:52px; height:52px; border-radius:50%; border:2px solid var(--primary); object-fit:cover; box-shadow:0 0 12px rgba(139, 92, 246, 0.2);">
                <div>
                    <h4 style="font-size:16px; margin:0; color:var(--text-primary); font-weight:700;">${t.name}</h4>
                    <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0;">${t.experience}</p>
                </div>
            `;
            headerRow.appendChild(coachMeta);

            const coachExpertise = document.createElement("span");
            coachExpertise.className = "badge badge-success";
            coachExpertise.style.fontSize = "11px";
            coachExpertise.style.padding = "4px 10px";
            coachExpertise.innerText = t.expertise.join(", ");
            headerRow.appendChild(coachExpertise);

            card.appendChild(headerRow);

            // Time slots row
            const slotsContainer = document.createElement("div");
            slotsContainer.style.display = "flex";
            slotsContainer.style.gap = "10px";
            slotsContainer.style.flexWrap = "wrap";
            slotsContainer.style.width = "100%";

            // Static slots available for this teacher
            const allSlots = t.slots || [
                "10:00 AM",
                "11:00 AM",
                "12:00 PM",
                "01:00 PM",
                "02:00 PM",
                "03:00 PM",
                "04:00 PM",
                "05:00 PM",
                "06:00 PM",
                "07:00 PM",
                "08:00 PM",
                "09:00 PM"
            ];
            allSlots.forEach(slot => {
                const isChecked = rosteredSlots.includes(slot);
                
                const label = document.createElement("label");
                label.style.display = "flex";
                label.style.alignItems = "center";
                label.style.gap = "8px";
                label.style.padding = "8px 16px";
                label.style.borderRadius = "20px";
                label.style.border = isChecked ? "1px solid var(--primary)" : "1px solid rgba(255, 255, 255, 0.05)";
                label.style.background = isChecked ? "rgba(139, 92, 246, 0.12)" : "rgba(255, 255, 255, 0.02)";
                label.style.color = isChecked ? "var(--text-primary)" : "var(--text-secondary)";
                label.style.fontSize = "12px";
                label.style.fontWeight = "600";
                label.style.cursor = "pointer";
                label.style.transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";
                label.style.boxShadow = isChecked ? "0 2px 10px rgba(139, 92, 246, 0.1)" : "none";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.name = `roster-${t.id}`;
                checkbox.value = slot;
                checkbox.checked = isChecked;
                checkbox.style.cursor = "pointer";
                checkbox.style.accentColor = "var(--primary)";

                checkbox.addEventListener("change", () => {
                    if (checkbox.checked) {
                        label.style.border = "1px solid var(--primary)";
                        label.style.background = "rgba(139, 92, 246, 0.12)";
                        label.style.color = "var(--text-primary)";
                        label.style.boxShadow = "0 2px 10px rgba(139, 92, 246, 0.1)";
                    } else {
                        label.style.border = "1px solid rgba(255, 255, 255, 0.05)";
                        label.style.background = "rgba(255, 255, 255, 0.02)";
                        label.style.color = "var(--text-secondary)";
                        label.style.boxShadow = "none";
                    }
                });

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(slot));
                slotsContainer.appendChild(label);
            });

            card.appendChild(slotsContainer);
            this.rosterPlannerContainer.appendChild(card);
        });
    }

    static saveRoster() {
        if (!this.rosterDateSelect) return;
        const date = this.rosterDateSelect.value;
        if (!date) {
            window.Toast.show("Error", "Please select a date first.", "danger");
            return;
        }

        const roster = window.ChessDB.getRoster();
        const teachers = window.ChessDB.getTeachers();
        const dailyData = {};

        teachers.forEach(t => {
            const checkboxes = document.querySelectorAll(`input[name="roster-${t.id}"]:checked`);
            const slots = Array.from(checkboxes).map(cb => cb.value);
            dailyData[t.id] = slots;
        });

        roster[date] = dailyData;
        window.ChessDB.saveRoster(roster);

        window.NotificationCenter.dispatch("system", `Admin updated daily roster availability details for ${date}.`);
        window.Toast.show("Roster Saved", `Daily roster saved successfully for ${date}!`, "success");
    }

    static loadRosterDefaults() {
        if (!this.rosterDateSelect) return;
        const date = this.rosterDateSelect.value;
        if (!date) return;

        if (!confirm(`Are you sure you want to reset roster to coach profile defaults for ${date}?`)) return;

        const roster = window.ChessDB.getRoster();
        
        // Remove manual roster overrides so getDailyRosterForDate falls back to static default slots
        if (roster[date]) {
            delete roster[date];
            window.ChessDB.saveRoster(roster);
        }

        this.loadRosterPlanner();
        window.NotificationCenter.dispatch("system", `Roster overrides reset to default slots template for date ${date}.`);
        window.Toast.show("Reset Completed", "Roster restored to default coach availability slots.", "success");
    }

    static sendDailyBriefings() {
        if (!this.rosterDateSelect) return;
        const date = this.rosterDateSelect.value;
        if (!date) {
            window.Toast.show("Error", "Please select a valid date.", "danger");
            return;
        }

        const bookings = window.ChessDB.getBookings().filter(b => b.date === date && b.status !== "Cancelled");
        const teachers = window.ChessDB.getTeachers();

        let emailsSent = 0;

        teachers.forEach(t => {
            const coachBookings = bookings.filter(b => b.teacherId === t.id);
            const roster = window.ChessDB.getDailyRosterForDate(date);
            const rosteredSlots = roster[t.id] || [];

            // Only email if they are rostered for at least one slot
            if (rosteredSlots.length === 0) return;

            let mailMessage = "";
            if (coachBookings.length > 0) {
                mailMessage = `Dear Coach ${t.name}, here is your chess demo booking schedule for tomorrow (${date}):\n\n`;
                coachBookings.sort((a, b) => a.slot.localeCompare(b.slot)).forEach((cb, idx) => {
                    mailMessage += `${idx + 1}. [${cb.slot}] Student: ${cb.studentName} (Grade: ${cb.grade || cb.age}) - Level: ${cb.level}\n`;
                    mailMessage += `   Meeting link: ${cb.meetingLink}\n`;
                    if (cb.notes) mailMessage += `   Notes: ${cb.notes}\n`;
                    mailMessage += `\n`;
                });
                mailMessage += `Please check your teacher portal for full student briefing cards and diagnostic documents. Best of luck!`;
            } else {
                mailMessage = `Dear Coach ${t.name}, you are rostered for slot shifts on tomorrow (${date}) but currently have no demo class bookings scheduled.\n\nKeep an eye on active WhatsApp notifications for any late-scheduled demo trials. Have a great day!`;
            }

            window.NotificationCenter.dispatch("email", mailMessage);
            emailsSent++;
        });

        window.Toast.show("Simulated Dispatch", `Sent daily briefing emails to ${emailsSent} rostered coaches!`, "success");
    }

    static viewStudentDetails(id) {
        const bookings = window.ChessDB.getBookings();
        const booking = bookings.find(b => b.id === id);
        if (!booking) {
            window.Toast.show("Error", "Booking details not found.", "danger");
            return;
        }

        const teachers = window.ChessDB.getTeachers();
        const teacher = teachers.find(t => t.id === booking.teacherId);
        const coachName = teacher ? teacher.name : booking.teacherName;
        const coachAvatar = teacher ? teacher.avatar : "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120";

        // Construct HTML content
        let detailsHtml = `
            <!-- Top Summary Header Card -->
            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(192, 132, 252, 0.05) 100%); padding: 20px; border-radius: 12px; border: 1px solid var(--primary-glow); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
                <div>
                    <h2 style="margin:0; font-size:20px; font-weight:800; color:var(--text-primary);">${booking.studentName}</h2>
                    <p style="margin:4px 0 0; font-size:12px; color:var(--text-secondary);">Age/Grade: ${booking.age || 'N/A'} • Level: <strong style="color:var(--primary);">${booking.level}</strong></p>
                </div>
                <span class="badge badge-success" style="font-size:12px; padding:6px 12px; text-transform:uppercase; font-weight:700; box-shadow:0 0 10px var(--primary-glow);">${booking.status}</span>
            </div>

            <!-- Double-column Info Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 16px;">
                <div class="glass-card" style="padding: 16px; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; background: rgba(255,255,255,0.01);">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">👨‍👩‍👦 Contact & Parent Details</h4>
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size:13px;">
                        <li style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Parent Name:</span><span style="font-weight:600;">${booking.parentName || 'N/A'}</span></li>
                        <li style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Mobile:</span><span style="font-weight:600; color:#4ADE80;"><a href="https://wa.me/${(booking.mobile || '').replace(/\D/g,'')}" target="_blank" style="color:inherit; text-decoration:none;">💬 ${booking.mobile || 'N/A'}</a></span></li>
                        <li style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Email:</span><span style="font-weight:600;"><a href="mailto:${booking.email || ''}" style="color:inherit; text-decoration:none;">✉️ ${booking.email || 'N/A'}</a></span></li>
                        <li style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Location:</span><span style="font-weight:600;">📍 ${booking.city || 'N/A'}, ${booking.country || 'N/A'}</span></li>
                    </ul>
                </div>

                <div class="glass-card" style="padding: 16px; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; background: rgba(255,255,255,0.01);">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">📅 Session & Coach Details</h4>
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size:13px;">
                        <li style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Preferred Slot:</span><span style="font-weight:600;">🗓️ ${booking.date}</span></li>
                        <li style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Time Slot:</span><span style="font-weight:600; color:var(--primary);">⏰ ${booking.slot}</span></li>
                        <li style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Timezone / Lang:</span><span style="font-weight:600;">🌍 ${booking.timezone || 'GMT+5:30'} (${booking.language || 'English'})</span></li>
                        <li style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Payment Tier:</span><span style="font-weight:600; color:#FBBF24;">${booking.paymentStatus === 'Paid' ? '💎 Premium (₹' + booking.paymentAmount + ')' : '🆓 Free Trial'}</span></li>
                    </ul>
                </div>
            </div>

            <!-- Assigned Coach Info Card -->
            <div style="background: rgba(255, 255, 255, 0.02); padding: 14px 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; gap: 16px; width: 100%; margin-bottom: 16px;">
                <img src="${coachAvatar}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--primary); object-fit: cover;">
                <div style="flex: 1;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; font-weight:700;">ASSIGNED CHESS COACH</div>
                    <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-top:2px;">${coachName}</div>
                </div>
                <a href="${booking.meetingLink || '#'}" target="_blank" class="btn btn-primary" style="padding: 6px 12px; font-size: 11px; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 8px rgba(139,92,246,0.3);">💻 Join Class Link</a>
            </div>

            <!-- Lead Goals & Notes Box -->
            <div class="glass-card" style="padding: 16px; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; background: rgba(255,255,255,0.01); margin-bottom: 16px;">
                <div style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';">
                    <h4 style="margin: 0; font-size: 14px; font-weight:700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">🎯 Diagnostic Notes & Student Goals</h4>
                    <span style="font-size:12px; color:var(--text-muted);">(Click to toggle)</span>
                </div>
                <div style="display: none; margin-top: 14px; font-size:13px; line-height:1.5; color:var(--text-secondary); background: rgba(0,0,0,0.05); padding: 12px; border-radius: 6px; border-left: 3px solid var(--primary);">
                    ${booking.notes || 'No custom notes provided.'}
                    ${booking.goals && booking.goals.length > 0 ? `
                        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
                            ${booking.goals.map(g => `<span style="background:rgba(192, 132, 252, 0.15); border:1px solid rgba(192, 132, 252, 0.3); color:var(--primary); font-size:11px; padding:3px 8px; border-radius:4px; font-weight:600;">✨ ${g}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Collapsible Assignment rationale logs -->
            <div class="glass-card" style="padding: 16px; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; background: rgba(255,255,255,0.01); margin-bottom: 8px;">
                <div style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';">
                    <h4 style="margin: 0; font-size: 14px; font-weight:700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">🧠 AI AUTO-ASSIGNMENT DECISION DIAGNOSTIC</h4>
                    <span style="font-size:12px; color:var(--text-muted);">(Click to toggle)</span>
                </div>
                <div style="display: none; margin-top: 14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05); font-family: monospace; font-size: 11px; color:#A78BFA; background:rgba(0,0,0,0.3); padding:12px; border-radius:6px; max-height:200px; overflow-y:auto; text-align:left;">
                    ${booking.matchLogs && booking.matchLogs.length > 0 ? `
                        <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px;">
                            ${booking.matchLogs.map(line => `<li>${line}</li>`).join('')}
                        </ul>
                    ` : `
                        <div style="color:var(--text-muted);">No decision logs recorded. Static override or manual scheduling was used.</div>
                    `}
                    ${booking.matchScore ? `
                        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); color: #C084FC;">
                            <strong style="color:var(--text-primary);">Weight Scorecard Breakdown:</strong><br>
                            Rating Factor Weight: ${booking.matchScore.rating || 0} pts<br>
                            Daily Load Balance Margin: ${booking.matchScore.loadBalancing || 0} pts<br>
                            Priority Override Score: ${booking.matchScore.priority || 0} pts<br>
                            Total Matching Multi-Factor Score: <strong style="color:#FBBF24;">${booking.matchScore.total || 0} pts</strong>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        this.studentDetailsContent.innerHTML = detailsHtml;
        this.openModal(this.modalStudentDetails);
    }

    // --- DETAILED REPORTS LOGIC ---
    static loadDetailedReports() {
        if (!this.detailedReportsTableBody) return;

        const bookings = window.ChessDB.getBookings() || [];
        const leads = window.ChessDB.getCRMLeads() || [];
        
        // Combine all candidates
        const allCandidates = [
            ...bookings.map(b => ({
                id: b.id,
                name: b.studentName,
                parentName: b.parentName || "N/A",
                mobile: b.mobile || "N/A",
                email: b.email || "N/A",
                age: b.age || "N/A",
                level: b.level || "Unknown",
                language: b.language || "Unknown",
                location: `${b.city || "Unknown"}, ${b.country || "Unknown"}`,
                date: b.date || "Unknown",
                slotTimezone: `${b.slot || "No Slot"} (${b.timezone || "N/A"})`,
                teacherName: b.teacherName || "Unassigned",
                crmStatus: b.crmStatus ? b.crmStatus.toLowerCase() : "demo booked",
                notes: b.notes || ""
            })),
            ...leads.map(l => ({
                id: l.id,
                name: l.name,
                parentName: l.parentName || "N/A",
                mobile: l.mobile || "N/A",
                email: l.email || "N/A",
                age: l.age || "N/A",
                level: l.level || "Inquire",
                language: l.language || "N/A",
                location: `${l.city || "Unknown"}, ${l.country || "Unknown"}`,
                date: l.date || "Unknown",
                slotTimezone: "N/A",
                teacherName: "N/A",
                crmStatus: l.crmStatus ? l.crmStatus.toLowerCase() : "new lead",
                notes: l.notes || ""
            }))
        ];

        // Apply Filters
        let filtered = allCandidates;
        
        if (this.reportFilterSearch && this.reportFilterSearch.value) {
            const query = this.reportFilterSearch.value.toLowerCase();
            filtered = filtered.filter(c => 
                c.name.toLowerCase().includes(query) || 
                c.mobile.toLowerCase().includes(query) || 
                c.email.toLowerCase().includes(query)
            );
        }

        if (this.reportFilterStatus && this.reportFilterStatus.value) {
            const statusQ = this.reportFilterStatus.value.toLowerCase();
            filtered = filtered.filter(c => c.crmStatus === statusQ);
        }

        this.detailedReportsTableBody.innerHTML = "";

        if (filtered.length === 0) {
            this.detailedReportsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No candidates found matching the criteria.</td></tr>`;
            return;
        }

        filtered.forEach(c => {
            const row = document.createElement("tr");
            
            // Format status badge
            let statusColor = "var(--text-secondary)";
            if (c.crmStatus === "demo attended") statusColor = "#10b981";
            if (c.crmStatus === "converted") statusColor = "#22C55E";
            if (c.crmStatus === "lost" || c.crmStatus === "cancelled") statusColor = "#ef4444";
            if (c.crmStatus === "demo booked") statusColor = "#3b82f6";

            row.innerHTML = `
                <td style="font-weight:600; color:var(--text-primary);">${c.name}</td>
                <td style="font-size:11px; color:var(--text-secondary);">${c.parentName}</td>
                <td>${c.mobile}</td>
                <td><a href="mailto:${c.email}" style="color:var(--text-secondary); text-decoration:underline;">${c.email}</a></td>
                <td>${c.age}</td>
                <td>${c.level}</td>
                <td>${c.language}</td>
                <td>${c.location}</td>
                <td>${c.date}</td>
                <td style="font-size:11px; color:var(--text-secondary);">${c.slotTimezone}</td>
                <td>${c.teacherName}</td>
                <td><span style="font-size:11px; padding:4px 8px; border-radius:4px; background:${statusColor}20; color:${statusColor}; border:1px solid ${statusColor}40; text-transform:capitalize;">${c.crmStatus}</span></td>
                <td style="font-size:10px; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${c.notes}">${c.notes}</td>
            `;
            this.detailedReportsTableBody.appendChild(row);
        });
        
        // Cache filtered list for export
        this.currentReportExportData = filtered;
    }

    static exportDetailedReportsCSV() {
        const data = this.currentReportExportData || [];
        if (data.length === 0) {
            window.Toast.show("Export Failed", "No data available to export.", "danger");
            return;
        }

        let csvContent = "Candidate Name,Parent Name,Mobile Number,Email ID,Age,Level,Language,Location,Booking Date,Slot & Timezone,Assigned Coach,CRM Status,Notes\n";
        
        data.forEach(row => {
            const safeName = '"' + String(row.name).replace(/"/g, '""') + '"';
            const safeParent = '"' + String(row.parentName).replace(/"/g, '""') + '"';
            const safeMobile = '"' + String(row.mobile).replace(/"/g, '""') + '"';
            const safeEmail = '"' + String(row.email).replace(/"/g, '""') + '"';
            const safeAge = '"' + String(row.age).replace(/"/g, '""') + '"';
            const safeLevel = '"' + String(row.level).replace(/"/g, '""') + '"';
            const safeLang = '"' + String(row.language).replace(/"/g, '""') + '"';
            const safeLoc = '"' + String(row.location).replace(/"/g, '""') + '"';
            const safeDate = '"' + String(row.date).replace(/"/g, '""') + '"';
            const safeSlot = '"' + String(row.slotTimezone).replace(/"/g, '""') + '"';
            const safeCoach = '"' + String(row.teacherName).replace(/"/g, '""') + '"';
            const safeStatus = '"' + String(row.crmStatus).replace(/"/g, '""') + '"';
            const safeNotes = '"' + String(row.notes).replace(/"/g, '""') + '"';
            
            csvContent += [
                safeName, safeParent, safeMobile, safeEmail, safeAge, 
                safeLevel, safeLang, safeLoc, safeDate, safeSlot, 
                safeCoach, safeStatus, safeNotes
            ].join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "candidates_report_export.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.Toast.show("Export Complete", "CSV file has been downloaded.", "success");
    }
}

// Global Exports for inline DOM click events
window.AdminController = AdminController;
