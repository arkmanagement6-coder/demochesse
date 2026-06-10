// Chess Demo Booking - Database Initializer
// Manages application state using localStorage for persistence

const DEFAULT_TEACHERS = [];

const DEFAULT_BOOKINGS = [
    {
        id: "b_1",
        studentName: "Kabir Mehta",
        parentName: "Rajesh Mehta",
        age: 9,
        level: "Beginner",
        mobile: "+91 98765 43210",
        email: "kabir.mehta@gmail.com",
        city: "Mumbai",
        country: "India",
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        slot: "11:00 AM",
        timezone: "GMT+5:30",
        language: "Hindi",
        teacherId: "t_vikram",
        teacherName: "Vikram Singh",
        status: "Demo Booked", // Demo Booked, Demo Attended, Rescheduled, Cancelled
        paymentStatus: "Free",
        paymentAmount: 0,
        meetingLink: "https://meet.google.com/abc-defg-hij",
        notes: "Enthusiastic about chess, knows basic pawn movements.",
        crmStatus: "Demo booked" // New lead, Demo booked, Demo attended, Follow up, Converted, Lost
    },
    {
        id: "b_2",
        studentName: "Emily Watson",
        parentName: "David Watson",
        age: 12,
        level: "Intermediate",
        mobile: "+1 415 555 2671",
        email: "emily.watson@yahoo.com",
        city: "San Francisco",
        country: "USA",
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        slot: "06:00 PM",
        timezone: "GMT-7:00",
        language: "English",
        teacherId: "t_priya",
        teacherName: "Priya Patel",
        status: "Demo Attended",
        paymentStatus: "Paid",
        paymentAmount: 99,
        meetingLink: "https://meet.google.com/xyz-qprs-tuv",
        notes: "Wants to study openings. Very attentive.",
        crmStatus: "Demo attended",
        feedback: "Strong candidate for full program. Recommended Advanced level package.",
        recommendedCourse: "Grandmaster Track (24 classes)"
    },
    {
        id: "b_3",
        studentName: "Rohan Das",
        parentName: "Sunita Das",
        age: 7,
        level: "Beginner",
        mobile: "+91 99887 76655",
        email: "rohan.das@gmail.com",
        city: "Kolkata",
        country: "India",
        date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
        slot: "10:00 AM",
        timezone: "GMT+5:30",
        language: "English",
        teacherId: "t_aarav",
        teacherName: "Aarav Sharma",
        status: "Demo Booked",
        paymentStatus: "Free",
        paymentAmount: 0,
        meetingLink: "https://meet.google.com/mnp-qrst-uvw",
        notes: "Complete beginner.",
        crmStatus: "Demo booked"
    },
    {
        id: "b_4",
        studentName: "Aditya Verma",
        parentName: "Manish Verma",
        age: 14,
        level: "Advanced",
        mobile: "+91 88776 65544",
        email: "aditya.verma@outlook.com",
        city: "Delhi",
        country: "India",
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
        slot: "03:00 PM",
        timezone: "GMT+5:30",
        language: "English",
        teacherId: "t_elena",
        teacherName: "Elena Rostova",
        status: "Demo Attended",
        paymentStatus: "Paid",
        paymentAmount: 99,
        meetingLink: "https://meet.google.com/fgh-ijkl-mno",
        notes: "Plays in local tournaments, wants coaching to break 1500 ELO.",
        crmStatus: "Converted",
        feedback: "Enrolled in 48-class Intermediate Elite Course.",
        recommendedCourse: "Tournament Prep (48 classes)"
    },
    {
        id: "b_5",
        studentName: "Sarah Connor",
        parentName: "Linda Connor",
        age: 10,
        level: "Beginner",
        mobile: "+44 20 7946 0958",
        email: "sarah.c@gmail.com",
        city: "London",
        country: "UK",
        date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
        slot: "12:00 PM",
        timezone: "GMT+1:00",
        language: "English",
        teacherId: "t_vikram",
        teacherName: "Vikram Singh",
        status: "Cancelled",
        paymentStatus: "Refunded",
        paymentAmount: 99,
        meetingLink: "https://meet.google.com/qwe-rtyu-iop",
        notes: "Parent cancelled due to sudden travel.",
        crmStatus: "Lost"
    }
];

const DEFAULT_CRM_LEADS = [
    { id: "lead_1", name: "Ananya Roy", email: "ananya.roy@gmail.com", mobile: "+91 91234 56789", level: "Beginner", crmStatus: "New lead", notes: "Inquired via Instagram lead form" },
    { id: "lead_2", name: "Arjun Khanna", email: "arjun.khanna@gmail.com", mobile: "+91 93210 98765", level: "Intermediate", crmStatus: "Follow up", notes: "Attended demo, thinking about pricing plans." }
];

