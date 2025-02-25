// Initialize variables
const prayers = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];
let prayerData = {};
let streakCount = 0;
let currentDate = new Date();
let selectedDateStr = formatDate(currentDate);
const tooltip = document.getElementById('tooltip');

// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Parse date from YYYY-MM-DD
function parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Format date for display
function formatDateForDisplay(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// Get short month name
function getShortMonthName(monthIndex) {
    const date = new Date();
    date.setMonth(monthIndex);
    return date.toLocaleString('default', { month: 'short' });
}

// Initialize data for a specific date
function initializeDateData(dateStr) {
    if (!prayerData[dateStr]) {
        prayerData[dateStr] = {
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

    // Initialize data for selected date
    initializeDateData(selectedDateStr);

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
    renderCalendar();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('prayerData', JSON.stringify(prayerData));
    localStorage.setItem('streakCount', streakCount.toString());
    updateUI();
    renderCalendar();
}

// Update UI elements
function updateUI() {
    // Ensure selected date data exists
    initializeDateData(selectedDateStr);
    
    // Update date display
    document.getElementById('currentDate').textContent = formatDateForDisplay(parseDate(selectedDateStr));
    
    // Update checkboxes
    prayers.forEach(prayer => {
        const checkbox = document.getElementById(prayer);
        checkbox.checked = prayerData[selectedDateStr][prayer];
    });

    // Update streak count
    document.getElementById('streakCount').textContent = streakCount;

    // Update selected day's count
    const completedSelectedDay = prayers.filter(prayer => prayerData[selectedDateStr][prayer]).length;
    document.getElementById('todayCount').textContent = `${completedSelectedDay}/5`;

    // Calculate and update weekly average
    const weeklyAverage = calculatePeriodAverage(7);
    document.getElementById('weeklyAverage').textContent = `${weeklyAverage}%`;

    // Calculate and update monthly average
    const monthlyAverage = calculatePeriodAverage(30);
    document.getElementById('monthlyAverage').textContent = `${monthlyAverage}%`;
    
    // Calculate total prayers completed
    const totalPrayers = calculateTotalPrayers();
    document.getElementById('totalPrayersCount').textContent = totalPrayers;
    
    // Disable or enable navigation buttons
    const today = new Date();
    const todayStr = formatDate(today);
    
    // Can't navigate to future dates
    document.getElementById('nextDayBtn').disabled = selectedDateStr >= todayStr;
}

// Calculate total prayers completed
function calculateTotalPrayers() {
    let total = 0;
    for (const dateStr in prayerData) {
        prayers.forEach(prayer => {
            if (prayerData[dateStr][prayer]) {
                total++;
            }
        });
    }
    return total;
}

// Calculate average completion for a period
function calculatePeriodAverage(days) {
    const endDate = new Date();
    let totalPrayers = 0;
    let completedPrayers = 0;
    
    for (let i = 0; i < days; i++) {
        const date = new Date(endDate);
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

// Calculate completion level for a date (0-4)
function getCompletionLevel(dateStr) {
    if (!prayerData[dateStr]) return 0;
    
    const completed = prayers.filter(prayer => prayerData[dateStr][prayer]).length;
    
    if (completed === 0) return 0;
    if (completed === 1) return 1;
    if (completed === 2) return 2;
    if (completed <= 4) return 3;
    return 4; // All 5 prayers completed
}

// Render calendar
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonthLabels = document.getElementById('calendarMonthLabels');
    
    // Clear existing calendar
    calendarGrid.innerHTML = '';
    calendarMonthLabels.innerHTML = '';
    
    // Calculate start and end dates for our calendar
    // Show last 365 days
    const endDate = new Date(); // Today
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 364); // Start 364 days before today
    
    // Get the first Monday before or on our start date
    const firstMonday = new Date(startDate);
    while (firstMonday.getDay() !== 1) { // 1 is Monday
        firstMonday.setDate(firstMonday.getDate() - 1);
    }
    
    // Create month labels
    const months = [];
    let currentMonth = -1;
    
    for (let d = new Date(firstMonday); d <= endDate; d.setDate(d.getDate() + 7)) {
        const month = d.getMonth();
        if (month !== currentMonth) {
            currentMonth = month;
            months.push({ 
                month: month, 
                index: Math.floor((d - firstMonday) / (86400000 * 7)) // Position in weeks from start
            });
        }
    }
    
    // Calculate grid width in weeks
    const totalWeeks = Math.ceil((endDate - firstMonday) / (86400000 * 7)) + 1;
    
    // Add month labels
    const monthLabelWidth = 100 / months.length;
    const monthLabelsHTML = months.map((m, i) => {
        const nextPosition = i < months.length - 1 ? months[i + 1].index : totalWeeks;
        const width = ((nextPosition - m.index) / totalWeeks) * 100;
        return `<div class="calendar-month-label" style="width: ${width}%;">${getShortMonthName(m.month)}</div>`;
    }).join('');
    
    calendarMonthLabels.innerHTML = monthLabelsHTML;
    
    // Fill in the grid cells
    for (let d = new Date(firstMonday); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        const level = getCompletionLevel(dateStr);
        const isSelected = dateStr === selectedDateStr;
        const isPast = d <= endDate;
        
        const cellElement = document.createElement('div');
        cellElement.className = `calendar-cell level-${level}${isSelected ? ' selected' : ''}`;
        cellElement.dataset.date = dateStr;
        
        if (isPast) {
            cellElement.addEventListener('click', () => {
                selectDate(dateStr);
            });
            
            // Show tooltip on hover
            cellElement.addEventListener('mouseenter', (e) => {
                const completed = prayerData[dateStr] ? 
                    prayers.filter(prayer => prayerData[dateStr][prayer]).length : 0;
                
                tooltip.innerHTML = `
                    <div>${formatDateForDisplay(parseDate(dateStr))}</div>
                    <div>${completed} prayers completed</div>
                `;
                
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY + 10}px`;
            });
            
            cellElement.addEventListener('mousemove', (e) => {
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY + 10}px`;
            });
            
            cellElement.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
        
        calendarGrid.appendChild(cellElement);
    }
}

// Select a date
function selectDate(dateStr) {
    selectedDateStr = dateStr;
    updateUI();
    renderCalendar();
}

// Navigate to the previous day
function navigateToPreviousDay() {
    const selected = parseDate(selectedDateStr);
    selected.setDate(selected.getDate() - 1);
    selectedDateStr = formatDate(selected);
    updateUI();
    renderCalendar();
}

// Navigate to the next day
function navigateToNextDay() {
    const selected = parseDate(selectedDateStr);
    const today = new Date();
    
    // Don't navigate beyond today
    if (selected < today) {
        selected.setDate(selected.getDate() + 1);
        selectedDateStr = formatDate(selected);
        updateUI();
        renderCalendar();
    }
}

// Navigate to today
function navigateToToday() {
    selectedDateStr = formatDate(new Date());
    updateUI();
    renderCalendar();
}

// Check and update streak
function updateStreak() {
    // Calculate streak based on consecutive days with all prayers completed
    const today = new Date();
    let currentStreak = 0;
    
    // Start from today and go backwards
    for (let i = 0; ; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateStr = formatDate(checkDate);
        
        // Check if all prayers were completed on this day
        const allCompleted = prayerData[checkDateStr] && 
            prayers.every(prayer => prayerData[checkDateStr][prayer]);
        
        if (allCompleted) {
            currentStreak++;
        } else {
            // Break when we find a day without all prayers completed
            break;
        }
    }
    
    streakCount = currentStreak;
    saveData();
}

// Add event listeners to checkboxes
prayers.forEach(prayer => {
    const checkbox = document.getElementById(prayer);
    checkbox.addEventListener('change', () => {
        // Ensure data exists for the selected date
        initializeDateData(selectedDateStr);
        
        prayerData[selectedDateStr][prayer] = checkbox.checked;
        
        // Only update streak when modifying today's data
        const todayStr = formatDate(new Date());
        if (selectedDateStr === todayStr) {
            updateStreak();
        } else {
            saveData();
        }
    });
});

// Reset current day's data
document.getElementById('resetButton').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset this day\'s prayers?')) {
        // Ensure data exists for the selected date
        initializeDateData(selectedDateStr);
        
        prayers.forEach(prayer => {
            prayerData[selectedDateStr][prayer] = false;
        });
        
        // Only update streak when modifying today's data
        const todayStr = formatDate(new Date());
        if (selectedDateStr === todayStr) {
            updateStreak();
        } else {
            saveData();
        }
    }
});

// Navigate to today
document.getElementById('todayButton').addEventListener('click', navigateToToday);

// Clear all data
document.getElementById('clearDataButton').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear ALL prayer data? This cannot be undone.')) {
        localStorage.removeItem('prayerData');
        localStorage.removeItem('streakCount');
        localStorage.removeItem('lastStreakUpdate');
        
        prayerData = {};
        initializeDateData(selectedDateStr);
        
        streakCount = 0;
        updateUI();
        renderCalendar();
    }
});

// Add event listeners for navigation buttons
document.getElementById('prevDayBtn').addEventListener('click', navigateToPreviousDay);
document.getElementById('nextDayBtn').addEventListener('click', navigateToNextDay);

// Initialize the app
loadData();