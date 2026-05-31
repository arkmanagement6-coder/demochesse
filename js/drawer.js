// Chess Academy Cloned Booking Drawer Controller (js/drawer.js)
document.addEventListener("DOMContentLoaded", () => {
    BookingDrawer.init();
});

class BookingDrawer {
    static init() {
        // Core elements
        this.overlay = document.getElementById("booking-drawer-overlay");
        this.drawer = document.getElementById("booking-drawer");
        this.closeBtn = document.getElementById("drawer-close");
        
        this.heroAgeSelect = document.getElementById("hero-age-select");
        this.heroSubmitBtn = document.getElementById("hero-submit-btn");
        
        // Navigation Triggers
        this.btnNext1 = document.getElementById("d-btn-next-1");
        this.btnNext2 = document.getElementById("d-btn-next-2");
        this.btnNext3 = document.getElementById("d-btn-next-3");
        this.btnSubmit = document.getElementById("d-btn-submit");
        
        this.btnBack2 = document.getElementById("d-btn-back-2");
        this.btnBack3 = document.getElementById("d-btn-back-3");
        this.btnBack4 = document.getElementById("d-btn-back-4");
        
        // Input Controls
        this.parentMobile = document.getElementById("d-parentMobile");
        this.studentAgeSelect = document.getElementById("d-studentAge");
        this.goalsGrid = document.querySelector(".drawer-goals-grid");
        this.dateCarousel = document.getElementById("d-date-carousel");
        this.timeSegments = document.getElementById("d-time-segments");
        this.slotGrid = document.getElementById("d-slot-grid");
        this.slotSuccessBanner = document.getElementById("d-slot-success-banner");
        this.selectedSlotText = document.getElementById("d-selected-slot-text");
        
        // Form states
        this.currentStep = 1;
        this.selectedGoals = [];
        this.selectedDateStr = "";
        this.selectedTimeStr = "";
        
        // Prefill Mobile input
        if (this.parentMobile) {
            this.parentMobile.value = "+91 ";
            this.setupMobileGuard();
        }
        
        this.bindEvents();
        this.initGoalsSelector();
        this.initDatesCarousel();
    }
    
