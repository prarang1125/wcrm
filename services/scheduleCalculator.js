const { DateTime } = require('luxon');

/**
 * Calculate the next run time for a schedule
 * @param {Object} schedule - Schedule object with frequency, start_date, time, week_days, timezone
 * @returns {string} ISO datetime string for next run
 */
function calculateNextRun(schedule) {
    const { frequency, start_date, time, week_days, timezone = 'Asia/Kolkata', last_run_at } = schedule;

    // Parse time (HH:mm)
    const [hours, minutes] = time.split(':').map(Number);

    // Get current time in target timezone
    const now = DateTime.now().setZone(timezone);

    // If this is the first run, use start_date + time
    if (!last_run_at) {
        const startDateTime = DateTime.fromISO(`${start_date}T${time}`, { zone: timezone });

        // If start time is in the past, calculate based on frequency
        if (startDateTime < now) {
            return calculateNextFromNow(now, frequency, hours, minutes, week_days, timezone);
        }

        return startDateTime.toISO();
    }

    // Calculate next run based on last_run_at
    const lastRun = DateTime.fromISO(last_run_at, { zone: timezone });

    switch (frequency) {
        case 'once':
            return null; // No next run for one-time schedules

        case 'daily':
            const nextDaily = lastRun.plus({ days: 1 }).set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
            return nextDaily.toISO();

        case 'weekly':
            return calculateNextWeekly(lastRun, hours, minutes, week_days, timezone);

        default:
            throw new Error(`Unknown frequency: ${frequency}`);
    }
}

/**
 * Calculate next run from current time
 */
function calculateNextFromNow(now, frequency, hours, minutes, week_days, timezone) {
    switch (frequency) {
        case 'once':
            // For once, if start_date is past, it should have run already
            // This shouldn't happen in normal flow
            return now.plus({ minutes: 1 }).toISO();

        case 'daily':
            let nextDaily = now.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
            if (nextDaily <= now) {
                nextDaily = nextDaily.plus({ days: 1 });
            }
            return nextDaily.toISO();

        case 'weekly':
            return calculateNextWeekly(now, hours, minutes, week_days, timezone);

        default:
            throw new Error(`Unknown frequency: ${frequency}`);
    }
}

/**
 * Calculate next weekly occurrence
 */
function calculateNextWeekly(fromDate, hours, minutes, week_days, timezone) {
    if (!week_days || week_days.length === 0) {
        throw new Error('week_days required for weekly schedules');
    }

    // Parse week_days (JSON string or array)
    const days = typeof week_days === 'string' ? JSON.parse(week_days) : week_days;

    // Map day names to weekday numbers (1=Monday, 7=Sunday)
    const dayMap = {
        'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4,
        'fri': 5, 'sat': 6, 'sun': 7
    };

    const targetDays = days.map(d => dayMap[d.toLowerCase()]).sort((a, b) => a - b);

    let candidate = fromDate.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

    // If current time hasn't passed today's scheduled time, check if today is a target day
    if (candidate > fromDate && targetDays.includes(candidate.weekday)) {
        return candidate.toISO();
    }

    // Find next occurrence
    for (let i = 1; i <= 7; i++) {
        candidate = candidate.plus({ days: 1 });
        if (targetDays.includes(candidate.weekday)) {
            return candidate.toISO();
        }
    }

    // Fallback (shouldn't reach here)
    return candidate.toISO();
}

/**
 * Validate schedule parameters
 */
function validateSchedule(schedule) {
    const { target, message, url, start_date, time, frequency, week_days } = schedule;

    const errors = [];

    if (!target) {
        errors.push('target is required');
    } else if (Array.isArray(target)) {
        if (target.length === 0) errors.push('target array cannot be empty');
        target.forEach((t, i) => {
            if (typeof t !== 'string') errors.push(`target[${i}] must be a string`);
        });
    } else if (typeof target !== 'string') {
        errors.push('target must be a string or an array of strings');
    }

    if (!message && !url) errors.push('Either message or url must be provided');
    if (!start_date) errors.push('start_date is required');
    if (!time) errors.push('time is required');
    if (!frequency) errors.push('frequency is required');
    if (!['once', 'daily', 'weekly'].includes(frequency)) {
        errors.push('frequency must be once, daily, or weekly');
    }
    if (frequency === 'weekly' && (!week_days || week_days.length === 0)) {
        errors.push('week_days required for weekly schedules');
    }

    // Validate time format
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
        errors.push('time must be in HH:mm format');
    }

    // Validate start_date format
    if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
        errors.push('start_date must be in YYYY-MM-DD format');
    }

    return errors;
}

module.exports = {
    calculateNextRun,
    validateSchedule
};
