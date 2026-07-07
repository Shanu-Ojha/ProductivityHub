// ========== APPLICATION STATE & STORAGE ==========
const state = {
    todos: [],
    planner: {},
    goals: [],
    currentFeature: null,
    theme: 'light',
    userLocation: null,
    locationPermissionAsked: false,
    pomodoro: {
        isRunning: false,
        timeLeft: 25 * 60,
        workDuration: 25,
        breakDuration: 5,
        isWorkSession: true,
        intervalId: null
    }
};

const STORAGE_KEYS = {
    TODOS: 'productivityDashboard_todos',
    PLANNER: 'productivityDashboard_planner',
    GOALS: 'productivityDashboard_goals',
    THEME: 'productivityDashboard_theme',
    USER_LOCATION: 'productivityDashboard_userLocation',
    LOCATION_PERMISSION_ASKED: 'productivityDashboard_locationPermissionAsked'
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupTheme();
    setupDynamicBackground();
    setupBackgroundVideo();
    setupNavigation();
    setupLocationModal();
    setupTodoList();
    setupPlanner();
    setupGoals();
    setupPomodoro();
    setupQuotes();
    setupDateTimeDisplay();
    fetchWeather();

    // Request location permission
    requestLocationPermission();

    // Update date/time every second
    setInterval(updateDateTime, 1000);

    // Update dynamic background every minute
    setInterval(updateDynamicBackground, 60 * 1000);

    // Re-fetch weather every 30 minutes
    setInterval(fetchWeather, 30 * 60 * 1000);
});

// ========== LOAD & SAVE STATE ==========
function loadState() {
    const savedTodos = localStorage.getItem(STORAGE_KEYS.TODOS);
    const savedPlanner = localStorage.getItem(STORAGE_KEYS.PLANNER);
    const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const savedLocation = localStorage.getItem(STORAGE_KEYS.USER_LOCATION);
    const savedLocationPermissionAsked = localStorage.getItem(STORAGE_KEYS.LOCATION_PERMISSION_ASKED);

    if (savedTodos) state.todos = JSON.parse(savedTodos);
    if (savedPlanner) state.planner = JSON.parse(savedPlanner);
    if (savedGoals) state.goals = JSON.parse(savedGoals);
    if (savedTheme) state.theme = savedTheme;
    if (savedLocation) state.userLocation = JSON.parse(savedLocation);
    if (savedLocationPermissionAsked) state.locationPermissionAsked = JSON.parse(savedLocationPermissionAsked);
}

function saveState() {
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(state.todos));
    localStorage.setItem(STORAGE_KEYS.PLANNER, JSON.stringify(state.planner));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
    localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    if (state.userLocation) {
        localStorage.setItem(STORAGE_KEYS.USER_LOCATION, JSON.stringify(state.userLocation));
    }
    localStorage.setItem(STORAGE_KEYS.LOCATION_PERMISSION_ASKED, JSON.stringify(state.locationPermissionAsked));
}

// ========== DYNAMIC BACKGROUND ==========
function setupDynamicBackground() {
    updateDynamicBackground();
}

function updateDynamicBackground() {
    const now = new Date();
    const hour = now.getHours();
    const body = document.body;

    // Remove all time classes
    body.classList.remove('time-morning', 'time-afternoon', 'time-evening', 'time-night');

    // Add appropriate time class
    if (hour >= 5 && hour < 11) {
        body.classList.add('time-morning');
    } else if (hour >= 11 && hour < 17) {
        body.classList.add('time-afternoon');
    } else if (hour >= 17 && hour < 20) {
        body.classList.add('time-evening');
    } else {
        body.classList.add('time-night');
    }
}

