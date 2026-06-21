// Chess Academy Cloned Booking Drawer Controller (js/drawer.js)
document.addEventListener("DOMContentLoaded", () => {
    window.ChessDB.initPromise.then(() => {
        BookingDrawer.init();
    });
});

class BookingDrawer {
    static init() {
        // Core elements
        this.overlay = document.getElementById("booking-drawer-overlay");
        this.drawer = document.getElementById("booking-drawer");
        this.closeBtn = document.getElementById("drawer-close");
        
        this.heroAgeSelect = document.getElementById("hero-age-select");
        this.heroSubmitBtn = document.getElementById("hero-submit-btn");
        this.heroAgeSelectMob = document.getElementById("hero-age-select-mob");
        this.heroSubmitBtnMob = document.getElementById("hero-submit-btn-mob");
        
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
            this.parentMobile.value = "";
            this.setupMobileGuard();
            
            const countryCodeSelect = document.getElementById("d-countryCode");
            if (countryCodeSelect) {
                countryCodeSelect.addEventListener("change", () => {
                    const code = countryCodeSelect.value;
                    if (code === "+91" || code === "+1") {
                        this.parentMobile.placeholder = "10-digit number";
                    } else if (code === "+44") {
                        this.parentMobile.placeholder = "10-digit mobile";
                    } else {
                        this.parentMobile.placeholder = "Mobile number";
                    }
                    this.parentMobile.value = "";
                });
            }
        }
        
