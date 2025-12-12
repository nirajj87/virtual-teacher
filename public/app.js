// ================== CONFIGURATION ==================
// ✅ EK HI JAGAH CHANGE KARNA HOGI
const BASE_URL = "/virtual-teacher"; // ✅ YAHI CHANGE KARO - deployment ke time par

// App State
let state = {
    currentIndex: null,
    timer: null,
    timeLeft: 60, // Default 60 seconds
    totalTime: 60,
    stats: {
        answered: 0,
        streak: 0,
        score: 0,
        totalAccuracy: 0,
        responseTimes: [],
        bestStreak: 0
    },
    askedByCategory: {},
    isListening: false,
    questions: [],
    currentDifficulty: 'easy',
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    questionStartTime: null,
    isAutoAsking: false,
    autoAskTimer: null,
    maxQuestionsPerSession: 50, // Safety limit
    // New states for your requirements
    isFreeTime: false,
    userIsTyping: false,
    typingTimer: null,
    freeTimeActive: false
};

// DOM Elements
const elements = {
    darkToggle: document.getElementById('darkToggle'),
    fileInput: document.getElementById('fileInput'),
    uploadArea: document.getElementById('fileUploadArea'),
    categorySelect: document.getElementById('categorySelect'),
    difficultyButtons: document.querySelectorAll('.difficulty-btn'),
    askBtn: document.getElementById('askBtn'),
    skipBtn: document.getElementById('skipBtn'),
    submitBtn: document.getElementById('submitBtn'),
    speakBtn: document.getElementById('speakBtn'),
    stopBtn: document.getElementById('stopBtn'),
    answer: document.getElementById('answer'),
    question: document.getElementById('question'),
    result: document.getElementById('result'),
    timer: document.getElementById('timer'),
    timerBar: document.getElementById('timerBar'),
    answered: document.getElementById('answered'),
    streak: document.getElementById('streak'),
    multiplier: document.getElementById('multiplier'),
    score: document.getElementById('score'),
    leaderboard: document.getElementById('leaderboard'),
    similarityValue: document.getElementById('similarityValue'),
    correctAnswer: document.getElementById('correctAnswer'),
    feedback: document.getElementById('feedback'),
    scoreCircle: document.getElementById('scoreCircle'),
    voiceStatus: document.getElementById('voiceStatus'),
    charCount: document.getElementById('charCount'),
    questionCount: document.getElementById('questionCount'),
    toast: document.getElementById('toast'),
    avgAccuracy: document.getElementById('avgAccuracy'),
    bestStreak: document.getElementById('bestStreak'),
    avgTime: document.getElementById('avgTime'),
    freeTimeBtn: document.getElementById('freeTimeBtn') // New element
};

// Speech Recognition with better error handling
let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
        state.isListening = true;
        elements.voiceStatus.classList.add('active');
        elements.speakBtn.disabled = true;
        elements.stopBtn.disabled = false;
        showToast('🎤 Listening... Speak now!', 'info');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        elements.answer.value += transcript + ' ';
        updateCharCount();
        showToast('✅ Speech recognized!', 'success');
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            showToast('🎤 No speech detected. Try again.', 'warning');
        } else if (event.error === 'audio-capture') {
            showToast('🎤 No microphone found.', 'error');
        } else if (event.error === 'not-allowed') {
            showToast('🎤 Microphone access denied.', 'error');
        } else {
            showToast(`🎤 Speech error: ${event.error}`, 'error');
        }
        stopListening();
    };
    
    recognition.onend = () => {
        stopListening();
    };
} else {
    elements.speakBtn.disabled = true;
    elements.speakBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Not Supported';
    showToast('⚠️ Speech recognition not supported in your browser', 'warning');
}

// Initialize App
async function init() {
    // Set theme
    if (state.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.darkToggle.checked = true;
    }
    
    // Load saved score
    loadScore();
    
    // Test connection to backend
    await testBackendConnection();
    
    // Load categories from server (uses default CSV)
    await loadCategories();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show initial status
    showToast('✅ Interview Practice App Ready!', 'success');
    showToast(`📁 Using base URL: ${BASE_URL}`, 'info');
}