// ========== BACKGROUND VIDEO ==========
function setupBackgroundVideo() {
    const bgVideoOverlay = document.getElementById('bgVideoOverlay');
    const bgVideo = document.getElementById('bgVideo');
    const dashboard = document.getElementById('dashboard');

    function updateVideoSource() {
        const now = new Date();
        const hour = now.getHours();

        let videoSrc = '';

        if (hour >= 5 && hour < 11) {
            videoSrc = './video/morning.mp4';
        } 
        else if (hour >= 11 && hour < 17) {
            videoSrc = './video/afternoon.mp4';
        } 
        else if (hour >= 17 && hour < 20) {
            videoSrc = './video/evening.mp4';
        } 
        else {
            videoSrc = './video/night.mp4';
        }

        // Change source only if needed
        if (bgVideo.src !== videoSrc) {
            bgVideo.src = videoSrc;
            bgVideo.load();
        }
    }

    // Set initial video
    updateVideoSource();

    // Update every minute
    setInterval(updateVideoSource, 60000);

    dashboard.addEventListener('mouseenter', () => {
        if (!state.currentFeature) {
            updateVideoSource();
            bgVideoOverlay.classList.add('active');
            bgVideo.play();
        }
    });

    dashboard.addEventListener('mouseleave', () => {
        bgVideoOverlay.classList.remove('active');
        bgVideo.pause();
        bgVideo.currentTime = 0;
    });
}

// ========== LOCATION MODAL ==========
function setupLocationModal() {
    const modal = document.getElementById('locationModal');
    const allowBtn = document.getElementById('allowLocationBtn');
    const denyBtn = document.getElementById('denyLocationBtn');
    const closeBtn = document.querySelector('.modal-close');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            state.locationPermissionAsked = true;
            saveState();
        });
    }

    allowBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        state.locationPermissionAsked = true;
        saveState();

        // Request geolocation with timeout
        if ('geolocation' in navigator) {
            const geolocationTimeout = setTimeout(() => {
                console.warn('Geolocation request timed out. Using default location.');
                state.userLocation = {
                    latitude: 26.8467,  // Lucknow
                    longitude: 80.9462,
                    timestamp: Date.now()
                };
                saveState();
                fetchWeather();
            }, 10000); // 10 second timeout

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(geolocationTimeout);
                    state.userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        timestamp: Date.now()
                    };
                    saveState();
                    console.log('Location obtained:', state.userLocation);
                    fetchWeather();
                },
                (error) => {
                    clearTimeout(geolocationTimeout);
                    console.error('Geolocation error:', error.message);
                    // Use default location (Lucknow)
                    state.userLocation = {
                        latitude: 26.8467,
                        longitude: 80.9462,
                        timestamp: Date.now()
                    };
                    saveState();
                    fetchWeather();
                },
                {
                    enableHighAccuracy: false,
                    timeout: 8000,
                    maximumAge: 3600000 // Cache location for 1 hour
                }
            );
        }
    });

    denyBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        state.locationPermissionAsked = true;
        saveState();
        // Use default location (Lucknow)
        state.userLocation = {
            latitude: 26.8467,
            longitude: 80.9462,
            timestamp: Date.now()
        };
        saveState();
        fetchWeather();
    });
}

function requestLocationPermission() {
    const modal = document.getElementById('locationModal');

    // Check if geolocation is available and supported
    if (!('geolocation' in navigator)) {
        console.warn('Geolocation not supported. Using default location.');
        state.userLocation = {
            latitude: 26.8467,  // Lucknow
            longitude: 80.9462,
            timestamp: Date.now()
        };
        state.locationPermissionAsked = true;
        saveState();
        fetchWeather();
        return;
    }

    // Only show modal once per session or if not asked before
    if (!state.locationPermissionAsked && !state.userLocation) {
        setTimeout(() => {
            modal.classList.add('active');
        }, 500); // Reduced delay for better UX on GitHub Pages
    } else if (!state.userLocation) {
        // Use default location (Lucknow)
        state.userLocation = {
            latitude: 26.8467,
            longitude: 80.9462,
            timestamp: Date.now()
        };
        fetchWeather();
    }
}

