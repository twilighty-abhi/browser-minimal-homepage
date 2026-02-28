// ============================================
// CONSTANTS & DEFAULT DATA
// ============================================

const DEFAULT_QUICK_LINKS = [
    { name: 'Gmail', icon: 'mail', url: 'https://mail.google.com', colorVar: '--link-gmail' },
    { name: 'GitHub', icon: 'code', url: 'https://github.com', colorVar: '--link-github' },
    { name: 'Notion', icon: 'article', url: 'https://notion.so', colorVar: '--link-notion' },
    { name: 'YouTube', icon: 'smart_display', url: 'https://youtube.com', colorVar: '--link-youtube' },
    { name: 'LinkedIn', icon: 'work', url: 'https://linkedin.com', colorVar: '--link-linkedin' },
    { name: 'Calendar', icon: 'calendar_month', url: 'https://calendar.google.com', colorVar: '--link-calendar' }
];

const DEFAULT_GOALS = [
    { text: 'Finish mockup', completed: false },
    { text: 'Review PRs', completed: false },
    { text: 'Team Standup', completed: false }
];

const DEFAULT_FOCUS_MINUTES = 25;

// ============================================
// STATE MANAGEMENT
// ============================================

let timerInterval = null;
let timerSecondsLeft = 0;
let timerRunning = false;
let focusDuration = DEFAULT_FOCUS_MINUTES * 60;
let isEditingGoals = false;

// ============================================
// STORAGE UTILITIES
// ============================================

function getFromStorage(key, defaultValue) {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
}

function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ============================================
// THEME MANAGEMENT
// ============================================

function initTheme() {
    const theme = getFromStorage('theme', 'dark');
    applyTheme(theme);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

function applyTheme(theme) {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    if (theme === 'dark') {
        html.classList.add('dark');
        themeIcon.textContent = 'dark_mode';
    } else {
        html.classList.remove('dark');
        themeIcon.textContent = 'light_mode';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.classList.contains('dark') ? 'light' : 'dark';
    saveToStorage('theme', newTheme);
    applyTheme(newTheme);
}

// ============================================
// TIME & GREETING (with dynamic name)
// ============================================

function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    document.getElementById('header-time').textContent =
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    updateGreeting(hours);
    updateDate(now);
}

function updateProgressBars(now) {
    const hours = now.getHours();
    const mins = now.getMinutes();
    const secs = now.getSeconds();

    // Day progress
    const dayPct = ((hours * 3600 + mins * 60 + secs) / 86400) * 100;

    // Week progress (Mon=0 … Sun=6)
    const jsDay = now.getDay();
    const weekDay = jsDay === 0 ? 6 : jsDay - 1;
    const weekPct = ((weekDay * 86400 + hours * 3600 + mins * 60 + secs) / (7 * 86400)) * 100;

    // Month progress
    const dom = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthPct = (((dom - 1) * 86400 + hours * 3600 + mins * 60 + secs) / (daysInMonth * 86400)) * 100;

    // Year progress
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diffMs = now - startOfYear;
    const dayOfYear = Math.floor(diffMs / 86400000);
    const daysInYear = ((now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0) ? 366 : 365;
    const yearPct = (dayOfYear / daysInYear) * 100;

    document.getElementById('day-progress-fill').style.width = `${dayPct.toFixed(1)}%`;

    setProgress('pt-day', dayPct);
    setProgress('pt-week', weekPct);
    setProgress('pt-month', monthPct);
    setProgress('pt-year', yearPct);
}

function setProgress(prefix, pct) {
    const clamped = Math.min(100, Math.max(0, pct));
    document.getElementById(prefix).style.width = `${clamped.toFixed(1)}%`;
    document.getElementById(`${prefix}-pct`).textContent = `${Math.floor(clamped)}%`;
}

function updateGreeting(hours) {
    let greeting = 'Good Evening';
    if (hours >= 5 && hours < 12) greeting = 'Good Morning';
    else if (hours >= 12 && hours < 18) greeting = 'Good Afternoon';

    const name = getFromStorage('userName', '');
    document.getElementById('greeting').textContent =
        name ? `${greeting}, ${name}` : greeting;
}

function updateDate(date) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent =
        date.toLocaleDateString('en-US', options);
}

function initClock() {
    updateTime();
    updateProgressBars(new Date());
    setInterval(updateTime, 1000);
    setInterval(() => updateProgressBars(new Date()), 60000);
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function initSearch() {
    const searchInput = document.getElementById('search-input');

    // Chromium browsers force-focus the omnibox on new-tab override pages.
    // We fight back with repeated attempts and capture stray keystrokes.
    const grabFocus = () => searchInput.focus();
    grabFocus();
    setTimeout(grabFocus, 200);
    setTimeout(grabFocus, 600);

    // Reclaim on any click on the page background.
    document.addEventListener('click', (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') return;
        if (e.target.closest('a, button, input, textarea, .settings-panel')) return;
        grabFocus();
    });

    // Reclaim when page/window regains visibility.
    window.addEventListener('focus', grabFocus);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) grabFocus();
    });

    // Forward stray keystrokes to the search bar.
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key === 'Tab' || e.key === 'Escape') return;
        const active = document.activeElement;
        const tag = active.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.key.length === 1) {
            searchInput.focus();
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(searchInput.value.trim());
    });
}