// Test backend connection
async function testBackendConnection() {
    try {
        const response = await fetch(`${BASE_URL}/api/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend connected:', data);
            showToast(`✅ Backend connected (${data.questions} questions)`, 'success');
        } else {
            showToast('⚠️ Backend connection issue', 'warning');
        }
    } catch (error) {
        console.error('Backend connection error:', error);
        showToast('❌ Cannot connect to backend server', 'error');
    }
}

// Event Listeners
function setupEventListeners() {
    // Theme toggle
    elements.darkToggle.addEventListener('change', toggleDarkMode);
    
    // File upload
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        elements.uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        elements.uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        elements.uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    elements.uploadArea.addEventListener('drop', handleDrop, false);
    
    // Answer textarea
    elements.answer.addEventListener('input', () => {
        updateCharCount();
        
        // Typing detection
        state.userIsTyping = true;
        
        // Clear previous typing timer
        clearTimeout(state.typingTimer);
        
        // Set timer to mark as not typing after 2 seconds of inactivity
        state.typingTimer = setTimeout(() => {
            state.userIsTyping = false;
        }, 2000);
    });
    
    elements.answer.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            submitAnswer();
        }
    });
    
    // Free Time button
    if (elements.freeTimeBtn) {
        elements.freeTimeBtn.addEventListener('click', activateFreeTime);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.skipBtn.disabled) {
            skipQuestion();
        }
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            toggleDarkMode();
        }
        if (e.ctrlKey && e.key === ' ') {
            e.preventDefault();
            if (!state.isListening) {
                startListening();
            }
        }
        // Free Time shortcut (Ctrl+Shift+F)
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            activateFreeTime();
        }
    });
    
    // Category change - reset asked questions for that category
    elements.categorySelect.addEventListener('change', () => {
        const category = elements.categorySelect.value || '__all__';
        if (state.askedByCategory[category]) {
            showToast(`📂 Category changed to: ${category || 'All'}`, 'info');
        }
    });
    
    // Prevent multiple clicks
    elements.askBtn.addEventListener('click', () => {
        if (!elements.askBtn.classList.contains('loading')) {
            askQuestion();
        }
    });
}

// Theme
function toggleDarkMode() {
    state.isDarkMode = elements.darkToggle.checked;
    if (state.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('darkMode', state.isDarkMode);
    showToast(state.isDarkMode ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'info');
}

// File Handling
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    elements.uploadArea.classList.add('drag-over');
}

function unhighlight() {
    elements.uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        elements.fileInput.files = files;
        handleFileSelect();
    }
}

function handleFileSelect() {
    const file = elements.fileInput.files[0];
    if (file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showToast('❌ Please select a CSV file (.csv)', 'error');
            elements.uploadArea.innerHTML = `
                <i class="fas fa-exclamation-triangle upload-icon"></i>
                <p>Invalid file type</p>
                <p class="upload-subtext">Please select a CSV file</p>
            `;
            document.getElementById('uploadBtn').disabled = true;
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ File too large. Maximum size is 5MB', 'error');
            return;
        }
        
        // Update UI
        elements.uploadArea.innerHTML = `
            <i class="fas fa-file-csv upload-icon"></i>
            <p>${file.name}</p>
            <p class="upload-subtext">${(file.size / 1024).toFixed(1)} KB • Ready to upload</p>
        `;
        
        document.getElementById('uploadBtn').disabled = false;
        showToast('📄 File selected. Click "Upload CSV" to continue.', 'info');
    }
}

// Difficulty
function setDifficulty(level) {
    state.currentDifficulty = level;
    elements.difficultyButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.level === level) {
            btn.classList.add('active');
        }
    });
    
    // Update timer if question is active
    if (state.currentIndex !== null && !state.isFreeTime) {
        const newTime = level === 'easy' ? 60 : level === 'medium' ? 40 : 20;
        state.timeLeft = newTime;
        state.totalTime = newTime;
        elements.timer.textContent = newTime;
        updateTimerProgress();
    }
    
    showToast(`🎯 Difficulty set to ${level} (${level === 'easy' ? '60s' : level === 'medium' ? '40s' : '20s'})`, 'success');
}

// Free Time Function
function activateFreeTime() {
    if (!state.currentIndex) {
        showToast('❌ No active question', 'warning');
        return;
    }
    
    state.isFreeTime = !state.isFreeTime;
    
    if (state.isFreeTime) {
        // Stop the timer
        clearInterval(state.timer);
        
        // Update UI
        elements.freeTimeBtn.classList.add('free-time-active');
        elements.freeTimeBtn.innerHTML = '<i class="fas fa-hourglass-start"></i> Free Time Active';
        elements.timer.textContent = '∞';
        elements.timerBar.style.width = '100%';
        elements.timerBar.style.background = 'var(--success)';
        
        // Add free time indicator to question
        const existingIndicator = elements.question.querySelector('.free-time-indicator');
        if (!existingIndicator) {
            const freeTimeIndicator = document.createElement('div');
            freeTimeIndicator.className = 'free-time-indicator';
            freeTimeIndicator.innerHTML = '<i class="fas fa-infinity"></i> Free Time';
            elements.question.appendChild(freeTimeIndicator);
        }
        
        showToast('⏳ Free time activated! Take your time...', 'success');
    } else {
        // Restart timer
        const time = state.currentDifficulty === 'easy' ? 60 : 
                    state.currentDifficulty === 'medium' ? 40 : 20;
        startTimer(time);
        
        // Update UI
        elements.freeTimeBtn.classList.remove('free-time-active');
        elements.freeTimeBtn.innerHTML = '<i class="fas fa-hourglass-end"></i> Free Time';
        
        // Remove free time indicator
        const indicator = elements.question.querySelector('.free-time-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        showToast('⏰ Timer resumed!', 'info');
    }
}

// Timer
function startTimer(seconds) {
    clearInterval(state.timer);
    clearTimeout(state.autoAskTimer);
    clearTimeout(state.typingTimer);
    
    // Reset free time state
    state.isFreeTime = false;
    if (elements.freeTimeBtn) {
        elements.freeTimeBtn.classList.remove('free-time-active');
        elements.freeTimeBtn.innerHTML = '<i class="fas fa-hourglass-end"></i> Free Time';
    }
    
    // Remove free time indicator
    const indicator = elements.question.querySelector('.free-time-indicator');
    if (indicator) {
        indicator.remove();
    }
    
    state.timeLeft = seconds;
    state.totalTime = seconds;
    elements.timer.textContent = seconds;
    updateTimerProgress();
    
    state.timer = setInterval(() => {
        // Only decrement time if user is NOT typing (and not in free time)
        if ((!state.userIsTyping && !state.isFreeTime) || state.timeLeft <= 5) {
            state.timeLeft--;
            elements.timer.textContent = state.isFreeTime ? '∞' : state.timeLeft;
            updateTimerProgress();
        }
        
        if (state.timeLeft <= 0 && !state.isFreeTime) {
            clearInterval(state.timer);
            // Auto-submit only if user is not typing
            if (!state.userIsTyping) {
                submitAnswer(true);
            } else {
                // Give extra 10 seconds if typing
                state.timeLeft = 10;
                elements.timer.textContent = '10';
                showToast('⌨️ You\'re typing! +10 seconds...', 'warning');
            }
        }
    }, 1000);
}

function updateTimerProgress() {
    if (state.isFreeTime) {
        elements.timerBar.style.width = '100%';
        elements.timerBar.style.background = 'var(--success)';
        elements.timerBar.classList.remove('warning', 'danger');
        return;
    }
    
    const percentage = (state.timeLeft / state.totalTime) * 100;
    elements.timerBar.style.width = `${percentage}%`;
    elements.timerBar.style.background = '';
    
    if (percentage < 30) {
        elements.timerBar.classList.add('danger');
        elements.timerBar.classList.remove('warning');
    } else if (percentage < 60) {
        elements.timerBar.classList.add('warning');
        elements.timerBar.classList.remove('danger');
    } else {
        elements.timerBar.classList.remove('warning', 'danger');
    }
}

// Load Categories from Server
async function loadCategories() {
    try {
        const response = await fetch(`${BASE_URL}/api/categories`);
        if (!response.ok) {
            throw new Error('Failed to load categories');
        }
        
        const data = await response.json();
        
        elements.categorySelect.innerHTML = '<option value="">All Categories</option>';
        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                elements.categorySelect.appendChild(option);
            });
            
            // Update question count
            updateQuestionCount();
            
            showToast(`📂 Loaded ${data.categories.length} categories`, 'success');
        } else {
            elements.categorySelect.innerHTML = '<option value="">No categories found</option>';
            showToast('📂 No categories found in CSV', 'warning');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        elements.categorySelect.innerHTML = '<option value="">Failed to load categories</option>';
        showToast('⚠️ Could not load categories from server', 'error');
    }
}

// Update Question Count
async function updateQuestionCount() {
    try {
        const response = await fetch(`${BASE_URL}/api/question-count`);
        if (response.ok) {
            const data = await response.json();
            elements.questionCount.textContent = data.count || 0;
        }
    } catch (error) {
        console.error('Error getting question count:', error);
        elements.questionCount.textContent = '0';
    }
}

// Ask Question with safety checks
async function askQuestion() {
    // Prevent multiple simultaneous requests
    if (elements.askBtn.classList.contains('loading')) {
        showToast('⏳ Please wait, loading question...', 'warning');
        return;
    }
    
    // Clear any existing timers
    clearInterval(state.timer);
    clearTimeout(state.autoAskTimer);
    clearTimeout(state.typingTimer);
    
    // Reset states
    state.isAutoAsking = false;
    state.isFreeTime = false;
    state.userIsTyping = false;
    
    // Reset Free Time button if exists
    if (elements.freeTimeBtn) {
        elements.freeTimeBtn.classList.remove('free-time-active');
        elements.freeTimeBtn.innerHTML = '<i class="fas fa-hourglass-end"></i> Free Time';
    }
    
    // Clear previous question state
    elements.result.classList.remove('active');
    elements.submitBtn.disabled = false;
    elements.skipBtn.disabled = false;
    
    const category = elements.categorySelect.value || '__all__';
    
    // Check if we've asked too many questions in this session
    if (state.askedByCategory[category] && state.askedByCategory[category].size >= state.maxQuestionsPerSession) {
        if (confirm(`You've practiced ${state.maxQuestionsPerSession} questions in this category. Reset and start over?`)) {
            state.askedByCategory[category].clear();
            showToast('🔄 Reset questions for this category', 'info');
        } else {
            showToast('✅ Continue with current questions', 'info');
        }
    }
    
    state.askedByCategory[category] = state.askedByCategory[category] || new Set();
    
    let url = `${BASE_URL}/api/question`;
    if (category !== '__all__') {
        url += `?category=${encodeURIComponent(category)}`;
    }
    
    // Show loading state
    elements.askBtn.classList.add('loading');
    elements.askBtn.disabled = true;
    elements.question.innerHTML = `
        <div class="loading-placeholder">
            <div class="loading-spinner"></div>
            <p>Loading question...</p>
        </div>
    `;
    
    // Add timeout for safety
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
    });
    
    try {
        const response = await Promise.race([
            fetch(url),
            timeoutPromise
        ]);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove loading state
        elements.askBtn.classList.remove('loading');
        elements.askBtn.disabled = false;
        
        if (data.error || !data.question) {
            elements.question.innerHTML = `
                <div class="question-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${data.error || 'No questions available'}</p>
                    <p class="upload-subtext">Try selecting a different category</p>
                </div>
            `;
            
            // If no questions, wait longer before retry
            showToast(data.error || '❌ No questions available', 'warning');
            
            // Don't auto-retry on error
            return;
        }
        
        // Mark question as asked
        state.askedByCategory[category].add(data.index);
        state.currentIndex = data.index;
        state.questionStartTime = Date.now();
        
        // Display the question
        elements.question.innerHTML = `
            <div class="question-content">
                <p>${data.question}</p>
                ${data.category ? `<div class="question-category"><i class="fas fa-tag"></i> ${data.category}</div>` : ''}
            </div>
        `;
        
        // Clear answer and focus
        elements.answer.value = '';
        updateCharCount();
        
        // Don't auto-focus if using voice
        if (!state.isListening) {
            setTimeout(() => elements.answer.focus(), 300);
        }
        
        // Start timer based on difficulty
        const time = state.currentDifficulty === 'easy' ? 60 : 
                    state.currentDifficulty === 'medium' ? 40 : 20;
        startTimer(time);
        
        showToast('📝 Question loaded!', 'success');
        
    } catch (error) {
        console.error('Error loading question:', error);
        
        elements.askBtn.classList.remove('loading');
        elements.askBtn.disabled = false;
        
        elements.question.innerHTML = `
            <div class="question-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${error.message === 'Request timeout' ? 'Request timed out' : 'Error loading question'}</p>
                <p class="upload-subtext">Please try again in a moment</p>
            </div>
        `;
        
        showToast(`❌ ${error.message === 'Request timeout' ? 'Request timed out' : 'Error loading question'}`, 'error');
    }
}

