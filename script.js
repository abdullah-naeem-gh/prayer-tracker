// Initialize variables
const prayers = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];
let prayerData = {};
let streakCount = 0;

// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display
function formatDateForDisplay(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// Get today's date
const today = new Date();
const todayStr = formatDate(today);

// Update date display
document.getElementById('currentDate').textContent = formatDateForDisplay(today);

// Initialize today's data
function initializeTodayData() {
    if (!prayerData[todayStr]) {
        prayerData[todayStr] = {
            fajr: false,
            zuhr: false,
            asr: false,
            maghrib: false,
            isha: false
        };
    }
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('prayerData');
    if (savedData) {
        try {
            prayerData = JSON.parse(savedData);
        } catch (e) {
            console.error("Error parsing saved data:", e);
            prayerData = {};
        }
    }

    // Initialize today's data if not present
    initializeTodayData();

    // Load streak
    const savedStreak = localStorage.getItem('streakCount');
    if (savedStreak !== null) {
        try {
            streakCount = parseInt(savedStreak);
        } catch (e) {
            console.error("Error parsing streak count:", e);
            streakCount = 0;
        }
    }
    
    updateUI();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('prayerData', JSON.stringify(prayerData));
    localStorage.setItem('streakCount', streakCount.toString());
    updateUI();
}

// Update UI elements
function updateUI() {
    // Ensure today's data exists
    initializeTodayData();
    
    // Update checkboxes
    prayers.forEach(prayer => {
        const checkbox = document.getElementById(prayer);
        checkbox.checked = prayerData[todayStr][prayer];
    });

    // Update streak count
    document.getElementById('streakCount').textContent = streakCount;

    // Update today's count
    const completedToday = prayers.filter(prayer => prayerData[todayStr][prayer]).length;
    document.getElementById('todayCount').textContent = `${completedToday}/5`;

    // Calculate and update weekly average
    const weeklyAverage = calculatePeriodAverage(7);
    document.getElementById('weeklyAverage').textContent = `${weeklyAverage}%`;

    // Calculate and update monthly average
    const monthlyAverage = calculatePeriodAverage(30);
    document.getElementById('monthlyAverage').textContent = `${monthlyAverage}%`;
}

// Calculate average completion for a period
function calculatePeriodAverage(days) {
    let totalPrayers = 0;
    let completedPrayers = 0;
    
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        
        if (prayerData[dateStr]) {
            prayers.forEach(prayer => {
                totalPrayers++;
                if (prayerData[dateStr][prayer]) {
                    completedPrayers++;
                }
            });
        }
    }
    
    if (totalPrayers === 0) return 0;
    return Math.round((completedPrayers / totalPrayers) * 100);
}

// Check and update streak
function updateStreak() {
    // Ensure today's data exists
    initializeTodayData();
    
    // Check if yesterday was completed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    
    // Check if all prayers were completed yesterday
    const yesterdayCompleted = prayerData[yesterdayStr] && 
        prayers.every(prayer => prayerData[yesterdayStr][prayer]);
    
    // Check if all prayers are completed today
    const todayCompleted = prayers.every(prayer => prayerData[todayStr][prayer]);
    
    if (todayCompleted) {
        // If yesterday was also completed, increment streak
        if (yesterdayCompleted || streakCount === 0) {
            // Only increment if not already incremented today
            const lastStreakUpdate = localStorage.getItem('lastStreakUpdate');
            if (lastStreakUpdate !== todayStr) {
                streakCount++;
                localStorage.setItem('lastStreakUpdate', todayStr);
            }
        }
    } else if (!yesterdayCompleted) {
        // If neither yesterday nor today is complete, reset streak
        streakCount = 0;
    }
    
    saveData();
}

// Add event listeners to checkboxes
prayers.forEach(prayer => {
    const checkbox = document.getElementById(prayer);
    checkbox.addEventListener('change', () => {
        // Ensure today's data exists
        initializeTodayData();
        
        prayerData[todayStr][prayer] = checkbox.checked;
        saveData();
        updateStreak();
    });
});

// Reset today's data
document.getElementById('resetButton').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset today\'s prayers?')) {
        // Ensure today's data exists
        initializeTodayData();
        
        prayers.forEach(prayer => {
            prayerData[todayStr][prayer] = false;
        });
        saveData();
        updateStreak();
    }
});

// Clear all data
document.getElementById('clearDataButton').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear ALL prayer data? This cannot be undone.')) {
        localStorage.removeItem('prayerData');
        localStorage.removeItem('streakCount');
        localStorage.removeItem('lastStreakUpdate');
        
        prayerData = {};
        initializeTodayData();
        
        streakCount = 0;
        updateUI();
    }
});

// Initialize the app
loadData();