function handleSearch(query) {
    if (!query) return;
    if (isValidURL(query)) {
        window.location.href = query.startsWith('http') ? query : `https://${query}`;
    } else {
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
}

function isValidURL(string) {
    if (/^https?:\/\//i.test(string)) return true;
    if (/^localhost(:\d+)?/.test(string)) return true;
    if (/^[\w-]+(\.[\w-]+)+/.test(string) && /\.[a-z]{2,}$/i.test(string)) return true;
    return false;
}

// ============================================
// QUICK LINKS (homescreen — no edit button)
// ============================================

function initQuickLinks() {
    const links = getFromStorage('quickLinks', DEFAULT_QUICK_LINKS);
    renderQuickLinks(links);
}

function renderQuickLinks(links) {
    const container = document.getElementById('quick-links-container');
    container.innerHTML = '';
    const count = links.length;
    container.style.gridTemplateColumns = `repeat(${Math.min(count, 8)}, 1fr)`;
    links.forEach((link) => {
        container.appendChild(createQuickLinkElement(link));
    });
}

function createQuickLinkElement(link) {
    const a = document.createElement('a');
    a.href = link.url;
    a.className = 'quick-link';

    const hoverColor = link.colorVar ? `var(${link.colorVar})` : 'var(--primary)';

    a.innerHTML = `
        <div class="quick-link-btn">
            <span class="material-symbols-outlined">${link.icon}</span>
        </div>
        <span class="quick-link-label">${link.name}</span>
    `;

    const btn = a.querySelector('.quick-link-btn');
    a.addEventListener('mouseenter', () => { btn.style.color = hoverColor; });
    a.addEventListener('mouseleave', () => { btn.style.color = ''; });

    return a;
}

// ============================================
// SETTINGS PANEL
// ============================================

function initSettings() {
    document.getElementById('settings-toggle').addEventListener('click', openSettings);
    document.getElementById('settings-close').addEventListener('click', closeSettings);
    document.getElementById('settings-overlay').addEventListener('click', closeSettings);
    document.getElementById('settings-save').addEventListener('click', saveAllSettings);
    document.getElementById('add-link-btn').addEventListener('click', addNewLinkRow);
    document.getElementById('reset-all-btn').addEventListener('click', resetAllData);
}

function openSettings() {
    document.getElementById('settings-name').value = getFromStorage('userName', '');
    document.getElementById('settings-timer-duration').value = getFromStorage('focusMinutes', DEFAULT_FOCUS_MINUTES);
    document.getElementById('settings-session-count').textContent = getFromStorage('focusSessions', 0);

    renderSettingsLinks();
    renderSettingsGoals();

    document.getElementById('settings-panel').classList.remove('hidden');
    document.getElementById('settings-overlay').classList.remove('hidden');
    requestAnimationFrame(() => {
        document.getElementById('settings-panel').classList.add('open');
        document.getElementById('settings-overlay').classList.add('open');
    });
}

function closeSettings() {
    document.getElementById('settings-panel').classList.remove('open');
    document.getElementById('settings-overlay').classList.remove('open');
    setTimeout(() => {
        document.getElementById('settings-panel').classList.add('hidden');
        document.getElementById('settings-overlay').classList.add('hidden');
    }, 300);
}

// --- Settings: Quick Links ---

function renderSettingsLinks() {
    const links = getFromStorage('quickLinks', DEFAULT_QUICK_LINKS);
    const list = document.getElementById('settings-links-list');
    list.innerHTML = '';
    links.forEach((link, index) => {
        list.appendChild(createSettingsLinkRow(link, index));
    });
}

function createSettingsLinkRow(link, index) {
    const row = document.createElement('div');
    row.className = 'settings-link-row';
    row.dataset.index = index;

    row.innerHTML = `
        <div class="form-group form-group-compact">
            <input type="text" value="${link.name}" data-field="name" placeholder="Name">
        </div>
        <div class="form-group form-group-compact">
            <input type="text" value="${link.icon}" data-field="icon" placeholder="Icon name">
        </div>
        <div class="form-group form-group-wide">
            <input type="url" value="${link.url}" data-field="url" placeholder="https://...">
        </div>
        <button class="btn-icon-delete" title="Remove link">
            <span class="material-symbols-outlined">delete</span>
        </button>
    `;

    row.querySelector('.btn-icon-delete').addEventListener('click', () => {
        row.remove();
    });

    return row;
}

function addNewLinkRow() {
    const list = document.getElementById('settings-links-list');
    const index = list.children.length;
    const newLink = { name: '', icon: 'link', url: '', colorVar: '' };
    list.appendChild(createSettingsLinkRow(newLink, index));
    const lastRow = list.lastElementChild;
    lastRow.querySelector('input[data-field="name"]').focus();
}

// --- Settings: Goals ---

function renderSettingsGoals() {
    const goals = getFromStorage('dailyGoals', DEFAULT_GOALS);
    const list = document.getElementById('settings-goals-list');
    list.innerHTML = '';
    goals.forEach((goal, index) => {
        const row = document.createElement('div');
        row.className = 'settings-goal-row';
        row.innerHTML = `
            <span class="settings-goal-number">${index + 1}</span>
            <input type="text" class="goal-edit-input" value="${goal.text}" placeholder="Goal ${index + 1}">
        `;
        list.appendChild(row);
    });
}

// --- Settings: Save All ---

function saveAllSettings() {
    // Save name
    const name = document.getElementById('settings-name').value.trim();
    saveToStorage('userName', name);

    // Save timer duration
    const minutes = parseInt(document.getElementById('settings-timer-duration').value) || DEFAULT_FOCUS_MINUTES;
    saveToStorage('focusMinutes', minutes);
    focusDuration = minutes * 60;
    if (!timerRunning) {
        timerSecondsLeft = focusDuration;
        updateTimerDisplay();
        saveToStorage('timerSecondsLeft', timerSecondsLeft);
    }

    // Save quick links
    const linkRows = document.querySelectorAll('#settings-links-list .settings-link-row');
    const newLinks = [];
    linkRows.forEach(row => {
        const nameVal = row.querySelector('input[data-field="name"]').value.trim();
        const iconVal = row.querySelector('input[data-field="icon"]').value.trim() || 'link';
        const urlVal = row.querySelector('input[data-field="url"]').value.trim();
        if (nameVal && urlVal) {
            newLinks.push({ name: nameVal, icon: iconVal, url: urlVal, colorVar: '' });
        }
    });
    saveToStorage('quickLinks', newLinks);
    renderQuickLinks(newLinks);

    // Save goals
    const goalInputs = document.querySelectorAll('#settings-goals-list .goal-edit-input');
    const currentGoals = getFromStorage('dailyGoals', DEFAULT_GOALS);
    goalInputs.forEach((input, index) => {
        if (currentGoals[index]) {
            currentGoals[index].text = input.value.trim() || `Goal ${index + 1}`;
        }
    });
    saveToStorage('dailyGoals', currentGoals);
    renderGoals(currentGoals);

    // Update greeting immediately
    updateGreeting(new Date().getHours());

    closeSettings();
}

// --- Settings: Reset ---

function resetAllData() {
    if (confirm('This will reset all your data (links, goals, name, timer). Continue?')) {
        localStorage.clear();
        location.reload();
    }
}

// ============================================
// FOCUS TIMER
// ============================================

function initTimer() {
    const savedMinutes = getFromStorage('focusMinutes', DEFAULT_FOCUS_MINUTES);
    focusDuration = savedMinutes * 60;
    const savedTime = getFromStorage('timerSecondsLeft', focusDuration);
    timerSecondsLeft = savedTime;

    updateTimerDisplay();

    document.getElementById('timer-play').addEventListener('click', toggleTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);
}

function toggleTimer() {
    const playBtn = document.getElementById('timer-play');
    const icon = playBtn.querySelector('.material-symbols-outlined');

    if (timerRunning) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        icon.textContent = 'play_arrow';
        playBtn.classList.remove('active');
    } else {
        timerRunning = true;
        icon.textContent = 'pause';
        playBtn.classList.add('active');

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        timerInterval = setInterval(() => {
            timerSecondsLeft--;
            updateTimerDisplay();
            saveToStorage('timerSecondsLeft', timerSecondsLeft);

            if (timerSecondsLeft <= 0) {
                timerSecondsLeft = 0;
                updateTimerDisplay();
                const sessionCount = getFromStorage('focusSessions', 0);
                saveToStorage('focusSessions', sessionCount + 1);
                showTimerNotification();
                resetTimer();
            }
        }, 1000);
    }
}

function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerRunning = false;
    timerSecondsLeft = focusDuration;

    const playBtn = document.getElementById('timer-play');
    const icon = playBtn.querySelector('.material-symbols-outlined');
    icon.textContent = 'play_arrow';
    playBtn.classList.remove('active');

    updateTimerDisplay();
    saveToStorage('timerSecondsLeft', timerSecondsLeft);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSecondsLeft / 60);
    const seconds = timerSecondsLeft % 60;
    document.getElementById('timer-display').textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function showTimerNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Session Complete!', {
            body: 'Great job! Time for a break.',
            icon: 'icon48.png'
        });
    }
}