    static bindEvents() {
        // Overlay close controls
        this.closeBtn.addEventListener("click", () => this.close());
        this.overlay.addEventListener("click", () => this.close());
        
        // Hero Submit Option
        this.heroSubmitBtn.addEventListener("click", () => {
            const ageVal = this.heroAgeSelect.value;
            if (!ageVal) {
                Toast.show("Age Required", "Please select your child's age to proceed.", "warning");
                this.heroAgeSelect.focus();
                return;
            }
            // Sync selected age to Step 2 input
            this.studentAgeSelect.value = ageVal;
            this.open();
        });
        
        // Step Continue navigators
        this.btnNext1.addEventListener("click", () => {
            if (this.validateStep(1)) this.setStep(2);
        });
        this.btnNext2.addEventListener("click", () => {
            if (this.validateStep(2)) this.setStep(3);
        });
        this.btnNext3.addEventListener("click", () => {
            if (this.validateStep(3)) this.setStep(4);
        });
        
        // Step Back navigators
        this.btnBack2.addEventListener("click", () => this.setStep(1));
        this.btnBack3.addEventListener("click", () => this.setStep(2));
        this.btnBack4.addEventListener("click", () => this.setStep(3));
        
        // Time Slot segments tabs
        const segmentButtons = this.timeSegments.querySelectorAll(".segment-btn");
        segmentButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                segmentButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.renderTimeSlots(btn.dataset.segment);
            });
        });
        
        // Final form submission MATCHMAKER
        this.btnSubmit.addEventListener("click", () => this.submitBooking());
    }
    
    static setupMobileGuard() {
        // Enforce "+91 " locked prefix
        this.parentMobile.addEventListener("input", (e) => {
            let val = e.target.value;
            if (!val.startsWith("+91 ")) {
                e.target.value = "+91 " + val.replace(/^\+?9?1?\s?/, "");
            }
            
            // Clean up typed section (only digits)
            let typed = e.target.value.substring(4);
            let cleaned = typed.replace(/\D/g, "");
            
            // Cap at 10 digits
            if (cleaned.length > 10) {
                cleaned = cleaned.substring(0, 10);
            }
            
            e.target.value = "+91 " + cleaned;
        });
        
        // Prevent cursor deleting prefix
        this.parentMobile.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && e.target.selectionStart <= 4) {
                e.preventDefault();
            }
        });
    }
    
    static open() {
        this.overlay.classList.add("active");
        this.drawer.classList.add("active");
        document.body.style.overflow = "hidden"; // disable body scrolling
        this.setStep(1);
    }
    
    static close() {
        this.overlay.classList.remove("active");
        this.drawer.classList.remove("active");
        document.body.style.overflow = ""; // enable scrolling
    }
    
    static setStep(stepNum) {
        this.currentStep = stepNum;
        
        // Toggle Step pages active visibility
        for (let i = 1; i <= 4; i++) {
            const stepContent = document.getElementById(`d-step-${i}`);
            if (stepContent) {
                stepContent.classList.toggle("active", i === stepNum);
            }
        }
        
        // Update header counters
        document.getElementById("drawer-step-badge").innerText = `Step ${stepNum} of 4`;
        const progressMap = { 1: 25, 2: 50, 3: 75, 4: 100 };
        document.getElementById("drawer-progress-fill").style.width = `${progressMap[stepNum]}%`;
    }
    
    static validateStep(stepNum) {
        if (stepNum === 1) {
            const parentName = document.getElementById("d-parentName").value.trim();
            const parentMobile = this.parentMobile.value.substring(4).trim();
            const parentEmail = document.getElementById("d-parentEmail").value.trim();
            
            if (parentName.length < 2) {
                Toast.show("Name Too Short", "Please enter your full parent name.", "warning");
                return false;
            }
            if (parentMobile.length !== 10) {
                Toast.show("Invalid Mobile", "Please enter a valid 10-digit WhatsApp number.", "warning");
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(parentEmail)) {
                Toast.show("Invalid Email", "Please enter a correct email address format.", "warning");
                return false;
            }
            return true;
        }
        
        if (stepNum === 2) {
            const studentName = document.getElementById("d-studentName").value.trim();
            const studentLevel = document.getElementById("d-studentLevel").value;
            const studentCity = document.getElementById("d-studentCity").value.trim();
            
            if (studentName.length < 2) {
                Toast.show("Child Name Required", "Please enter your child's first name.", "warning");
                return false;
            }
            if (!studentLevel) {
                Toast.show("Level Required", "Please select your child's chess experience.", "warning");
                return false;
            }
            if (studentCity.length < 2) {
                Toast.show("City Required", "Please enter your city to adjust coordinates.", "warning");
                return false;
            }
            return true;
        }
        
        if (stepNum === 3) {
            const commitLevel = document.getElementById("d-studentCommit").value;
            if (this.selectedGoals.length === 0) {
                Toast.show("Goals Required", "Please pick at least one goal focus category.", "warning");
                return false;
            }
            if (!commitLevel) {
                Toast.show("Commitment Required", "Please select a commitment expectation.", "warning");
                return false;
            }
            return true;
        }
        
        return true;
    }
    
    static initGoalsSelector() {
        const goalCards = this.goalsGrid.querySelectorAll(".drawer-goal-card");
        goalCards.forEach(card => {
            card.addEventListener("click", () => {
                const goal = card.dataset.goal;
                card.classList.toggle("selected");
                
                if (card.classList.contains("selected")) {
                    this.selectedGoals.push(goal);
                } else {
                    this.selectedGoals = this.selectedGoals.filter(g => g !== goal);
                }
            });
        });
    }
    
    static initDatesCarousel() {
        this.dateCarousel.innerHTML = "";
        
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + i);
            
            const dayName = days[targetDate.getDay()];
            const dayNum = targetDate.getDate();
            const monthName = months[targetDate.getMonth()];
            
            // Format YYYY-MM-DD
            const year = targetDate.getFullYear();
            const month = String(targetDate.getMonth() + 1).padStart(2, "0");
            const dateVal = String(dayNum).padStart(2, "0");
            const standardDate = `${year}-${month}-${dateVal}`;
            
            const pill = document.createElement("div");
            pill.className = `date-pill ${i === 0 ? "selected" : ""}`;
            pill.dataset.date = standardDate;
            pill.innerHTML = `
                <span class="day-name">${dayName}</span>
                <span class="day-num">${dayNum}</span>
                <span class="month-name">${monthName}</span>
            `;
            
            if (i === 0) {
                this.selectedDateStr = standardDate;
            }
            
            pill.addEventListener("click", () => {
                const pills = this.dateCarousel.querySelectorAll(".date-pill");
                pills.forEach(p => p.classList.remove("selected"));
                pill.classList.add("selected");
                
                this.selectedDateStr = standardDate;
                this.updateSlotBanner();
                
                // Re-render time slots since date changed and slots are roster-dependent
                const activeSegmentBtn = this.timeSegments.querySelector(".segment-btn.active");
                const segment = activeSegmentBtn ? activeSegmentBtn.dataset.segment : "evening";
                this.renderTimeSlots(segment);
            });
            
            this.dateCarousel.appendChild(pill);
        }
        
        // Initial render evening slots
        this.renderTimeSlots("evening");
    }
    
    static renderTimeSlots(segment) {
        this.slotGrid.innerHTML = "";
        
        const morningSlots = [];
        for (let h = 10; h <= 11; h++) {
            for (let m = 0; m < 60; m += 15) {
                morningSlots.push(`${h}:${m === 0 ? "00" : m} AM`);
            }
        }

        const afternoonSlots = [];
        for (let m = 0; m < 60; m += 15) {
            afternoonSlots.push(`12:${m === 0 ? "00" : m} PM`);
        }
        for (let h = 1; h <= 4; h++) {
            for (let m = 0; m < 60; m += 15) {
                afternoonSlots.push(`0${h}:${m === 0 ? "00" : m} PM`);
            }
        }

        const eveningSlots = [];
        for (let h = 5; h <= 8; h++) {
            for (let m = 0; m < 60; m += 15) {
                eveningSlots.push(`0${h}:${m === 0 ? "00" : m} PM`);
            }
        }
        eveningSlots.push("09:00 PM", "09:15 PM", "09:30 PM");
        
        const slotsMap = {
            morning: morningSlots,
            afternoon: afternoonSlots,
            evening: eveningSlots
        };
        
        const slots = slotsMap[segment] || [];
        const date = this.selectedDateStr;
        const dailyRoster = window.ChessDB.getDailyRosterForDate(date);
        const teachers = window.ChessDB.getTeachers();
        const bookings = window.ChessDB.getBookings();
        
        if (slots.length === 0) {
            this.slotGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 20px; color:var(--text-secondary); font-size:13px; font-weight:600;">
                    <i class="fa-regular fa-clock" style="font-size:24px; margin-bottom:8px; display:block; opacity:0.5;"></i>
                    No slots available in this bracket. Try Morning, Afternoon or Evening.
                </div>
            `;
            return;
        }
        
        slots.forEach(slot => {
            // Find coaches rostered for this slot on this date who are not on leave
            const rosteredCoaches = teachers.filter(t => {
                const rosterSlots = dailyRoster[t.id] || [];
                const isRostered = rosterSlots.includes(slot);
                const isLeave = t.leaves && t.leaves.includes(date);
                return isRostered && !isLeave;
            });

            let status = "full";
            if (rosteredCoaches.length > 0) {
                // Check if at least one rostered coach is free
                const freeCoach = rosteredCoaches.find(coach => {
                    const dailyLoad = bookings.filter(b => 
                        b.teacherId === coach.id && 
                        b.date === date && 
                        b.status !== "Cancelled"
                    ).length;

                    const isBusy = bookings.some(b => 
                        b.teacherId === coach.id && 
                        b.date === date && 
                        b.slot === slot && 
                        b.status !== "Cancelled"
                    );

                    return !isBusy && dailyLoad < coach.maxDemosPerDay;
                });

                if (freeCoach) {
                    status = "available";
                }
            }
            
            const pill = document.createElement("div");
            pill.className = "drawer-slot-pill";
            if (status === "full") {
                pill.classList.add("full");
                pill.style.opacity = "0.4";
                pill.style.cursor = "not-allowed";
                pill.style.pointerEvents = "none";
            }
            
            pill.innerText = slot;
            
            if (this.selectedTimeStr === slot && status !== "full") {
                pill.classList.add("selected");
            }
            
            if (status !== "full") {
                pill.addEventListener("click", () => {
                    const pills = this.slotGrid.querySelectorAll(".drawer-slot-pill");
                    pills.forEach(p => p.classList.remove("selected"));
                    pill.classList.add("selected");
                    
                    this.selectedTimeStr = slot;
                    this.updateSlotBanner();
                });
            }
            
            this.slotGrid.appendChild(pill);
        });
    }
    
    static updateSlotBanner() {
        if (this.selectedDateStr && this.selectedTimeStr) {
            this.slotSuccessBanner.style.display = "block";
            const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
            const dObj = new Date(this.selectedDateStr);
            const visualDate = dObj.toLocaleDateString("en-US", options);
            this.selectedSlotText.innerText = `${visualDate} at ${this.selectedTimeStr} IST`;
        } else {
            this.slotSuccessBanner.style.display = "none";
        }
    }
    
    static submitBooking() {
        if (!this.selectedDateStr || !this.selectedTimeStr) {
            Toast.show("Choose Slot", "Please click on a date and time slot to complete.", "warning");
            return;
        }
        
        // Grab values
        const parentName = document.getElementById("d-parentName").value.trim();
        const parentMobile = this.parentMobile.value.trim();
        const parentEmail = document.getElementById("d-parentEmail").value.trim();
        
        const studentName = document.getElementById("d-studentName").value.trim();
        const studentAge = this.studentAgeSelect.value;
        const studentLevel = document.getElementById("d-studentLevel").value;
        const studentCity = document.getElementById("d-studentCity").value.trim();
        
        // Run AI Matching Engine!
        const matchResult = window.AssignmentEngine.assignTeacher({
            level: studentLevel,
            language: "English",
            date: this.selectedDateStr,
            slot: this.selectedTimeStr
        });
        
        const bookingId = "b_" + Date.now();
        // Save to Simulated Database (localStorage) with standardized keys
        const bookingData = {
            id: bookingId,
            studentName,
            parentName,
            age: parseInt(studentAge),
            grade: `${studentAge}th Grade`,
            mobile: parentMobile,
            email: parentEmail,
            level: studentLevel,
            city: studentCity,
            country: "India",
            date: this.selectedDateStr,
            slot: this.selectedTimeStr,
            timezone: "GMT+5:30",
            language: "English",
            teacherId: matchResult.teacher.id,
            teacherName: matchResult.teacher.name,
            status: "Demo Booked",
            paymentStatus: "Free",
            paymentAmount: 0,
            meetingLink: window.generateGoogleMeetLink(),
            notes: `Auto Match Criteria status: ${matchResult.status}. Goals: ${this.selectedGoals.join(", ")}`,
            crmStatus: "Demo booked",
            matchLogs: matchResult.logs,
            matchScore: matchResult.scoreCard,
            goals: this.selectedGoals
        };
        
        // Save Booking in localStorage
        const bookings = window.ChessDB.getBookings();
        bookings.push(bookingData);
        window.ChessDB.saveBookings(bookings);
        
        // CRM dispatches to notification logs
        window.NotificationCenter.triggerStudentConfirmation(
            studentName,
            parentName,
            this.selectedDateStr,
            this.selectedTimeStr,
            matchResult.teacher.name,
            "whatsapp"
        );
        
        window.NotificationCenter.triggerTeacherConfirmation(
            matchResult.teacher.name,
            studentName,
            studentLevel,
            this.selectedDateStr,
            this.selectedTimeStr
        );
        
        Toast.show("Demo Confirmed!", "Your free FIDE Assessment slot has been booked.", "success");
        
        // Close and redirect cleanly
        this.close();
        
        setTimeout(() => {
            // Save currently active lead session to display customized tutor info in success.html
            localStorage.setItem("current_booking", JSON.stringify(bookingData));
            window.location.href = `success.html?id=${bookingId}`;
        }, 1000);
    }
}
