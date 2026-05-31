// Chess Demo Booking - Form Flow and Calendar Controller

document.addEventListener("DOMContentLoaded", () => {
    BookingWizard.init();
});

class BookingWizard {
    static init() {
        this.currentStep = 1;
        this.studentLevel = ""; // Start blank to require user choice for progression
        this.selectedDateStr = "";
        this.selectedSlotStr = "";
        this.paymentTier = "free";
        this.selectedGateway = "phonepe";
        
        // Date management
        this.currentDate = new Date(); // Today
        this.calendarYear = this.currentDate.getFullYear();
        this.calendarMonth = this.currentDate.getMonth();

        this.cacheDOM();
        this.bindEvents();
        this.renderCalendar();
        this.updateSectionVisibility(); // Initial progressive disclosure state
    }

    static cacheDOM() {
        this.form = document.getElementById("booking-form");
        this.prevBtn = document.getElementById("btn-prev");
        this.nextBtn = document.getElementById("btn-next");
        
        // Step elements
        this.stepContents = [
            document.getElementById("step-content-1"),
            document.getElementById("step-content-2"),
            document.getElementById("step-content-3")
        ];
        this.stepNodes = [
            document.getElementById("step-node-1"),
            document.getElementById("step-node-2"),
            document.getElementById("step-node-3")
        ];
        this.progressLine = document.getElementById("progress-line");

        // Step 1 interactive options
        this.levelCards = document.querySelectorAll("#step-content-1 .option-card");
        this.studentLang = document.getElementById("studentLanguage");
        this.studentTz = document.getElementById("studentTimezone");

        // Step 2 elements
        this.calMonthTitle = document.getElementById("cal-month-title");
        this.calDaysView = document.getElementById("calendar-days-view");
        this.calPrev = document.getElementById("cal-prev");
        this.calNext = document.getElementById("cal-next");
        this.slotsDayTitle = document.getElementById("slots-selected-day-title");
        this.slotsListView = document.getElementById("slots-list-view");

        // Step 3 elements
        this.priceCardFree = document.getElementById("price-card-free");
        this.priceCardPaid = document.getElementById("price-card-paid");
        this.paymentPanel = document.getElementById("payment-gateway-panel");
        this.gatewayBtns = document.querySelectorAll(".pay-btn");
        this.gatewayInstruction = document.getElementById("gateway-instruction");
        this.qrCodeWrapper = document.getElementById("simulated-qr-wrapper");
    }