const DEFAULT_LOGS = [
    { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), type: "system", message: "Auto-Assignment engine successfully matched Vikram Singh with Kabir Mehta." },
    { timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), type: "whatsapp", message: "WhatsApp confirmation sent to Rajesh Mehta for Kabir's demo at 11:00 AM." },
    { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), type: "email", message: "Demo briefing email sent to Vikram Singh for student Kabir Mehta." }
];

class DB {
    static init() {
        if (!localStorage.getItem("chess_teachers_cleaned_v2")) {
            localStorage.setItem("chess_teachers", JSON.stringify([]));
            localStorage.setItem("chess_teachers_cleaned_v2", "true");
        }

        const safeLoad = (key, defaultVal) => {
            try {
                const val = localStorage.getItem(key);
                if (!val) {
                    localStorage.setItem(key, JSON.stringify(defaultVal));
                    return defaultVal;
                }
                const parsed = JSON.parse(val);
                if (key === "chess_teachers" && !Array.isArray(parsed)) {
                    localStorage.setItem(key, JSON.stringify(defaultVal));
                    return defaultVal;
                }
                return parsed;
            } catch (e) {
                console.error(`Error loading localStorage key [${key}], resetting to default:`, e);
                try {
                    localStorage.setItem(key, JSON.stringify(defaultVal));
                } catch (err) {
                    console.error("Failed to write to localStorage:", err);
                }
                return defaultVal;
            }
        };

        let tList = safeLoad("chess_teachers", DEFAULT_TEACHERS);
        let bList = safeLoad("chess_bookings", DEFAULT_BOOKINGS);
        safeLoad("chess_crm_leads", DEFAULT_CRM_LEADS);
        safeLoad("chess_logs", DEFAULT_LOGS);

        // Migration and Self-healing
        try {
            let updatedT = false;

            // Self-healing: Deduplicate teachers sharing the same ID
            let deduplicatedTeachers = [];
            let seenIds = {};
            let isTListUpdated = false;

            tList.forEach(t => {
                if (!t || !t.id) return; // skip invalid records
                if (!seenIds[t.id]) {
                    seenIds[t.id] = t;
                    deduplicatedTeachers.push(t);
                } else {
                    // We found a duplicate! Merge t into seenIds[t.id]
                    let existing = seenIds[t.id];
                    isTListUpdated = true;

                    const isPlaceholderEmail = (email, name) => {
                        if (!email) return true;
                        const defaultEmail = name.toLowerCase().replace(/\s+/g, "") + "@parashchess.com";
                        return email.toLowerCase() === defaultEmail;
                    };
                    const isPlaceholderPhone = (phone) => {
                        return !phone || phone === "+91 98765 43210";
                    };
                    const isPlaceholderPassword = (pass) => {
                        return !pass || pass === "teacher123";
                    };

                    // Priority 1: Custom fields entered by user
                    if (t.name && (!existing.name || existing.name.length < t.name.length)) {
                        existing.name = t.name;
                    }
                    if (t.email && !isPlaceholderEmail(t.email, t.name)) {
                        existing.email = t.email;
                    }
                    if (t.phone && !isPlaceholderPhone(t.phone)) {
                        existing.phone = t.phone;
                    }
                    if (t.password && !isPlaceholderPassword(t.password)) {
                        existing.password = t.password;
                    }
                    if (t.experience && (!existing.experience || existing.experience === "6 Years (FIDE Master - Rating 2150)" || existing.experience.length < t.experience.length)) {
                        existing.experience = t.experience;
                    }
                    // Languages, expertise, slots
                    if (t.languages && Array.isArray(t.languages) && (!existing.languages || t.languages.length > existing.languages.length)) {
                        existing.languages = t.languages;
                    }
                    if (t.expertise && Array.isArray(t.expertise) && (!existing.expertise || t.expertise.length > existing.expertise.length)) {
                        existing.expertise = t.expertise;
                    }
                    if (t.slots && Array.isArray(t.slots) && (!existing.slots || t.slots.length > existing.slots.length)) {
                        existing.slots = t.slots;
                    }
                    // Avatar (base64 uploads over unsplash)
                    if (t.avatar && !t.avatar.startsWith("https://images.unsplash") && t.avatar.startsWith("data:")) {
                        existing.avatar = t.avatar;
                    } else if (t.avatar && !existing.avatar) {
                        existing.avatar = t.avatar;
                    }
                    // Other attributes
                    if (t.maxDemosPerDay !== undefined && t.maxDemosPerDay !== 4) existing.maxDemosPerDay = t.maxDemosPerDay;
                    if (t.priorityScore !== undefined && t.priorityScore !== 80) existing.priorityScore = t.priorityScore;
                    if (t.rating !== undefined && t.rating !== 4.8) existing.rating = t.rating;
                    if (t.activeStudents !== undefined && t.activeStudents > (existing.activeStudents || 0)) {
                        existing.activeStudents = t.activeStudents;
                    }
                    if (t.leaves && Array.isArray(t.leaves)) {
                        existing.leaves = Array.from(new Set([...(existing.leaves || []), ...t.leaves]));
                    }
                    if (t.phoneAccessApproved !== undefined) {
                        existing.phoneAccessApproved = existing.phoneAccessApproved || t.phoneAccessApproved;
                    }
                }
            });

            if (isTListUpdated) {
                tList = deduplicatedTeachers;
                updatedT = true;
            }

            tList.forEach(t => {
                if (!t.password) { t.password = 'teacher123'; updatedT = true; }
                if (!t.email) {
                    t.email = t.name.toLowerCase().replace(/\s+/g, "") + "@parashchess.com";
                    updatedT = true;
                }
                if (!t.phone) {
                    t.phone = "+91 98765 43210";
                    updatedT = true;
                }
                // Array safety check mappings
                if (!Array.isArray(t.expertise)) { t.expertise = ["Beginner"]; updatedT = true; }
                if (!Array.isArray(t.languages)) { t.languages = ["English"]; updatedT = true; }
                if (!Array.isArray(t.slots)) { t.slots = []; updatedT = true; }
                if (!Array.isArray(t.leaves)) { t.leaves = []; updatedT = true; }
            });
            if (updatedT) localStorage.setItem("chess_teachers", JSON.stringify(tList));

            let updatedB = false;
            bList.forEach(b => {
                if (!b.password) { b.password = 'student123'; updatedB = true; }
                
                // Validate meeting link format (https://meet.google.com/abc-defg-hij)
                const meetRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
                if (!b.meetingLink || !meetRegex.test(b.meetingLink)) {
                    b.meetingLink = window.generateGoogleMeetLink();
                    updatedB = true;
                }
            });
            if (updatedB) localStorage.setItem("chess_bookings", JSON.stringify(bList));
        } catch (e) {
            console.error("Migration error:", e);
        }
    }

