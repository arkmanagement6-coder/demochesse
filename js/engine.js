// Chess Demo Booking - Auto-Assignment Engine
// Matches students with the optimal chess coach based on rule weights

class AssignmentEngine {
    /**
     * Finds and assigns the most suitable teacher for a demo slot
     * @param {Object} studentInfo { level, language, date, slot }
     * @returns {Object} { teacher, status, logs, scoreCard }
     */
    static assignTeacher(studentInfo) {
        const { level, language, date, slot } = studentInfo;
        const teachers = window.ChessDB.getTeachers();
        const bookings = window.ChessDB.getBookings();
        
        let decisionLogs = [];
        decisionLogs.push(`🚀 Starting assignment engine matching for student level [${level}] in [${language}]...`);
        decisionLogs.push(`📅 Requested Slot: ${date} at ${slot}`);

        // Step 1: Active check & Leave filter
        const activeTeachers = teachers.filter(t => {
            const isLeave = t.leaves && t.leaves.includes(date);
            if (isLeave) {
                decisionLogs.push(`❌ Coach ${t.name} is on leave/unavailable on ${date}.`);
            }
            return !isLeave;
        });

        decisionLogs.push(`📋 Checked leaves: ${activeTeachers.length} out of ${teachers.length} coaches active.`);

        // Step 2: Skill Expertise filter
        const skillMatched = activeTeachers.filter(t => {
            const supportsLevel = !level || (t.expertise && t.expertise.some(e => e.toLowerCase().trim() === level.toLowerCase().trim()));
            if (!supportsLevel) {
                decisionLogs.push(`❌ Coach ${t.name} specializes in [${(t.expertise || []).join('/')}], does not support level [${level}].`);
            }
            return supportsLevel;
        });

        decisionLogs.push(`🎓 Level Compatibility: ${skillMatched.length} coaches match level [${level}].`);

        if (skillMatched.length === 0) {
            decisionLogs.push(`⚠️ No coaches specialize in ${level}.`);
            return this.generateWaitlistResult(decisionLogs);
        }

        // Step 3: Language filter
        const languageMatched = skillMatched.filter(t => {
            const supportsLang = !language || (t.languages && t.languages.some(l => l.toLowerCase().trim() === language.toLowerCase().trim()));
            if (!supportsLang) {
                decisionLogs.push(`❌ Coach ${t.name} teaches in [${(t.languages || []).join('/')}], does not speak [${language}].`);
            }
            return supportsLang;
        });

        decisionLogs.push(`🗣️ Language Compatibility: ${languageMatched.length} coaches speak [${language}].`);

        if (languageMatched.length === 0) {
            decisionLogs.push(`⚠️ No coaches speak language [${language}].`);
            return this.generateWaitlistResult(decisionLogs);
        }

        // Step 4: Daily Roster Availability filter
        const dailyRoster = window.ChessDB.getDailyRosterForDate(date);
        
        const slotMatched = languageMatched.filter(t => {
            const rosteredSlots = dailyRoster[t.id] || [];
            const supportsSlot = rosteredSlots.some(s => s.trim() === slot.trim());
            if (!supportsSlot) {
                decisionLogs.push(`❌ Coach ${t.name} is not rostered for the slot [${slot}] on ${date}.`);
            }
            return supportsSlot;
        });

        decisionLogs.push(`⏰ Daily Roster Availability: ${slotMatched.length} coaches rostered for slot [${slot}] on ${date}.`);

        if (slotMatched.length === 0) {
            decisionLogs.push(`⚠️ No coaches are rostered in slot [${slot}] on ${date}.`);
            return this.generateWaitlistResult(decisionLogs);
        }
 
        // Step 5: Slot Availability check & Capacity check (max demos/day)
        const eligibleCoaches = [];
        for (const coach of slotMatched) {
            // Count active bookings for this coach on this day
            const dailyLoad = bookings.filter(b => 
                b.teacherId === coach.id && 
                b.date === date && 
                b.status !== "Cancelled"
            ).length;
 
            // 5a. Slot Busy check: Forwarding when busy!
            const slotBusy = bookings.some(b => 
                b.teacherId === coach.id && 
                b.date === date && 
                b.slot === slot && 
                b.status !== "Cancelled"
            );
 
            if (slotBusy) {
                decisionLogs.push(`❌ Coach ${coach.name} is already assigned a demo at [${slot}] on ${date}. Checking alternative coaches.`);
            } else if (dailyLoad >= coach.maxDemosPerDay) {
                decisionLogs.push(`❌ Coach ${coach.name} has reached their daily limit of ${coach.maxDemosPerDay} classes for ${date}.`);
            } else {
                eligibleCoaches.push({
                    coach,
                    dailyLoad
                });
                decisionLogs.push(`✅ Coach ${coach.name} is FREE at ${slot} and has ${dailyLoad}/${coach.maxDemosPerDay} bookings for the day.`);
            }
        }
 
        if (eligibleCoaches.length === 0) {
            decisionLogs.push(`⚠️ All qualified coaches rostered for [${slot}] are busy or have reached maximum capacity.`);
            return this.generateWaitlistResult(decisionLogs);
        }
 
        // Step 6: Rank candidates based on multi-factor scores
        decisionLogs.push(`📊 Scoring matching coaches...`);
        let bestScore = -1;
        let selectedCoach = null;
        let selectedLoad = 0;
        let scoreCard = {};
 
        for (const item of eligibleCoaches) {
            const { coach, dailyLoad } = item;
            
            // Score factors:
            // 1. Rating Factor: rating * 15 (Max rating 5.0 -> 75 points)
            const ratingScore = coach.rating * 15;
            
            // 2. Load Balance Factor: (Max daily capacity - current daily load) * 8
            const capacityRoom = coach.maxDemosPerDay - dailyLoad;
            const loadScore = capacityRoom * 8;
            
            // 3. Priority Factor: priorityScore * 0.1 (Max 10 points)
            const priorityFactor = coach.priorityScore * 0.1;
 
            const totalScore = parseFloat((ratingScore + loadScore + priorityFactor).toFixed(2));
            
            scoreCard[coach.id] = {
                rating: ratingScore,
                loadBalancing: loadScore,
                priority: priorityFactor,
                total: totalScore
            };
 
            decisionLogs.push(`✨ ${coach.name}: Star Rating Score (${ratingScore}) + Capacity Margin Score (${loadScore}) + Priority Metric (${priorityFactor.toFixed(1)}) = Total: ${totalScore} pts`);
 
            if (totalScore > bestScore) {
                bestScore = totalScore;
                selectedCoach = coach;
                selectedLoad = dailyLoad;
            }
        }
 
        decisionLogs.push(`🏆 Selected Coach ${selectedCoach.name} with score ${bestScore} pts!`);
 
        return {
            status: "Matched",
            teacher: selectedCoach,
            logs: decisionLogs,
            scoreCard: scoreCard[selectedCoach.id]
        };
    }
 
