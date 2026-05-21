// Chess Demo Booking - Database Initializer
// Manages application state using localStorage for persistence

const DEFAULT_TEACHERS = [];

// Auto-clean old demo teachers if they exist
try {
    const oldT = JSON.parse(localStorage.getItem("chess_teachers"));
    if (oldT && oldT.length === 4 && oldT[0].id === 't_aarav') {
        localStorage.removeItem("chess_teachers");
    }
} catch (e) {}

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
        if (!localStorage.getItem("chess_teachers")) {
            localStorage.setItem("chess_teachers", JSON.stringify(DEFAULT_TEACHERS));
        }
        if (!localStorage.getItem("chess_bookings")) {
            localStorage.setItem("chess_bookings", JSON.stringify(DEFAULT_BOOKINGS));
        }
        if (!localStorage.getItem("chess_crm_leads")) {
            localStorage.setItem("chess_crm_leads", JSON.stringify(DEFAULT_CRM_LEADS));
        }
        if (!localStorage.getItem("chess_logs")) {
            localStorage.setItem("chess_logs", JSON.stringify(DEFAULT_LOGS));
        }

        // Migration: Ensure all teachers have a password
        try {
            let tList = JSON.parse(localStorage.getItem("chess_teachers")) || [];
            let updatedT = false;
            tList.forEach(t => {
                if (!t.password) { t.password = 'teacher123'; updatedT = true; }
            });
            if (updatedT) localStorage.setItem("chess_teachers", JSON.stringify(tList));

            let bList = JSON.parse(localStorage.getItem("chess_bookings")) || [];
            let updatedB = false;
            bList.forEach(b => {
                if (!b.password) { b.password = 'student123'; updatedB = true; }
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

// Automatically initialize db on script load
DB.init();
window.ChessDB = DB;