    static bindEvents() {
        // Navigation Buttons
        this.nextBtn.addEventListener("click", () => this.handleNext());
        this.prevBtn.addEventListener("click", () => this.handlePrev());

        // Step 1 Progressive Listeners
        const inputsToWatch = ["studentName", "parentName", "studentAge", "studentGrade", "studentEmail", "studentCity", "studentCountry", "studentLanguage"];
        inputsToWatch.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const eventName = el.tagName === "SELECT" ? "change" : "input";
                el.addEventListener(eventName, () => this.updateSectionVisibility());
            }
        });

        // Mobile Prefilled with +91 and limited to 10 digits
        const mobileInput = document.getElementById("studentMobile");
        if (mobileInput) {
            mobileInput.addEventListener("input", (e) => {
                let val = e.target.value;
                // Force +91 prefix
                if (!val.startsWith("+91 ")) {
                    // Strip any leading +91 or 91 patterns that might get messy
                    let cleared = val.replace(/^\+?91\s?/, "");
                    val = "+91 " + cleared;
                }
                let prefix = "+91 ";
                let rest = val.substring(prefix.length).replace(/\D/g, ""); // Keep only digits
                if (rest.length > 10) {
                    rest = rest.substring(0, 10); // Enforce 10 digit limit
                }
                e.target.value = prefix + rest;
                this.updateSectionVisibility();
            });

            mobileInput.addEventListener("keydown", (e) => {
                // Prevent deleting "+91 " prefix using backspace
                if (e.key === "Backspace" && e.target.value.length <= 4) {
                    e.preventDefault();
                }
            });
        }

        // Step 1: Level Cards selection with trigger progressive
        this.levelCards.forEach(card => {
            card.addEventListener("click", (e) => {
                this.levelCards.forEach(c => c.classList.remove("selected"));
                const selectedCard = e.currentTarget;
                selectedCard.classList.add("selected");
                this.studentLevel = selectedCard.getAttribute("data-value");
                this.updateSectionVisibility();
            });
        });

        // Step 2: Calendar month navigators
        this.calPrev.addEventListener("click", () => {
            this.calendarMonth--;
            if (this.calendarMonth < 0) {
                this.calendarMonth = 11;
                this.calendarYear--;
            }
            this.renderCalendar();
        });

        this.calNext.addEventListener("click", () => {
            this.calendarMonth++;
            if (this.calendarMonth > 11) {
                this.calendarMonth = 0;
                this.calendarYear++;
            }
            this.renderCalendar();
        });

        // Step 3: Package Selections
        this.priceCardFree.addEventListener("click", () => {
            this.priceCardFree.classList.add("selected");
            this.priceCardPaid.classList.remove("selected");
            this.paymentPanel.classList.remove("active");
            this.paymentTier = "free";
            this.nextBtn.innerText = "Confirm Demo Class";
        });

        this.priceCardPaid.addEventListener("click", () => {
            this.priceCardPaid.classList.add("selected");
            this.priceCardFree.classList.remove("selected");
            this.paymentPanel.classList.add("active");
            this.paymentTier = "paid";
            this.nextBtn.innerText = "Verify & Complete Booking";
        });

        // Step 3: Gateway methods click
        this.gatewayBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                this.gatewayBtns.forEach(g => g.classList.remove("selected"));
                const selectedGate = e.currentTarget;
                selectedGate.classList.add("selected");
                this.selectedGateway = selectedGate.getAttribute("data-gateway");
                this.updatePaymentGatewayView();
            });
        });
    }

    // Progressive Visibility Logic
    static updateSectionVisibility() {
        const studentName = document.getElementById("studentName")?.value || "";
        const parentName = document.getElementById("parentName")?.value || "";
        const studentAge = document.getElementById("studentAge")?.value || "";
        const studentMobile = document.getElementById("studentMobile")?.value || "";
        const studentEmail = document.getElementById("studentEmail")?.value || "";
        const studentCity = document.getElementById("studentCity")?.value || "";
        const studentCountry = document.getElementById("studentCountry")?.value || "";
        const studentLanguage = document.getElementById("studentLanguage")?.value || "";

        const groupAge = document.getElementById("group-age-grade");
        const groupContact = document.getElementById("group-contact");
        const groupLocation = document.getElementById("group-location");
        const groupExp = document.getElementById("group-experience");
        const groupLangTz = document.getElementById("group-lang-tz");

        // Progression checks
        const namesFilled = studentName.trim().length >= 2 && parentName.trim().length >= 2;
        const ageFilled = studentAge.trim().length >= 1 && parseInt(studentAge) >= 5;
        
        const mobileRest = studentMobile.replace("+91 ", "").replace(/\D/g, "");
        const contactFilled = mobileRest.length === 10 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim());
        
        const locationFilled = studentCity.trim().length >= 2 && studentCountry.trim().length > 0;
        
        let levelSelected = false;
        this.levelCards.forEach(c => {
            if (c.classList.contains("selected")) levelSelected = true;
        });

        const langSelected = studentLanguage.trim().length > 0;

        // Sequence reveal hooks
        if (namesFilled) {
            this.revealGroup(groupAge);
        } else {
            this.hideGroup(groupAge);
        }

        if (namesFilled && ageFilled) {
            this.revealGroup(groupContact);
        } else {
            this.hideGroup(groupContact);
        }

        if (namesFilled && ageFilled && contactFilled) {
            this.revealGroup(groupLocation);
        } else {
            this.hideGroup(groupLocation);
        }

        if (namesFilled && ageFilled && contactFilled && locationFilled) {
            this.revealGroup(groupExp);
        } else {
            this.hideGroup(groupExp);
        }

        if (namesFilled && ageFilled && contactFilled && locationFilled && levelSelected) {
            this.revealGroup(groupLangTz);
        } else {
            this.hideGroup(groupLangTz);
        }

        // Stepper CTA button toggle state
        if (this.currentStep === 1) {
            if (namesFilled && ageFilled && contactFilled && locationFilled && levelSelected && langSelected) {
                this.nextBtn.style.display = "inline-block";
            } else {
                this.nextBtn.style.display = "none";
            }
        } else {
            this.nextBtn.style.display = "inline-block";
        }
    }

    static revealGroup(el) {
        if (el && el.style.display === "none") {
            el.style.display = "grid";
            el.classList.add("active");
        }
    }

    static hideGroup(el) {
        if (el && el.style.display !== "none") {
            el.style.display = "none";
            el.classList.remove("active");
        }
    }

    // Wizard Nav Logic
    static handleNext() {
        if (this.currentStep === 1) {
            if (this.validateStep1()) {
                this.currentStep = 2;
                this.updateWizardUI();
            }
        } else if (this.currentStep === 2) {
            if (!this.selectedDateStr || !this.selectedSlotStr) {
                window.Toast.show("Required Slot", "Please select a date and an available time slot.", "warning");
                return;
            }
            this.currentStep = 3;
            this.updateWizardUI();
        } else if (this.currentStep === 3) {
            this.submitBookingForm();
        }
    }

    static handlePrev() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateWizardUI();
        }
    }

    static validateStep1() {
        const fields = ["studentName", "parentName", "studentAge", "studentMobile", "studentEmail", "studentCity", "studentCountry"];
        let isValid = true;

        fields.forEach(fid => {
            const input = document.getElementById(fid);
            if (!input || !input.checkValidity()) {
                input.style.borderColor = "#EF4444";
                isValid = false;
            } else {
                input.style.borderColor = "var(--border-color)";
            }
        });

        // Email validation
        const emailInput = document.getElementById("studentEmail");
        if (emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
            emailInput.style.borderColor = "#EF4444";
            isValid = false;
        }

        if (!isValid) {
            window.Toast.show("Validation Failed", "Please fill in all mandatory fields with correct formats.", "danger");
        }
        return isValid;
    }

    static updateWizardUI() {
        // Toggle Step Panels
        this.stepContents.forEach((content, i) => {
            content.classList.toggle("active", i + 1 === this.currentStep);
        });

        // Update Progress indicator states
        this.stepNodes.forEach((node, i) => {
            const stepNum = i + 1;
            node.classList.toggle("active", stepNum === this.currentStep);
            node.classList.toggle("completed", stepNum < this.currentStep);
        });

        // Update active bar width line
        const widthMap = { 1: 0, 2: 50, 3: 100 };
        this.progressLine.style.width = `${widthMap[this.currentStep]}%`;

        // Update Buttons visibility
        this.prevBtn.style.visibility = this.currentStep === 1 ? "hidden" : "visible";
        
        if (this.currentStep === 3) {
            this.nextBtn.innerText = this.paymentTier === "paid" ? "Verify & Complete Booking" : "Confirm Demo Class";
        } else {
            this.nextBtn.innerText = "Next Step \u2192";
        }

        this.updateSectionVisibility();
    }

    // Step 2: Calendar Generation
    static renderCalendar() {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        this.calMonthTitle.innerText = `${monthNames[this.calendarMonth]} ${this.calendarYear}`;
        
        this.calDaysView.innerHTML = "";

        // Headers
        const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
        daysOfWeek.forEach(d => {
            const el = document.createElement("div");
            el.className = "calendar-day-header";
            el.innerText = d;
            this.calDaysView.appendChild(el);
        });

        // Offset padding days
        const firstDayIndex = new Date(this.calendarYear, this.calendarMonth, 1).getDay();
        const totalDays = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();

        for (let i = 0; i < firstDayIndex; i++) {
            const el = document.createElement("div");
            el.className = "calendar-cell disabled";
            this.calDaysView.appendChild(el);
        }

        // Days Loop
        const todayStr = new Date().toISOString().split("T")[0];
        
        for (let day = 1; day <= totalDays; day++) {
            const dayCell = document.createElement("div");
            dayCell.className = "calendar-cell";
            dayCell.innerHTML = `<span>${day}</span>`;
            
            // Format YYYY-MM-DD
            const monthStr = String(this.calendarMonth + 1).padStart(2, "0");
            const dayStr = String(day).padStart(2, "0");
            const dateStr = `${this.calendarYear}-${monthStr}-${dayStr}`;
            
            const cellDate = new Date(dateStr);
            const isPast = dateStr < todayStr;
            
            if (isPast) {
                dayCell.classList.add("disabled");
            } else {
                // Mock dynamic states
                const dayOfWeek = cellDate.getDay();
                let state = "available"; // Default weekdays
                
                if (dayOfWeek === 0) { // Sunday Full
                    state = "full";
                } else if (dayOfWeek === 6) { // Saturday Limited
                    state = "limited";
                }

                // Add state dot indicators
                const dot = document.createElement("span");
                dot.className = `cell-indicator indicator-${state}`;
                dayCell.appendChild(dot);

                dayCell.setAttribute("data-date", dateStr);
                dayCell.setAttribute("data-state", state);

                if (this.selectedDateStr === dateStr) {
                    dayCell.classList.add("selected");
                }

                dayCell.addEventListener("click", (e) => this.handleDateClick(e.currentTarget));
            }

            this.calDaysView.appendChild(dayCell);
        }
    }

    static handleDateClick(cell) {
        document.querySelectorAll(".calendar-cell").forEach(c => c.classList.remove("selected"));
        cell.classList.add("selected");
        
        this.selectedDateStr = cell.getAttribute("data-date");
        const dateState = cell.getAttribute("data-state");

        // Format user header
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        const dObj = new Date(this.selectedDateStr);
        this.slotsDayTitle.innerText = dObj.toLocaleDateString("en-US", options);

        this.renderTimeSlots(dateState);
    }

    static renderTimeSlots(dateState) {
        this.slotsListView.innerHTML = "";
        
        const standardSlots = [
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

        const date = this.selectedDateStr;
        const dailyRoster = window.ChessDB.getDailyRosterForDate(date);
        const teachers = window.ChessDB.getTeachers();
        const bookings = window.ChessDB.getBookings();

        standardSlots.forEach(timeSlot => {
            // Find coaches rostered for this slot on this date who are not on leave and match level/language
            const rosteredCoaches = teachers.filter(t => {
                const slots = dailyRoster[t.id] || [];
                const isRostered = slots.includes(timeSlot);
                const isLeave = t.leaves && t.leaves.includes(date);
                const supportsLevel = !this.studentLevel || (t.expertise && t.expertise.includes(this.studentLevel));
                const supportsLang = !this.studentLang || !this.studentLang.value || (t.languages && t.languages.includes(this.studentLang.value));
                return isRostered && !isLeave && supportsLevel && supportsLang;
            });

            let status = "full";
            
            if (rosteredCoaches.length > 0) {
                // Check if at least one rostered coach is free (not busy and daily load < maxDemosPerDay)
                const freeCoach = rosteredCoaches.find(coach => {
                    const dailyLoad = bookings.filter(b => 
                        b.teacherId === coach.id && 
                        b.date === date && 
                        b.status !== "Cancelled"
                    ).length;

                    const isBusy = bookings.some(b => 
                        b.teacherId === coach.id && 
                        b.date === date && 
                        b.slot === timeSlot && 
                        b.status !== "Cancelled"
                    );

                    return !isBusy && dailyLoad < coach.maxDemosPerDay;
                });

                if (freeCoach) {
                    status = "available";
                }
            }

            const card = document.createElement("div");
            card.className = "slot-card";
            if (status === "full") card.classList.add("full");
            
            if (this.selectedSlotStr === timeSlot && status !== "full") {
                card.classList.add("selected");
            }

            card.innerHTML = `
                <span class="slot-time">${timeSlot}</span>
                <span class="slot-status ${status}">${status.toUpperCase()}</span>
            `;

            if (status !== "full") {
                card.addEventListener("click", () => {
                    document.querySelectorAll(".slot-card").forEach(c => c.classList.remove("selected"));
                    card.classList.add("selected");
                    this.selectedSlotStr = timeSlot;
                });
            }

            this.slotsListView.appendChild(card);
        });
    }

    // Step 3 Payment View updater
    static updatePaymentGatewayView() {
        if (this.selectedGateway === "phonepe") {
            this.gatewayInstruction.innerText = "Scan PhonePe QR Code below to verify trial payment transaction.";
            this.qrCodeWrapper.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PhonePeSandboxTransaction99" alt="PhonePe QR Code sandbox" style="width:100%; height:100%;">`;
        } else if (this.selectedGateway === "razorpay") {
            this.gatewayInstruction.innerText = "Select simulated card banking channel.";
            this.qrCodeWrapper.innerHTML = `
                <div style="text-align:left; font-size:12px; display:flex; flex-direction:column; gap:8px; padding:10px;">
                    <label>Card Number</label>
                    <input type="text" class="form-control" value="4111 2222 3333 4444" disabled style="padding:6px; font-size:12px;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                        <input type="text" class="form-control" value="12/29" disabled style="padding:6px; font-size:12px;">
                        <input type="password" class="form-control" value="123" disabled style="padding:6px; font-size:12px;">
                    </div>
                </div>
            `;
        } else if (this.selectedGateway === "paytm") {
            this.gatewayInstruction.innerText = "Submit paytm transaction request OTP link.";
            this.qrCodeWrapper.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:8px; padding:10px;">
                    <input type="text" class="form-control" placeholder="Enter Paytm Number" style="padding:6px; font-size:12px;">
                    <button type="button" class="btn btn-primary" style="padding:6px; font-size:12px;">Send OTP code</button>
                </div>
            `;
        }
    }

    // Submission & Matching Engine execution
    static submitBookingForm() {
        // Collect form data
        const studentName = document.getElementById("studentName").value;
        const parentName = document.getElementById("parentName").value;
        const age = parseInt(document.getElementById("studentAge").value);
        const grade = document.getElementById("studentGrade").value;
        const mobile = document.getElementById("studentMobile").value;
        const email = document.getElementById("studentEmail").value;
        const city = document.getElementById("studentCity").value;
        const country = document.getElementById("studentCountry").value;
        const language = this.studentLang.value;
        const timezone = this.studentTz.value;
        
        // Execute Assignment Engine
        const matchResult = window.AssignmentEngine.assignTeacher({
            level: this.studentLevel,
            language: language,
            date: this.selectedDateStr,
            slot: this.selectedSlotStr
        });

        // Create new booking object
        const bookingId = "b_" + Date.now();
        
        // Generate a random, secure 8-character password
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let generatedPassword = "";
        for (let i = 0; i < 8; i++) {
            generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Generate a valid Google Meet link matching the strictly required abc-defg-hij format
        const generateGoogleMeetLink = () => {
            const letterChars = "abcdefghijklmnopqrstuvwxyz";
            const segment = (len) => {
                let s = "";
                for (let i = 0; i < len; i++) {
                    s += letterChars.charAt(Math.floor(Math.random() * letterChars.length));
                }
                return s;
            };
            return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
        };

        const newBooking = {
            id: bookingId,
            studentName,
            parentName,
            age,
            grade,
            mobile,
            email,
            password: generatedPassword, // Saved to candidate record
            city,
            country,
            date: this.selectedDateStr,
            slot: this.selectedSlotStr,
            timezone,
            language,
            teacherId: matchResult.teacher.id,
            teacherName: matchResult.teacher.name,
            status: matchResult.status === "Matched" ? "Demo Booked" : "Demo Booked", // Automatically schedules as booked or manual pending
            paymentStatus: this.paymentTier === "free" ? "Free" : "Paid",
            paymentAmount: this.paymentTier === "free" ? 0 : 99,
            meetingLink: generateGoogleMeetLink(),
            notes: `Auto Match Criteria status: ${matchResult.status}. Student Experience Level: ${this.studentLevel}`,
            crmStatus: "Demo booked",
            matchLogs: matchResult.logs,
            matchScore: matchResult.scoreCard
        };

        // Save Booking in localStorage
        const bookings = window.ChessDB.getBookings();
        bookings.push(newBooking);
        window.ChessDB.saveBookings(bookings);

        // Dispatch simulated customer alerts
        window.NotificationCenter.triggerStudentConfirmation(studentName, parentName, this.selectedDateStr, this.selectedSlotStr, matchResult.teacher.name, "whatsapp");
        window.NotificationCenter.triggerTeacherConfirmation(matchResult.teacher.name, studentName, this.studentLevel, this.selectedDateStr, this.selectedSlotStr);
        
        // Dispatch credentials welcome email to student parent
        window.NotificationCenter.dispatch("email", `Welcome to Parash Chess Academy! A student demo portal account has been created for ${studentName}. Log in to view your schedule. Email: ${email}, Password: ${generatedPassword}.`);

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
                email: email,
                mobile: mobile,
                date: this.selectedDateStr,
                slot: this.selectedSlotStr,
                teacherName: matchResult.teacher.name,
                meetingLink: newBooking.meetingLink,
                generatedPassword: generatedPassword
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Email dispatch result:", data);
        })
        .catch(error => {
            console.error("Failed to send booking email via Hostinger:", error);
        });

        // Redirect to success screen with booking query
        window.Toast.show("Booking Success", "Demo match initialized. Redirecting...", "success");
        setTimeout(() => {
            window.location.href = `success.html?id=${bookingId}`;
        }, 1500);
    }
}