    static generateWaitlistResult(logs) {
        logs.push(`🟠 Matching criteria failed. Fallback to first available admin coach.`);
        const teachers = window.ChessDB.getTeachers();
        const fallbackTeacher = (teachers && teachers.length > 0) ? teachers[0] : {
            id: "t_aarav",
            name: "Aarav Sharma",
            experience: "6 Years (FIDE Master - Rating 2150)",
            rating: 4.9,
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
            languages: ["English", "Hindi"],
            expertise: ["Beginner", "Intermediate"]
        };
        return {
            status: "Waitlisted",
            teacher: fallbackTeacher,
            logs: logs,
            scoreCard: { rating: 0, loadBalancing: 0, priority: 0, total: 0 }
        };
    }

    /**
     * Backward compatibility method for landing page drawer wizard.
     * Selects best rostered coach for the student's level.
     */
    static assignCoach(studentLevel) {
        const teachers = window.ChessDB.getTeachers();
        let engineLevel = "Beginner";
        if (studentLevel === "Intermediate") engineLevel = "Intermediate";
        if (studentLevel === "Advanced") engineLevel = "Advanced";
        
        const matched = teachers.find(t => t.expertise && t.expertise.some(e => e.toLowerCase().trim() === engineLevel.toLowerCase().trim()) && (!t.leaves || t.leaves.length === 0)) || teachers[0];
        return matched;
    }
}
 
window.AssignmentEngine = AssignmentEngine;