// ============================================
// DAILY GOALS (footer bar)
// ============================================

function initGoals() {
    const goals = getFromStorage('dailyGoals', DEFAULT_GOALS);
    const today = new Date().toDateString();
    const lastUpdate = getFromStorage('goalsLastUpdate', '');

    if (lastUpdate !== today) {
        const resetGoals = goals.map(g => ({ ...g, completed: false }));
        saveToStorage('dailyGoals', resetGoals);
        saveToStorage('goalsLastUpdate', today);
        renderGoals(resetGoals);
    } else {
        renderGoals(goals);
    }

    document.getElementById('edit-goals').addEventListener('click', handleGoalEditToggle);
}

function renderGoals(goals) {
    const container = document.getElementById('goals-container');
    container.innerHTML = '';
    isEditingGoals = false;

    const editBtn = document.getElementById('edit-goals');
    if (editBtn) editBtn.textContent = 'Edit';

    goals.forEach((goal, index) => {
        const label = document.createElement('label');
        label.className = 'goal-item';
        const checked = goal.completed ? 'checked' : '';

        label.innerHTML = `
            <input type="checkbox" ${checked} class="goal-checkbox">
            <span class="goal-text">${goal.text}</span>
        `;

        label.querySelector('input').addEventListener('change', () => {
            const allGoals = getFromStorage('dailyGoals', DEFAULT_GOALS);
            allGoals[index].completed = !allGoals[index].completed;
            saveToStorage('dailyGoals', allGoals);
        });

        container.appendChild(label);
    });
}

function handleGoalEditToggle() {
    if (isEditingGoals) {
        // Save mode
        const container = document.getElementById('goals-container');
        const inputs = container.querySelectorAll('.goal-edit-input');
        const goals = getFromStorage('dailyGoals', DEFAULT_GOALS);

        inputs.forEach((input, index) => {
            if (goals[index]) {
                goals[index].text = input.value.trim() || goals[index].text;
            }
        });

        saveToStorage('dailyGoals', goals);
        renderGoals(goals);
    } else {
        // Enter edit mode
        isEditingGoals = true;
        const goals = getFromStorage('dailyGoals', DEFAULT_GOALS);
        const container = document.getElementById('goals-container');
        container.innerHTML = '';

        goals.forEach((goal) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'goal-edit-wrapper';
            const input = document.createElement('input');
            input.type = 'text';
            input.value = goal.text;
            input.className = 'goal-edit-input';
            wrapper.appendChild(input);
            container.appendChild(wrapper);
        });

        document.getElementById('edit-goals').textContent = 'Save';
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initClock();
    initSearch();
    initQuickLinks();
    initTimer();
    initGoals();
    initSettings();
});