// ========== THEME SWITCHING ==========
function setupTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    // Apply saved theme
    if (state.theme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    } else {
        html.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
    }

    themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';

        if (state.theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
        } else {
            html.removeAttribute('data-theme');
            themeToggle.textContent = '🌙';
        }

        saveState();
    });
}

// ========== NAVIGATION ==========
function setupNavigation() {
    const featureCards = document.querySelectorAll('.feature-card');
    const backButtons = document.querySelectorAll('.back-btn');
    const dashboard = document.getElementById('dashboard');
    const featureViewContainer = document.getElementById('featureViewContainer');

    // Open feature
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            const featureName = card.getAttribute('data-feature');
            openFeature(featureName);
        });
    });

    // Close feature (back button)
    backButtons.forEach(btn => {
        btn.addEventListener('click', closeFeature);
    });

    // Keyboard shortcut: Escape to go back
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.currentFeature) {
            closeFeature();
        }
    });

    function openFeature(featureName) {
        state.currentFeature = featureName;
        dashboard.classList.remove('active');
        featureViewContainer.classList.add('active');

        // Stop background video when navigating away
        const bgVideoOverlay = document.getElementById('bgVideoOverlay');
        const bgVideo = document.getElementById('bgVideo');
        bgVideoOverlay.classList.remove('active');
        bgVideo.pause();
        bgVideo.currentTime = 0;

        // Show the correct feature view
        document.querySelectorAll('.feature-view').forEach(view => {
            view.classList.remove('active');
        });

        const featureView = document.getElementById(`${featureName}Feature`);
        if (featureView) {
            featureView.classList.add('active');
        }
    }

    function closeFeature() {
        // Stop Pomodoro if running
        if (state.currentFeature === 'pomodoro' && state.pomodoro.isRunning) {
            pauseTimer();
        }

        state.currentFeature = null;
        featureViewContainer.classList.remove('active');
        dashboard.classList.add('active');
        saveState();

        // Background video will auto-play on hover again if user hovers over dashboard
    }
}

// ========== DATE & TIME DISPLAY ==========
function setupDateTimeDisplay() {
    updateDateTime();
}

function updateDateTime() {
    const now = new Date();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12

    const timeString = `${hours}:${minutes} ${ampm}`;


    // Date (e.g., "Mon, Jan 1")
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const dateString = `${dayName}, ${monthName} ${date}`;

    document.getElementById('timeDisplay').textContent = timeString;
    document.getElementById('dateDisplay').textContent = dateString;
}

// ========== WEATHER WIDGET ==========
async function fetchWeather() {
    try {
        console.log("fetchWeather called");
        // Use user location if available
        let latitude = 28.7041; // Default: Delhi
        let longitude = 77.1025;
        let locationName = 'Delhi';

        if (state.userLocation) {
            latitude = state.userLocation.latitude;
            longitude = state.userLocation.longitude;
            console.log(latitude, longitude)
        }

        // Get location name from reverse geocoding (optional)
        try {
            const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                locationName = geoData.address.state_district || geoData.address?.town ||
                    geoData.address?.county || 'Your Location';
            }
        } catch (e) {
            console.log('Reverse geocoding not available');
        }

        // Use Open-Meteo API (no API key needed)
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
        );

        if (!response.ok) throw new Error('Weather API failed');

        const data = await response.json();
        const current = data.current;

        // Map WMO weather codes to descriptions
        const weatherDescriptions = {
            0: 'Clear Sky',
            1: 'Mostly Clear',
            2: 'Partly Cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Foggy',
            51: 'Light Drizzle',
            53: 'Moderate Drizzle',
            55: 'Dense Drizzle',
            61: 'Slight Rain',
            63: 'Moderate Rain',
            65: 'Heavy Rain',
            80: 'Slight Rain Showers',
            81: 'Moderate Rain Showers',
            82: 'Violent Rain Showers',
            85: 'Light Snow Showers',
            86: 'Heavy Snow Showers',
            95: 'Thunderstorm'
        };

        const description = weatherDescriptions[current.weather_code] || 'Unknown';

        const weatherHTML = `
            <div class="weather-item">
                <div class="weather-location">📍${locationName}</div>
            </div>
            <div class="weather-item">
                <div class="weather-label">Temperature</div>
                <div class="weather-value">${Math.round(current.temperature_2m)}°C</div>
            </div>
            <div class="weather-item">
                <div class="weather-label">Condition</div>
                <div class="weather-condition">${description}</div>
            </div>
            <div class="weather-item">
                <div class="weather-label">Humidity</div>
                <div class="weather-value">${current.relative_humidity_2m}%</div>
            </div>
            <div class="weather-item">
                <div class="weather-label">Wind Speed</div>
                <div class="weather-value">${Math.round(current.wind_speed_10m)} km/h</div>
            </div>
        `;

        document.getElementById('weatherWidget').innerHTML = weatherHTML;
    } catch (error) {
        console.error('Weather fetch error:', error);
        document.getElementById('weatherWidget').innerHTML =
            '<div class="weather-loading">Unable to load weather</div>';
    }
}