        this.bindEvents();
        this.initGoalsSelector();
        this.initDatesCarousel();
    }
    
    static bindEvents() {
        // Overlay close controls
        this.closeBtn.addEventListener("click", () => this.close());
        this.overlay.addEventListener("click", () => this.close());
        
        // Hero Submit Option (Desktop)
        if (this.heroSubmitBtn) {
            this.heroSubmitBtn.addEventListener("click", () => {
                const ageVal = this.heroAgeSelect ? this.heroAgeSelect.value : "";
                if (!ageVal) {
                    Toast.show("Age Required", "Please select your child's age to proceed.", "warning");
                    if (this.heroAgeSelect) this.heroAgeSelect.focus();
                    return;
                }
                // Sync selected age to Step 2 input
                this.studentAgeSelect.value = ageVal;
                this.open();
            });
        }
        
        // Hero Submit Option (Mobile)
        if (this.heroSubmitBtnMob) {
            this.heroSubmitBtnMob.addEventListener("click", () => {
                const ageVal = this.heroAgeSelectMob ? this.heroAgeSelectMob.value : "";
                if (!ageVal) {
                    Toast.show("Age Required", "Please select your child's age to proceed.", "warning");
                    if (this.heroAgeSelectMob) this.heroAgeSelectMob.focus();
                    return;
                }
                // Sync selected age to Step 2 input
                this.studentAgeSelect.value = ageVal;
                this.open();
            });
        }
        
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
        this.parentMobile.addEventListener("input", (e) => {
            let val = e.target.value;
            // Clean up typed section (only digits)
            let cleaned = val.replace(/\D/g, "");
            
            // Cap at 15 digits
            if (cleaned.length > 15) {
                cleaned = cleaned.substring(0, 15);
            }
            
            e.target.value = cleaned;
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
            const parentMobile = this.parentMobile.value.trim();
            const parentEmail = document.getElementById("d-parentEmail").value.trim();
            const countryCodeSelect = document.getElementById("d-countryCode");
            const countryCode = countryCodeSelect ? countryCodeSelect.value : "+91";
            
            if (parentName.length < 2) {
                Toast.show("Name Too Short", "Please enter your full parent name.", "warning");
                return false;
            }
            
            let isMobileValid = true;
            if (countryCode === "+91") {
                if (parentMobile.length !== 10) isMobileValid = false;
            } else {
                if (parentMobile.length < 7 || parentMobile.length > 15) isMobileValid = false;
            }
            
            if (!isMobileValid) {
                if (countryCode === "+91") {
                    Toast.show("Invalid Mobile", "Please enter a valid 10-digit WhatsApp number.", "warning");
                } else {
                    Toast.show("Invalid Mobile", "Please enter a valid mobile number.", "warning");
                }
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
            // Find coaches rostered for this slot on this date who are not on leave and match level/language
            const rosteredCoaches = teachers.filter(t => {
                const rosterSlots = dailyRoster[t.id] || [];
                const isRostered = rosterSlots.some(s => s.trim() === slot.trim());
                const isLeave = t.leaves && t.leaves.includes(date);
                
                const studentLevelEl = document.getElementById("d-studentLevel");
                let level = studentLevelEl ? studentLevelEl.value : "";
                if (level === "Never played" || level === "Knows basic rules") {
                    level = "Beginner";
                }
                const LEVEL_ORDER = {
                    "beginner": 1,
                    "intermediate": 2,
                    "advanced": 3
                };
                const studentLevelClean = (level || "").toLowerCase().trim();
                const studentLevelVal = LEVEL_ORDER[studentLevelClean] || 0;
                const supportsLevel = !level || !t.expertise || t.expertise.length === 0 || t.expertise.some(exp => {
                    const expClean = exp.toLowerCase().trim();
                    if (!LEVEL_ORDER[expClean]) return true;
                    return LEVEL_ORDER[expClean] >= studentLevelVal;
                });
                const supportsLang = true;
                
                return isRostered && !isLeave && supportsLevel && supportsLang;
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

                    return !isBusy && dailyLoad < (coach.maxDemosPerDay || 4);
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
            const parts = this.selectedDateStr.split("-");
            const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
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
        const countryCodeSelect = document.getElementById("d-countryCode");
        const countryCode = countryCodeSelect ? countryCodeSelect.value : "+91";
        const parentMobile = countryCode + " " + this.parentMobile.value.trim();
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
        
        // Generate a random, secure 8-character password
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let generatedPassword = "";
        for (let i = 0; i < 8; i++) {
            generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Save to Simulated Database (localStorage) with standardized keys
        const bookingData = {
            id: bookingId,
            studentName,
            parentName,
            age: parseInt(studentAge),
            grade: `${studentAge}th Grade`,
            mobile: parentMobile,
            email: parentEmail,
            password: generatedPassword, // Save generated password
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
        
        // Show initializing loading toast
        Toast.show("Initializing Demo", "Scheduling your class and preparing credentials...", "info");
        
        // Send actual booking confirmation email to candidate via Hostinger PHP Mailer
        fetch('https://paraschessacademy.com/send-email.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'booking',
                studentName: studentName,
                parentName: parentName,
                email: parentEmail,
                mobile: parentMobile,
                date: this.selectedDateStr,
                slot: this.selectedTimeStr,
                teacherName: matchResult.teacher.name,
                meetingLink: bookingData.meetingLink,
                generatedPassword: generatedPassword
            })
        })
        .then(response => {
            // Redirect to success screen cleanly after request completes
            Toast.show("Demo Confirmed!", "Your free FIDE Assessment slot has been booked.", "success");
            this.close();
            setTimeout(() => {
                try {
                    localStorage.setItem("current_booking", JSON.stringify(bookingData));
                } catch (e) {
                    console.error("Failed to save booking to localStorage:", e);
                }
                window.location.href = `booking-confirmed.html?id=${bookingId}`;
            }, 1200);
        })
        .catch(error => {
            console.error("Failed to send booking email via Hostinger:", error);
            // Fallback redirect so the user experience is not blocked
            Toast.show("Demo Confirmed!", "Your free FIDE Assessment slot has been booked.", "success");
            this.close();
            setTimeout(() => {
                try {
                    localStorage.setItem("current_booking", JSON.stringify(bookingData));
                } catch (e) {
                    console.error("Failed to save booking to localStorage:", e);
                }
                window.location.href = `booking-confirmed.html?id=${bookingId}`;
            }, 1200);
        });
    }
}