    static getTeachers() {
        this.init();
        return JSON.parse(localStorage.getItem("chess_teachers"));
    }

    static saveTeachers(teachers) {
        localStorage.setItem("chess_teachers", JSON.stringify(teachers));
    }

    static getBookings() {
        this.init();
        return JSON.parse(localStorage.getItem("chess_bookings"));
    }

    static saveBookings(bookings) {
        localStorage.setItem("chess_bookings", JSON.stringify(bookings));
    }

    static getCRMLeads() {
        this.init();
        return JSON.parse(localStorage.getItem("chess_crm_leads"));
    }

    static saveCRMLeads(leads) {
        localStorage.setItem("chess_crm_leads", JSON.stringify(leads));
    }

    static getLogs() {
        this.init();
        return JSON.parse(localStorage.getItem("chess_logs"));
    }

    static addLog(type, message) {
        this.init();
        const logs = JSON.parse(localStorage.getItem("chess_logs"));
        logs.unshift({
            timestamp: new Date().toISOString(),
            type,
            message
        });
        localStorage.setItem("chess_logs", JSON.stringify(logs.slice(0, 100))); // Keep last 100 logs
    }

    // Daily Roster Persistence
    static getRoster() {
        this.init();
        const roster = localStorage.getItem("chess_daily_roster");
        return roster ? JSON.parse(roster) : {};
    }

    static saveRoster(roster) {
        localStorage.setItem("chess_daily_roster", JSON.stringify(roster));
    }

    static getDailyRosterForDate(date) {
        const roster = this.getRoster();
        if (roster[date]) {
            return roster[date];
        }
        
        // Fallback/Default: generate from teacher static slots
        const teachers = this.getTeachers();
        const defaultRoster = {};
        teachers.forEach(t => {
            const isLeave = t.leaves && t.leaves.includes(date);
            if (!isLeave) {
                defaultRoster[t.id] = t.slots || [];
            } else {
                defaultRoster[t.id] = [];
            }
        });
        return defaultRoster;
    }

    static saveBooking(booking) {
        const bookings = this.getBookings();
        const idx = bookings.findIndex(b => b.id === booking.id);
        if (idx !== -1) {
            bookings[idx] = booking;
        } else {
            bookings.push(booking);
        }
        this.saveBookings(bookings);
    }
}

// Global utility to generate perfectly formatted working Google Meet classroom links matching strictly required abc-defg-hij format
window.generateGoogleMeetLink = () => {
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

// Automatically initialize db on script load
DB.init();
window.ChessDB = DB;