// ========== TODO LIST ==========
function setupTodoList() {
    const todoInput = document.getElementById('todoInput');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoList = document.getElementById('todoList');

    // Initial render
    renderTodos();

    // Add todo on button click
    addTodoBtn.addEventListener('click', addTodo);

    // Add todo on Enter key
    todoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    // Event delegation - added ONLY ONCE
    todoList.addEventListener('change', (e) => {
        if (e.target.classList.contains('todo-checkbox')) {
            const id = Number(e.target.dataset.id);
            toggleTodo(id);
        }
    });

    todoList.addEventListener('click', (e) => {
        const btn = e.target.closest('.todo-btn');
        if (!btn) return;

        const id = Number(btn.dataset.id);
        const action = btn.dataset.action;

        if (action === 'important') {
            toggleImportant(id);
        } else if (action === 'delete') {
            deleteTodo(id);
        }
    });

    function addTodo() {
        const text = todoInput.value.trim();

        if (!text) return;

        const todo = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            text: text,
            completed: false,
            important: false
        };

        state.todos.push(todo);

        todoInput.value = '';

        renderTodos();
        saveState();
    }

    function renderTodos() {
        todoList.innerHTML = state.todos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''} ${todo.important ? 'important' : ''}">
                
                <input
                    type="checkbox"
                    class="todo-checkbox"
                    data-id="${todo.id}"
                    ${todo.completed ? 'checked' : ''}
                >

                <span class="todo-text">
                    ${escapeHtml(todo.text)}
                </span>

                <div class="todo-actions">
                    <button
                        class="todo-btn"
                        data-action="important"
                        data-id="${todo.id}"
                        title="Mark as important"
                    >
                        ${todo.important ? '🌟' : '⭐'}
                    </button>

                    <button
                        class="todo-btn"
                        data-action="delete"
                        data-id="${todo.id}"
                        title="Delete task"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    function toggleTodo(id) {
        const todo = state.todos.find(t => t.id === id);

        if (!todo) return;

        todo.completed = !todo.completed;

        renderTodos();
        saveState();
    }

    function toggleImportant(id) {
        const todo = state.todos.find(t => t.id === id);

        if (!todo) return;

        todo.important = !todo.important;

        renderTodos();
        saveState();
    }

    function deleteTodo(id) {
        state.todos = state.todos.filter(todo => todo.id !== id);

        renderTodos();
        saveState();
    }
}

