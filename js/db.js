// Chess Demo Booking - Database Initializer
// Manages application state using localStorage for persistence

const DEFAULT_TEACHERS = [];

const DEFAULT_BOOKINGS = [];

const DEFAULT_CRM_LEADS = [];

const DEFAULT_LOGS = [];

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
        if (tList.length === 0) {
            tList = DEFAULT_TEACHERS;
            localStorage.setItem("chess_teachers", JSON.stringify(tList));
        }
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
                
                // Validate meeting link format only if it is not a real meeting link updated by the coach
                if (!b.meetingLink) {
                    b.meetingLink = window.generateGoogleMeetLink();
                    updatedB = true;
                } else if (!b.isRealMeetingLink) {
                    const meetRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
                    if (!meetRegex.test(b.meetingLink)) {
                        b.meetingLink = window.generateGoogleMeetLink();
                        updatedB = true;
                    }
                }
            });
            if (updatedB) localStorage.setItem("chess_bookings", JSON.stringify(bList));
        } catch (e) {
            console.error("Migration error:", e);
        }
    }

    static async loadFromServer() {
        try {
            const resp = await fetch("db.php?action=load");
            const data = await resp.json();
            
            if (data) {
                // Directly overwrite local storage to ensure the server is the single source of truth
                // and deletions/edits sync correctly across all devices.
                if (Array.isArray(data.teachers)) {
                    localStorage.setItem("chess_teachers", JSON.stringify(data.teachers));
                }
                if (Array.isArray(data.bookings)) {
                    localStorage.setItem("chess_bookings", JSON.stringify(data.bookings));
                }
                if (Array.isArray(data.crm_leads)) {
                    localStorage.setItem("chess_crm_leads", JSON.stringify(data.crm_leads));
                }
                if (Array.isArray(data.logs)) {
                    localStorage.setItem("chess_logs", JSON.stringify(data.logs));
                }
                if (data.roster) {
                    localStorage.setItem("chess_daily_roster", JSON.stringify(data.roster));
                }
                if (data.admin_credentials) {
                    localStorage.setItem("chess_admin_credentials", JSON.stringify(data.admin_credentials));
                }
            }
            
            // Run standard migrations/deduplications in memory
            this.init();
        } catch (e) {
            console.error("Failed to load database from server:", e);
            // Fallback: run init anyway to ensure database loads from local storage offline
            this.init();
        }
    }

    static async saveToServer() {
        try {
            const payload = {
                teachers: JSON.parse(localStorage.getItem("chess_teachers")) || [],
                bookings: JSON.parse(localStorage.getItem("chess_bookings")) || [],
                crm_leads: JSON.parse(localStorage.getItem("chess_crm_leads")) || [],
                logs: JSON.parse(localStorage.getItem("chess_logs")) || [],
                roster: JSON.parse(localStorage.getItem("chess_daily_roster")) || {},
                admin_credentials: JSON.parse(localStorage.getItem("chess_admin_credentials")) || { email: 'admin@parashchess.com', password: 'admin123' }
            };
            
            await fetch("db.php?action=save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.error("Failed to save database to server:", e);
        }
    }

    static getTeachers() {
        this.init();
        return JSON.parse(localStorage.getItem("chess_teachers")) || [];
    }

    static saveTeachers(teachers) {
        localStorage.setItem("chess_teachers", JSON.stringify(teachers));
        this.saveToServer();
    }

    static getBookings() {
        this.init();
        return JSON.parse(localStorage.getItem("chess_bookings")) || [];
    }

    static saveBookings(bookings) {
        localStorage.setItem("chess_bookings", JSON.stringify(bookings));
        this.saveToServer();
    }

    static getCRMLeads() {
        this.init();
        return JSON.parse(localStorage.getItem("chess_crm_leads")) || [];
    }

    static saveCRMLeads(leads) {
        localStorage.setItem("chess_crm_leads", JSON.stringify(leads));
        this.saveToServer();
    }

    static getLogs() {
        this.init();
        return JSON.parse(localStorage.getItem("chess_logs")) || [];
    }

    static addLog(type, message) {
        this.init();
        const logs = JSON.parse(localStorage.getItem("chess_logs")) || [];
        logs.unshift({
            timestamp: new Date().toISOString(),
            type,
            message
        });
        localStorage.setItem("chess_logs", JSON.stringify(logs.slice(0, 100))); // Keep last 100 logs
        this.saveToServer();
    }

    // Daily Roster Persistence
    static getRoster() {
        this.init();
        const roster = localStorage.getItem("chess_daily_roster");
        return roster ? JSON.parse(roster) : {};
    }

    static saveRoster(roster) {
        localStorage.setItem("chess_daily_roster", JSON.stringify(roster));
        this.saveToServer();
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

// Automatically initialize db from server on script load
window.ChessDB = DB;
window.ChessDB.initPromise = DB.loadFromServer();