function skipQuestion() {
    if (confirm('Skip this question?')) {
        showToast('⏭️ Skipping question...', 'info');
        askQuestion();
    }
}

// Answer Submission with safe auto-next
async function submitAnswer(auto = false) {
    // Prevent multiple submissions
    if (elements.submitBtn.disabled && !auto) {
        return;
    }
    
    if (state.currentIndex === null) {
        showToast('❌ No active question', 'warning');
        return;
    }
    
    // Clear timers
    clearInterval(state.timer);
    clearTimeout(state.autoAskTimer);
    clearTimeout(state.typingTimer);
    
    elements.submitBtn.disabled = true;
    elements.skipBtn.disabled = true;
    
    if (auto) {
        showToast('⏰ Time\'s up! Auto-submitting...', 'warning');
    }
    
    const userAnswer = elements.answer.value.trim();
    if (!userAnswer && !auto) {
        showToast('📝 Please enter an answer', 'warning');
        elements.submitBtn.disabled = false;
        elements.skipBtn.disabled = false;
        return;
    }
    
    // Calculate response time
    if (state.questionStartTime) {
        const responseTime = Math.round((Date.now() - state.questionStartTime) / 1000);
        state.stats.responseTimes.push(responseTime);
        updateAvgTime();
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                index: state.currentIndex,
                userAnswer: userAnswer
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit answer');
        }
        
        const data = await response.json();
        showResult(data);
        updateStats(data.similarity);
        
        // ✅ IMMEDIATELY start next question after 2 seconds
        showToast('⏳ Next question in 2 seconds...', 'info');
        
        // Set auto-ask timer for 2 seconds
        state.autoAskTimer = setTimeout(() => {
            loadNextQuestion();
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting answer:', error);
        showToast('❌ Error submitting answer', 'error');
        
        // Re-enable buttons on error
        elements.submitBtn.disabled = false;
        elements.skipBtn.disabled = false;
    }
}

// Safe function to load next question
function loadNextQuestion() {
    if (state.isAutoAsking) {
        return; // Prevent multiple calls
    }
    
    state.isAutoAsking = true;
    
    // Clear all states
    state.currentIndex = null;
    state.isFreeTime = false;
    state.userIsTyping = false;
    clearTimeout(state.typingTimer);
    
    // Reset Free Time button
    if (elements.freeTimeBtn) {
        elements.freeTimeBtn.classList.remove('free-time-active');
        elements.freeTimeBtn.innerHTML = '<i class="fas fa-hourglass-end"></i> Free Time';
    }
    
    // Wait a moment before asking next question
    setTimeout(() => {
        askQuestion();
        state.isAutoAsking = false;
    }, 500);
}

function showResult(data) {
    elements.result.classList.add('active');
    elements.similarityValue.textContent = data.similarity;
    elements.correctAnswer.textContent = data.correctAnswer || 'No correct answer provided';
    
    // Update score circle
    const percentage = data.similarity;
    elements.scoreCircle.style.background = `conic-gradient(var(--primary) 0% ${percentage}%, var(--border) ${percentage}% 100%)`;
    
    // Set feedback message
    let feedback = '';
    let feedbackClass = '';
    
    if (percentage >= 90) {
        feedback = 'Excellent! 🎯';
        feedbackClass = 'excellent';
        createConfetti();
    } else if (percentage >= 70) {
        feedback = 'Good job! 👍';
        feedbackClass = 'good';
    } else if (percentage >= 50) {
        feedback = 'Fair attempt 💪';
        feedbackClass = 'fair';
    } else {
        feedback = 'Needs improvement 📚';
        feedbackClass = 'poor';
    }
    
    elements.feedback.textContent = feedback;
    elements.feedback.className = `feedback ${feedbackClass}`;
}

function updateStats(similarity) {
    state.stats.answered++;
    state.stats.totalAccuracy += similarity;
    
    if (similarity >= 70) {
        state.stats.streak++;
        if (state.stats.streak > state.stats.bestStreak) {
            state.stats.bestStreak = state.stats.streak;
            elements.bestStreak.textContent = state.stats.bestStreak;
        }
    } else {
        state.stats.streak = 0;
    }
    
    const multiplier = state.stats.streak >= 5 ? 3 : 
                     state.stats.streak >= 3 ? 2 : 1;
    
    const points = Math.round(similarity * multiplier);
    state.stats.score += points;
    
    // Update UI
    elements.answered.textContent = state.stats.answered;
    elements.streak.textContent = state.stats.streak;
    elements.multiplier.textContent = `${multiplier}x`;
    elements.multiplier.className = `multiplier mult-${multiplier}`;
    elements.score.textContent = Math.round(state.stats.score);
    
    // Update insights
    updateAvgAccuracy();
    updateAvgTime();
    
    // Save score
    saveScore();
    
    // Update leaderboard
    updateLeaderboard();
}

// Insights Functions
function updateAvgAccuracy() {
    if (state.stats.answered > 0) {
        const avg = Math.round(state.stats.totalAccuracy / state.stats.answered);
        elements.avgAccuracy.textContent = `${avg}%`;
    }
}

function updateAvgTime() {
    if (state.stats.responseTimes.length > 0) {
        const avg = Math.round(
            state.stats.responseTimes.reduce((a, b) => a + b, 0) / state.stats.responseTimes.length
        );
        elements.avgTime.textContent = `${avg}s`;
    }
}

// Score Management
function saveScore() {
    const scoreData = {
        answered: state.stats.answered,
        streak: state.stats.streak,
        bestStreak: state.stats.bestStreak,
        score: state.stats.score,
        totalAccuracy: state.stats.totalAccuracy,
        responseTimes: state.stats.responseTimes,
        timestamp: Date.now()
    };
    localStorage.setItem('interviewPracticeScore', JSON.stringify(scoreData));
}

function loadScore() {
    const saved = localStorage.getItem('interviewPracticeScore');
    if (saved) {
        try {
            const scoreData = JSON.parse(saved);
            state.stats = { ...state.stats, ...scoreData };
            
            elements.answered.textContent = state.stats.answered;
            elements.streak.textContent = state.stats.streak;
            elements.score.textContent = Math.round(state.stats.score);
            elements.bestStreak.textContent = state.stats.bestStreak || 0;
            
            updateAvgAccuracy();
            updateAvgTime();
            updateLeaderboard();
            
        } catch (error) {
            console.error('Error loading saved score:', error);
        }
    }
}

function updateLeaderboard() {
    const bestScore = Math.round(state.stats.score);
    elements.leaderboard.innerHTML = `
        <div class="score-value">${bestScore}</div>
        <div class="score-label">Best Score</div>
    `;
}

function resetScore() {
    if (confirm('Are you sure you want to reset your score? This cannot be undone.')) {
        state.stats = { 
            answered: 0, 
            streak: 0, 
            score: 0,
            totalAccuracy: 0,
            responseTimes: [],
            bestStreak: 0
        };
        localStorage.removeItem('interviewPracticeScore');
        
        elements.answered.textContent = '0';
        elements.streak.textContent = '0';
        elements.score.textContent = '0';
        elements.multiplier.textContent = '1x';
        elements.multiplier.className = 'multiplier';
        elements.avgAccuracy.textContent = '0%';
        elements.bestStreak.textContent = '0';
        elements.avgTime.textContent = '0s';
        
        elements.leaderboard.innerHTML = `
            <div class="score-value">--</div>
            <div class="score-label">No score yet</div>
        `;
        
        showToast('🔄 Score reset successfully', 'success');
    }
}

// Voice Recognition
function startListening() {
    if (!recognition) {
        showToast('❌ Speech recognition not available', 'error');
        return;
    }
    
    if (state.isListening) {
        stopListening();
        return;
    }
    
    try {
        recognition.start();
    } catch (error) {
        console.error('Speech recognition start error:', error);
        showToast('❌ Error starting speech recognition', 'error');
    }
}

function stopListening() {
    if (recognition && state.isListening) {
        try {
            recognition.stop();
        } catch (error) {
            console.error('Speech recognition stop error:', error);
        }
    }
    
    state.isListening = false;
    elements.voiceStatus.classList.remove('active');
    elements.speakBtn.disabled = false;
    elements.stopBtn.disabled = true;
}

// CSV Upload
async function uploadCSV() {
    const file = elements.fileInput.files[0];
    if (!file) {
        showToast('❌ Please select a CSV file first', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Show uploading state
    const originalContent = elements.uploadArea.innerHTML;
    elements.uploadArea.innerHTML = `
        <div class="loading-placeholder">
            <div class="loading-spinner"></div>
            <p>Uploading...</p>
        </div>
    `;
    document.getElementById('uploadBtn').disabled = true;
    document.getElementById('uploadBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    try {
        const response = await fetch(`${BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(`✅ ${data.message} (${data.count} questions)`, 'success');
            
            // Reset file input and UI
            elements.fileInput.value = '';
            elements.uploadArea.innerHTML = `
                <i class="fas fa-check-circle upload-icon" style="color: var(--success)"></i>
                <p>Upload successful!</p>
                <p class="upload-subtext">${data.count} questions loaded</p>
            `;
            
            document.getElementById('uploadBtn').disabled = true;
            document.getElementById('uploadBtn').innerHTML = '<i class="fas fa-upload"></i> Upload CSV';
            
            // Update question count
            elements.questionCount.textContent = data.count || 0;
            
            // Reload categories
            await loadCategories();
            
            // Clear asked questions
            state.askedByCategory = {};
            
            // Reset after 3 seconds
            setTimeout(() => {
                elements.uploadArea.innerHTML = `
                    <i class="fas fa-cloud-upload-alt upload-icon"></i>
                    <p>Drag & drop your CSV file here</p>
                    <p class="upload-subtext">or click to browse</p>
                `;
            }, 3000);
            
        } else {
            throw new Error(data.error || 'Upload failed');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        showToast(`❌ Upload failed: ${error.message}`, 'error');
        
        elements.uploadArea.innerHTML = `
            <i class="fas fa-exclamation-triangle upload-icon" style="color: var(--danger)"></i>
            <p>Upload failed</p>
            <p class="upload-subtext">${error.message}</p>
        `;
        
        document.getElementById('uploadBtn').disabled = false;
        document.getElementById('uploadBtn').innerHTML = '<i class="fas fa-upload"></i> Upload CSV';
        
        // Reset after 5 seconds
        setTimeout(() => {
            elements.uploadArea.innerHTML = originalContent;
        }, 5000);
    }
}

// Utility Functions
function updateCharCount() {
    const count = elements.answer.value.length;
    elements.charCount.textContent = count;
    
    if (count > 1000) {
        elements.charCount.style.color = 'var(--danger)';
    } else if (count > 500) {
        elements.charCount.style.color = 'var(--warning)';
    } else {
        elements.charCount.style.color = 'var(--text-muted)';
    }
}

function showToast(message, type = 'info') {
    // Clear existing toast
    elements.toast.classList.remove('show');
    
    setTimeout(() => {
        elements.toast.textContent = message;
        elements.toast.className = `toast ${type}`;
        
        // Add icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        elements.toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        elements.toast.classList.add('show');
        
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }, 100);
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.background = `hsl(${Math.random() * 360}, 80%, 60%)`;
        confetti.style.width = Math.random() * 15 + 5 + 'px';
        confetti.style.height = Math.random() * 15 + 5 + 'px';
        confetti.style.opacity = Math.random() * 0.5 + 0.5;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 2000);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    clearInterval(state.timer);
    clearTimeout(state.autoAskTimer);
    clearTimeout(state.typingTimer);
    stopListening();
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);