// ========== DAILY PLANNER ==========
function setupPlanner() {
    const plannerSlots = document.getElementById('plannerSlots');

    // Generate 24 time slots
    renderPlanner();

    function renderPlanner() {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            const timeLabel = String(hour).padStart(2, '0') + ':00';
            const value = state.planner[hour] || '';

            slots.push(`
                <div class="planner-slot">
                    <div class="slot-time">${timeLabel}</div>
                    <textarea 
                        class="slot-input" 
                        data-hour="${hour}" 
                        placeholder="Plan for this hour..."
                    >${escapeHtml(value)}</textarea>
                </div>
            `);
        }

        plannerSlots.innerHTML = slots.join('');

        // Event listeners for each slot
        plannerSlots.addEventListener('input', (e) => {
            if (e.target.classList.contains('slot-input')) {
                const hour = parseInt(e.target.getAttribute('data-hour'));
                const value = e.target.value;

                if (value.trim()) {
                    state.planner[hour] = value;
                } else {
                    delete state.planner[hour];
                }

                saveState();
            }
        });
    }
}

// ========== DAILY GOALS ==========
function setupGoals() {
    const goalInput = document.getElementById('goalInput');
    const addGoalBtn = document.getElementById('addGoalBtn');
    const goalsList = document.getElementById('goalsList');
    const goalsCompleted = document.getElementById('goalsCompleted');
    const goalsTotal = document.getElementById('goalsTotal');
    const progressFill = document.getElementById('progressFill');

    renderGoals();

    addGoalBtn.addEventListener('click', addGoal);

    goalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addGoal();
        }
    });

    // Add listeners ONLY ONCE
    goalsList.addEventListener('change', (e) => {
        if (e.target.classList.contains('goal-checkbox')) {
            const id = Number(e.target.dataset.id);
            toggleGoal(id);
        }
    });

    goalsList.addEventListener('click', (e) => {
        const btn = e.target.closest('.goal-delete-btn');

        if (!btn) return;

        const id = Number(btn.dataset.id);
        deleteGoal(id);
    });

    function addGoal() {
        const text = goalInput.value.trim();

        if (!text) return;

        const goal = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            text,
            completed: false
        };

        state.goals.push(goal);

        goalInput.value = '';

        renderGoals();
        saveState();
    }

    function renderGoals() {
        goalsList.innerHTML = state.goals.map(goal => `
            <div class="goal-item ${goal.completed ? 'completed' : ''}">
                <input
                    type="checkbox"
                    class="goal-checkbox"
                    data-id="${goal.id}"
                    ${goal.completed ? 'checked' : ''}
                >

                <span class="goal-text">
                    ${escapeHtml(goal.text)}
                </span>

                <button
                    class="goal-delete-btn"
                    data-id="${goal.id}"
                    title="Delete goal"
                >
                    ×
                </button>
            </div>
        `).join('');

        // Progress calculation
        const completed = state.goals.filter(g => g.completed).length;
        const total = state.goals.length;

        goalsCompleted.textContent = completed;
        goalsTotal.textContent = total;

        const percentage = total
            ? (completed / total) * 100
            : 0;

        progressFill.style.width = percentage + '%';
    }

    function toggleGoal(id) {
        const goal = state.goals.find(g => g.id === id);

        if (!goal) return;

        goal.completed = !goal.completed;

        renderGoals();
        saveState();
    }

    function deleteGoal(id) {
        state.goals = state.goals.filter(g => g.id !== id);

        renderGoals();
        saveState();
    }
}

// ========== POMODORO TIMER ==========
function setupPomodoro() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const workDurationInput = document.getElementById('workDuration');
    const breakDurationInput = document.getElementById('breakDuration');
    const timerDisplay = document.getElementById('timerDisplay');
    const sessionLabel = document.getElementById('sessionLabel');

    // Set initial time
    state.pomodoro.workDuration = parseInt(workDurationInput.value);
    state.pomodoro.breakDuration = parseInt(breakDurationInput.value);
    state.pomodoro.timeLeft = state.pomodoro.workDuration * 60;
    updateTimerDisplay();

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    workDurationInput.addEventListener('change', (e) => {
        if (!state.pomodoro.isRunning) {
            state.pomodoro.workDuration = parseInt(e.target.value);
            if (state.pomodoro.isWorkSession) {
                state.pomodoro.timeLeft = state.pomodoro.workDuration * 60;
            }
            updateTimerDisplay();
        }
    });

    breakDurationInput.addEventListener('change', (e) => {
        if (!state.pomodoro.isRunning) {
            state.pomodoro.breakDuration = parseInt(e.target.value);
            if (!state.pomodoro.isWorkSession) {
                state.pomodoro.timeLeft = state.pomodoro.breakDuration * 60;
            }
            updateTimerDisplay();
        }
    });

    function startTimer() {
        if (state.pomodoro.isRunning) return;

        state.pomodoro.isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        workDurationInput.disabled = true;
        breakDurationInput.disabled = true;

        state.pomodoro.intervalId = setInterval(() => {
            state.pomodoro.timeLeft--;
            updateTimerDisplay();

            if (state.pomodoro.timeLeft === 0) {
                sessionComplete();
            }
        }, 1000);
    }

    function pauseTimer() {
        state.pomodoro.isRunning = false;
        clearInterval(state.pomodoro.intervalId);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }

    function resetTimer() {
        clearInterval(state.pomodoro.intervalId);
        state.pomodoro.isRunning = false;
        state.pomodoro.isWorkSession = true;
        state.pomodoro.timeLeft = state.pomodoro.workDuration * 60;

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        workDurationInput.disabled = false;
        breakDurationInput.disabled = false;

        updateTimerDisplay();
    }

    function sessionComplete() {
        clearInterval(state.pomodoro.intervalId);
        state.pomodoro.isRunning = false;

        // Alert and switch session type
        if (state.pomodoro.isWorkSession) {
            alert('Work session complete! Time for a break. 🎉');
            state.pomodoro.isWorkSession = false;
            state.pomodoro.timeLeft = state.pomodoro.breakDuration * 60;
        } else {
            alert('Break complete! Ready for another work session? 💪');
            state.pomodoro.isWorkSession = true;
            state.pomodoro.timeLeft = state.pomodoro.workDuration * 60;
        }

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        workDurationInput.disabled = false;
        breakDurationInput.disabled = false;

        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(state.pomodoro.timeLeft / 60);
        const seconds = state.pomodoro.timeLeft % 60;
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        timerDisplay.textContent = display;
        sessionLabel.textContent = state.pomodoro.isWorkSession ? 'Work Session' : 'Break Time';
    }
}

// ========== MOTIVATION QUOTES ==========
function setupQuotes() {
    const newQuoteBtn = document.getElementById('newQuoteBtn');
    const quoteText = document.getElementById('quoteText');
    const quoteAuthor = document.getElementById('quoteAuthor');
    const quoteLoading = document.getElementById('quoteLoading');

    // Fetch a quote on page load
    fetchQuote();

    newQuoteBtn.addEventListener('click', fetchQuote);

    async function fetchQuote() {
        try {
            quoteLoading.style.display = 'block';
            quoteText.textContent = '';
            quoteAuthor.textContent = '';

            // Use quotable.io API (no auth required)
            const response = await fetch(
                'https://dummyjson.com/quotes/random'
            );

            if (!response.ok) throw new Error('Quote API failed');

            const data = await response.json();

            quoteText.textContent = `"${data.quote}"`;
            quoteAuthor.textContent = data.author;
            quoteLoading.style.display = 'none';
        } catch (error) {
            console.error('Quote fetch error:', error);
            quoteText.textContent = 'Keep pushing forward!';
            quoteAuthor.textContent = 'Anonymous';
            quoteLoading.style.display = 'none';
        }
    }
}

// ========== UTILITY FUNCTIONS ==========
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
