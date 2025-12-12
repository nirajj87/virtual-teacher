// ================== SETUP & CONFIGURATION ==================
const BASE_URL = "/virtual-teacher";

const STUDY_MODES = {
    PRACTICE: 'practice',
    TEST: 'test',
    REVIEW: 'review'
};

let state = {
    currentIndex: null,
    timer: null,
    timeLeft: 60,
    totalTime: 60,
    questionStartTime: null,
    
    stats: {
        answered: 0,
        streak: 0,
        score: 0,
        totalAccuracy: 0,
        responseTimes: [],
        bestStreak: 0,
        perfectScores: 0,
        sessionQuestions: 0
    },
    
    askedByCategory: {},
    currentStudyMode: STUDY_MODES.PRACTICE,
    testQuestions: [],
    testResults: [],
    reviewQuestions: [],
    currentReviewIndex: 0,
    
    isListening: false,
    isAutoAsking: false,
    autoAskTimer: null,
    isFreeTime: false,
    userIsTyping: false,
    typingTimer: null,
    maxQuestionsPerSession: 50,
    
    currentDifficulty: 'easy',
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    
    questions: [],
    questionHistory: []
};

const elements = {
    darkToggle: document.getElementById('darkToggle'),
    helpBtn: document.getElementById('helpBtn'),
    fileInput: document.getElementById('fileInput'),
    uploadArea: document.getElementById('fileUploadArea'),
    categorySelect: document.getElementById('categorySelect'),
    difficultyButtons: document.querySelectorAll('.difficulty-btn'),
    askBtn: document.getElementById('askBtn'),
    skipBtn: document.getElementById('skipBtn'),
    submitBtn: document.getElementById('submitBtn'),
    freeTimeBtn: document.getElementById('freeTimeBtn'),
    speakBtn: document.getElementById('speakBtn'),
    stopBtn: document.getElementById('stopBtn'),
    voiceStatus: document.getElementById('voiceStatus'),
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
    charCount: document.getElementById('charCount'),
    questionCount: document.getElementById('questionCount'),
    toast: document.getElementById('toast'),
    avgAccuracy: document.getElementById('avgAccuracy'),
    bestStreak: document.getElementById('bestStreak'),
    avgTime: document.getElementById('avgTime'),
    studyModeButtons: document.querySelectorAll('.study-mode-btn'),
    progressChart: document.getElementById('progressChart'),
    topicStrength: document.getElementById('topicStrength'),
    recommendations: document.getElementById('recommendations')
};

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
        showToast(`🎤 Speech error: ${event.error}`, 'error');
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

// ================== INITIALIZATION ==================
async function init() {
    console.log('🚀 App initialization started...');
    
    if (state.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.darkToggle.checked = true;
    }
    
    loadScore();
    loadProgressHistory();
    await testBackendConnection();
    await loadCategories();
    setupEventListeners();
    checkAchievements();
    
    // Load review questions from localStorage
    loadReviewQuestionsFromStorage();
   
    
    // ✅ FIX: Wait a bit before calling initLearningProgress
    setTimeout(() => {
        if (typeof initLearningProgress === 'function') {
            initLearningProgress();
        } else {
            console.warn('initLearningProgress not available yet');
            // Try again after 1 second
            setTimeout(() => {
                if (typeof initLearningProgress === 'function') {
                    initLearningProgress();
                }
            }, 1000);
        }
    }, 500);
    
    showToast('✅ Interview Practice App Ready!', 'success');
    showToast(`📁 Using base URL: ${BASE_URL}`, 'info');
    showToast('💡 Tip: Use Ctrl+Enter to submit answer quickly', 'info');
    
    console.log('✅ App initialized successfully');
}

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
            return true;
        } else {
            showToast('⚠️ Backend connection issue', 'warning');
            return false;
        }
    } catch (error) {
        console.error('Backend connection error:', error);
        showToast('❌ Cannot connect to backend server', 'error');
        return false;
    }
}

// ================== EVENT LISTENERS SETUP ==================
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    elements.darkToggle.addEventListener('change', toggleDarkMode);
    
    if (elements.helpBtn) {
        elements.helpBtn.addEventListener('click', () => {
            window.open('user-guide.html', '_blank');
        });
    }
    
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
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
    
    elements.answer.addEventListener('input', () => {
        updateCharCount();
        
        state.userIsTyping = true;
        clearTimeout(state.typingTimer);
        
        state.typingTimer = setTimeout(() => {
            state.userIsTyping = false;
        }, 2000);
    });
    
    elements.answer.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            submitAnswer();
        }
    });
    
    if (elements.freeTimeBtn) {
        elements.freeTimeBtn.addEventListener('click', activateFreeTime);
    }
    
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
        
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            activateFreeTime();
        }
    });
    
    elements.categorySelect.addEventListener('change', () => {
        const category = elements.categorySelect.value || '__all__';
        showToast(`📂 Category changed to: ${category || 'All'}`, 'info');
    });
    
    elements.askBtn.addEventListener('click', () => {
        if (!elements.askBtn.classList.contains('loading')) {
            if (state.currentStudyMode === STUDY_MODES.REVIEW && state.reviewQuestions.length > 0) {
                loadNextReviewQuestion();
            } else {
                askQuestion();
            }
        }
    });
    
    if (elements.studyModeButtons) {
        elements.studyModeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                setStudyMode(btn.dataset.mode);
            });
        });
    }
    
    console.log('✅ Event listeners setup complete');
}

// ================== THEME MANAGEMENT ==================
function toggleDarkMode() {
    state.isDarkMode = elements.darkToggle.checked;
    
    if (state.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        showToast('🌙 Dark mode enabled', 'info');
    } else {
        document.documentElement.removeAttribute('data-theme');
        showToast('☀️ Light mode enabled', 'info');
    }
    
    localStorage.setItem('darkMode', state.isDarkMode);
}

// ================== FILE UPLOAD HANDLING ==================
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
    if (!file) return;
    
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
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('❌ File too large. Maximum size is 5MB', 'error');
        return;
    }
    
    elements.uploadArea.innerHTML = `
        <i class="fas fa-file-csv upload-icon"></i>
        <p>${file.name}</p>
        <p class="upload-subtext">${(file.size / 1024).toFixed(1)} KB • Ready to upload</p>
    `;
    
    document.getElementById('uploadBtn').disabled = false;
    showToast('📄 File selected. Click "Upload CSV" to continue.', 'info');
}

// ================== DIFFICULTY SETTINGS ==================
function setDifficulty(level) {
    state.currentDifficulty = level;
    
    elements.difficultyButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.level === level) {
            btn.classList.add('active');
        }
    });
    
    if (state.currentIndex !== null && !state.isFreeTime) {
        const newTime = level === 'easy' ? 60 : level === 'medium' ? 40 : 20;
        state.timeLeft = newTime;
        state.totalTime = newTime;
        elements.timer.textContent = newTime;
        updateTimerProgress();
    }
    
    showToast(`🎯 Difficulty set to ${level} (${level === 'easy' ? '60s' : level === 'medium' ? '40s' : '20s'})`, 'success');
}

// ================== STUDY MODE MANAGEMENT ==================
function setStudyMode(mode) {
    if (!STUDY_MODES[mode.toUpperCase()]) {
        showToast('❌ Invalid study mode', 'error');
        return;
    }
    
    state.currentStudyMode = mode;
    
    if (elements.studyModeButtons) {
        elements.studyModeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
    }
    
    // Update UI for different modes
    updateUIForStudyMode(mode);
    
    switch(mode) {
        case STUDY_MODES.PRACTICE:
            setupPracticeMode();
            break;
        case STUDY_MODES.TEST:
            setupTestMode();
            break;
        case STUDY_MODES.REVIEW:
            setupReviewMode();
            break;
    }
    
    showToast(`📚 Study mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`, 'success');
}

function updateUIForStudyMode(mode) {
    // Reset UI elements
    clearInterval(state.timer);
    clearTimeout(state.autoAskTimer);
    elements.result.classList.remove('active');
    elements.answer.disabled = false;
    elements.answer.readOnly = false;
    elements.answer.value = '';
    elements.submitBtn.disabled = false;
    elements.skipBtn.disabled = false;
    elements.askBtn.disabled = false;
    
    // Hide free time button in test mode
    if (elements.freeTimeBtn) {
        elements.freeTimeBtn.style.display = mode === STUDY_MODES.TEST ? 'none' : 'block';
    }
    
    // Update panel classes
    const practicePanel = document.querySelector('.practice-panel');
    if (practicePanel) {
        practicePanel.classList.remove('test-mode', 'review-mode');
        if (mode === STUDY_MODES.TEST) practicePanel.classList.add('test-mode');
        if (mode === STUDY_MODES.REVIEW) practicePanel.classList.add('review-mode');
    }
}

function setupPracticeMode() {
    // Practice mode settings
    elements.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Answer';
    elements.submitBtn.className = 'btn btn-primary btn-submit';
    elements.askBtn.innerHTML = '<i class="fas fa-question-circle"></i> Ask Question';
    
    // Show timer
    const timerContainer = document.querySelector('.timer-container');
    if (timerContainer) timerContainer.style.display = 'block';
    
    // Reset timer display
    const time = state.currentDifficulty === 'easy' ? 60 : 
                state.currentDifficulty === 'medium' ? 40 : 20;
    elements.timer.textContent = time;
    updateTimerProgress();
}

function setupTestMode() {
    // Test mode settings
    elements.submitBtn.innerHTML = '<i class="fas fa-clock"></i> Submit Final Answer';
    elements.submitBtn.className = 'btn btn-warning btn-submit';
    elements.askBtn.innerHTML = '<i class="fas fa-play-circle"></i> Start Test';
    
    // Hide timer initially (will be shown when test starts)
    const timerContainer = document.querySelector('.timer-container');
    if (timerContainer) timerContainer.style.display = 'none';
    
    // Prepare test questions
    prepareTestQuestions();
}

function setupReviewMode() {
    // Review mode settings
    elements.submitBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Next Review';
    elements.submitBtn.className = 'btn btn-success btn-submit';
    elements.askBtn.innerHTML = '<i class="fas fa-history"></i> Load Review';
    
    // Hide timer
    const timerContainer = document.querySelector('.timer-container');
    if (timerContainer) timerContainer.style.display = 'none';
    
    // Load review questions if any
    if (state.reviewQuestions.length > 0) {
        loadNextReviewQuestion();
    } else {
        showToast('📝 No review questions available. Answer some questions first!', 'info');
    }
}

// ================== TEST MODE FUNCTIONS ==================
function prepareTestQuestions() {
    // This function would prepare 10 random questions for the test
    // For now, we'll just initialize an empty array
    state.testQuestions = [];
    state.testResults = [];
    showToast('📋 Test mode ready. Click "Start Test" to begin.', 'info');
}

async function startTest() {
    const category = elements.categorySelect.value || '__all__';
    
    try {
        // Fetch 10 questions for the test
        const response = await fetch(`${BASE_URL}/api/test-questions?category=${encodeURIComponent(category)}&count=10`);
        if (!response.ok) throw new Error('Failed to load test questions');
        
        const data = await response.json();
        state.testQuestions = data.questions || [];
        state.testResults = [];
        
        if (state.testQuestions.length === 0) {
            showToast('❌ No questions available for test', 'error');
            return;
        }
        
        // Show timer
        const timerContainer = document.querySelector('.timer-container');
        if (timerContainer) timerContainer.style.display = 'block';
        
        // Start test with first question
        startNextTestQuestion();
        
    } catch (error) {
        console.error('Error starting test:', error);
        showToast('❌ Failed to start test', 'error');
    }
}

function startNextTestQuestion() {
    if (state.testQuestions.length === 0) {
        finishTest();
        return;
    }
    
    const currentQuestion = state.testQuestions.shift();
    state.currentIndex = currentQuestion.index;
    
    // Display question
    elements.question.innerHTML = `
        <div class="question-content">
            <p><strong>Test Question ${10 - state.testQuestions.length}/10</strong></p>
            <p>${currentQuestion.question}</p>
            ${currentQuestion.category ? `<div class="question-category"><i class="fas fa-tag"></i> ${currentQuestion.category}</div>` : ''}
        </div>
    `;
    
    elements.answer.value = '';
    updateCharCount();
    elements.result.classList.remove('active');
    
    // Start timer for test question (30 seconds per question)
    startTimer(30);
    
    // Update submit button for test
    elements.submitBtn.onclick = () => {
        if (confirm('Are you sure you want to submit this answer? You cannot go back.')) {
            submitTestAnswer();
        }
    };
    
    // Update ask button to skip (only in test mode)
    elements.askBtn.innerHTML = '<i class="fas fa-forward"></i> Skip Question';
    elements.askBtn.onclick = () => {
        if (confirm('Skip this test question? You will get 0 points for it.')) {
            submitTestAnswer(true);
        }
    };
}

async function submitTestAnswer(skipped = false) {
    const userAnswer = skipped ? '[SKIPPED]' : elements.answer.value.trim();
    
    try {
        const response = await fetch(`${BASE_URL}/api/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                index: state.currentIndex,
                userAnswer: userAnswer
            })
        });
        
        if (!response.ok) throw new Error('Failed to submit answer');
        
        const data = await response.json();
        
        // Store result
        state.testResults.push({
            question: data.question,
            userAnswer: userAnswer,
            correctAnswer: data.correctAnswer,
            similarity: data.similarity,
            skipped: skipped
        });
        
        // Show result briefly
        showResult(data);
        
        // Wait 2 seconds then show next question
        setTimeout(() => {
            startNextTestQuestion();
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting test answer:', error);
        showToast('❌ Error submitting answer', 'error');
    }
}

function finishTest() {
    // Calculate test score
    const totalScore = state.testResults.reduce((sum, result) => {
        return sum + (result.skipped ? 0 : result.similarity);
    }, 0);
    
    const averageScore = Math.round(totalScore / 10);
    const correctAnswers = state.testResults.filter(r => r.similarity >= 70 && !r.skipped).length;
    
    // Show test results
    elements.question.innerHTML = `
        <div class="question-content">
            <h3>🎯 Test Complete!</h3>
            <div style="margin: 20px 0; padding: 20px; background: var(--bg-secondary); border-radius: 12px;">
                <div style="font-size: 3rem; font-weight: bold; color: var(--primary); text-align: center;">
                    ${averageScore}%
                </div>
                <div style="text-align: center; color: var(--text-secondary); margin-top: 10px;">
                    Average Score
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold;">${correctAnswers}/10</div>
                        <div style="font-size: 0.9rem; color: var(--text-muted);">Correct Answers</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold;">${10 - correctAnswers}</div>
                        <div style="font-size: 0.9rem; color: var(--text-muted);">Incorrect Answers</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    elements.answer.style.display = 'none';
    elements.submitBtn.style.display = 'none';
    elements.skipBtn.style.display = 'none';
    
    elements.askBtn.innerHTML = '<i class="fas fa-redo"></i> Take Another Test';
    elements.askBtn.onclick = () => {
        setStudyMode(STUDY_MODES.TEST);
        setupTestMode();
    };
    
    // Hide timer
    const timerContainer = document.querySelector('.timer-container');
    if (timerContainer) timerContainer.style.display = 'none';
    
    showToast(`🎉 Test completed! Score: ${averageScore}%`, 'success');
}

// ================== REVIEW MODE FUNCTIONS ==================
function loadReviewQuestionsFromStorage() {
    const saved = localStorage.getItem('reviewQuestions');
    if (saved) {
        try {
            state.reviewQuestions = JSON.parse(saved);
            updateReviewBadge();
        } catch (error) {
            console.error('Error loading review questions:', error);
            state.reviewQuestions = [];
        }
    }
}

function saveReviewQuestionsToStorage() {
    localStorage.setItem('reviewQuestions', JSON.stringify(state.reviewQuestions));
    updateReviewBadge();
}

function addToReview(questionData) {
    // Check if question already in review
    const exists = state.reviewQuestions.some(q => 
        q.question === questionData.question && 
        q.userAnswer === questionData.userAnswer
    );
    
    if (!exists) {
        state.reviewQuestions.push({
            ...questionData,
            date: new Date().toISOString(),
            reviewed: false
        });
        
        saveReviewQuestionsToStorage();
        showToast('📝 Question added to review list', 'info');
    }
}

function loadNextReviewQuestion() {
    if (state.reviewQuestions.length === 0) {
        showToast('📝 No more review questions', 'info');
        elements.question.innerHTML = `
            <div class="question-content">
                <div class="question-placeholder">
                    <i class="fas fa-check-circle"></i>
                    <p>All review questions completed!</p>
                    <p class="upload-subtext">Great job! Keep practicing.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Find next unreviewed question
    const unreviewedIndex = state.reviewQuestions.findIndex(q => !q.reviewed);
    if (unreviewedIndex === -1) {
        // All questions reviewed, reset them
        state.reviewQuestions.forEach(q => q.reviewed = false);
        state.currentReviewIndex = 0;
    } else {
        state.currentReviewIndex = unreviewedIndex;
    }
    
    const reviewItem = state.reviewQuestions[state.currentReviewIndex];
    
    // Display review question
    elements.question.innerHTML = `
        <div class="question-content">
            <p><strong>Review Question ${state.currentReviewIndex + 1}/${state.reviewQuestions.length}</strong></p>
            <p>${reviewItem.question}</p>
            ${reviewItem.category ? `<div class="question-category"><i class="fas fa-tag"></i> ${reviewItem.category}</div>` : ''}
            <div class="safety-warning">
                <i class="fas fa-history"></i>
                <span>Previously answered on ${new Date(reviewItem.date).toLocaleDateString()}</span>
            </div>
        </div>
    `;
    
    // Show user's previous answer
    elements.answer.value = reviewItem.userAnswer || '';
    elements.answer.readOnly = true;
    
    // Show correct answer
    elements.correctAnswer.textContent = reviewItem.correctAnswer || 'No correct answer provided';
    elements.result.classList.add('active');
    
    // Update submit button
    elements.submitBtn.innerHTML = '<i class="fas fa-check"></i> Mark as Reviewed';
    elements.submitBtn.onclick = markAsReviewed;
    
    // Update ask button
    elements.askBtn.innerHTML = '<i class="fas fa-forward"></i> Next Review';
    elements.askBtn.onclick = loadNextReviewQuestion;
}

function markAsReviewed() {
    if (state.currentReviewIndex >= 0 && state.currentReviewIndex < state.reviewQuestions.length) {
        state.reviewQuestions[state.currentReviewIndex].reviewed = true;
        saveReviewQuestionsToStorage();
        
        showToast('✅ Marked as reviewed', 'success');
        
        // Load next question after a delay
        setTimeout(() => {
            loadNextReviewQuestion();
        }, 1000);
    }
}

function updateReviewBadge() {
    const reviewBtn = document.querySelector('[data-mode="review"]');
    if (reviewBtn) {
        // Remove existing badge
        const existingBadge = reviewBtn.querySelector('.review-badge');
        if (existingBadge) existingBadge.remove();
        
        // Add new badge if there are review questions
        const unreviewedCount = state.reviewQuestions.filter(q => !q.reviewed).length;
        if (unreviewedCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'review-badge';
            badge.textContent = unreviewedCount;
            badge.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: var(--danger);
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
            `;
            reviewBtn.style.position = 'relative';
            reviewBtn.appendChild(badge);
        }
    }
}

// ================== FREE TIME FUNCTION ==================
function activateFreeTime() {
    if (!state.currentIndex) {
        showToast('❌ No active question', 'warning');
        return;
    }
    
    state.isFreeTime = !state.isFreeTime;
    
    if (state.isFreeTime) {
        clearInterval(state.timer);
        
        elements.freeTimeBtn.classList.add('free-time-active');
        elements.freeTimeBtn.innerHTML = '<i class="fas fa-hourglass-start"></i> Free Time Active';
        elements.timer.textContent = '∞';
        elements.timerBar.style.width = '100%';
        elements.timerBar.style.background = 'var(--success)';
        
        const existingIndicator = elements.question.querySelector('.free-time-indicator');
        if (!existingIndicator) {
            const freeTimeIndicator = document.createElement('div');
            freeTimeIndicator.className = 'free-time-indicator';
            freeTimeIndicator.innerHTML = '<i class="fas fa-infinity"></i> Free Time';
            elements.question.appendChild(freeTimeIndicator);
        }
        
        showToast('⏳ Free time activated! Take your time...', 'success');
    } else {
        const time = state.currentDifficulty === 'easy' ? 60 : 
                    state.currentDifficulty === 'medium' ? 40 : 20;
        startTimer(time);
        
        elements.freeTimeBtn.classList.remove('free-time-active');
        elements.freeTimeBtn.innerHTML = '<i class="fas fa-hourglass-end"></i> Free Time';
        
        const indicator = elements.question.querySelector('.free-time-indicator');
        if (indicator) indicator.remove();
        
        showToast('⏰ Timer resumed!', 'info');
    }
}

// ================== TIMER MANAGEMENT ==================
function startTimer(seconds) {
    clearInterval(state.timer);
    clearTimeout(state.autoAskTimer);
    clearTimeout(state.typingTimer);
    
    state.isFreeTime = false;
    if (elements.freeTimeBtn) {
        elements.freeTimeBtn.classList.remove('free-time-active');
        elements.freeTimeBtn.innerHTML = '<i class="fas fa-hourglass-end"></i> Free Time';
    }
    
    const indicator = elements.question.querySelector('.free-time-indicator');
    if (indicator) indicator.remove();
    
    state.timeLeft = seconds;
    state.totalTime = seconds;
    elements.timer.textContent = seconds;
    updateTimerProgress();
    
    state.timer = setInterval(() => {
        if ((!state.userIsTyping && !state.isFreeTime) || state.timeLeft <= 5) {
            state.timeLeft--;
            elements.timer.textContent = state.isFreeTime ? '∞' : state.timeLeft;
            updateTimerProgress();
        }
        
        if (state.timeLeft <= 0 && !state.isFreeTime) {
            clearInterval(state.timer);
            if (!state.userIsTyping) {
                submitAnswer(true);
            } else {
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

// ================== CATEGORY MANAGEMENT ==================
async function loadCategories() {
    try {
        const response = await fetch(`${BASE_URL}/api/categories`);
        if (!response.ok) throw new Error('Failed to load categories');
        
        const data = await response.json();
        
        elements.categorySelect.innerHTML = '<option value="">All Categories</option>';
        
        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                elements.categorySelect.appendChild(option);
            });
            
            await updateQuestionCount();
            
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

// ================== QUESTION MANAGEMENT ==================
async function askQuestion() {
    if (elements.askBtn.classList.contains('loading')) {
        showToast('⏳ Please wait, loading question...', 'warning');
        return;
    }
    
    // Check if we're in test mode and need to start test
    if (state.currentStudyMode === STUDY_MODES.TEST) {
        startTest();
        return;
    }
    
    // Check if we're in review mode
    if (state.currentStudyMode === STUDY_MODES.REVIEW) {
        loadNextReviewQuestion();
        return;
    }
    
    clearInterval(state.timer);
    clearTimeout(state.autoAskTimer);
    clearTimeout(state.typingTimer);
    
    state.isAutoAsking = false;
    state.isFreeTime = false;
    state.userIsTyping = false;
    
    if (elements.freeTimeBtn) {
        elements.freeTimeBtn.classList.remove('free-time-active');
        elements.freeTimeBtn.innerHTML = '<i class="fas fa-hourglass-end"></i> Free Time';
    }
    
    elements.result.classList.remove('active');
    elements.submitBtn.disabled = false;
    elements.skipBtn.disabled = false;
    
    const category = elements.categorySelect.value || '__all__';
    
    if (state.askedByCategory[category] && state.askedByCategory[category].size >= state.maxQuestionsPerSession) {
        if (confirm(`You've practiced ${state.maxQuestionsPerSession} questions. Reset and start over?`)) {
            state.askedByCategory[category].clear();
            showToast('🔄 Reset questions for this category', 'info');
        }
    }
    
    state.askedByCategory[category] = state.askedByCategory[category] || new Set();
    
    let url = `${BASE_URL}/api/question`;
    if (category !== '__all__') {
        url += `?category=${encodeURIComponent(category)}`;
    }
    
    elements.askBtn.classList.add('loading');
    elements.askBtn.disabled = true;
    elements.question.innerHTML = `
        <div class="loading-placeholder">
            <div class="loading-spinner"></div>
            <p>Loading question...</p>
        </div>
    `;
    
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
    });
    
    try {
        const response = await Promise.race([fetch(url), timeoutPromise]);
        
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        
        const data = await response.json();
        
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
            showToast(data.error || '❌ No questions available', 'warning');
            return;
        }
        
        state.askedByCategory[category].add(data.index);
        state.currentIndex = data.index;
        state.questionStartTime = Date.now();
        
        elements.question.innerHTML = `
            <div class="question-content">
                <p>${data.question}</p>
                ${data.category ? `<div class="question-category"><i class="fas fa-tag"></i> ${data.category}</div>` : ''}
            </div>
        `;
        
        elements.answer.value = '';
        updateCharCount();
        
        if (!state.isListening) {
            setTimeout(() => elements.answer.focus(), 300);
        }
        
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
        updateLearningProgress();
        askQuestion();
    }
}

// ================== ANSWER SUBMISSION ==================
async function submitAnswer(auto = false) {
    if (elements.submitBtn.disabled && !auto) return;
    if (state.currentIndex === null) {
        showToast('❌ No active question', 'warning');
        return;
    }
    
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
    
    if (state.questionStartTime) {
        const responseTime = Math.round((Date.now() - state.questionStartTime) / 1000);
        state.stats.responseTimes.push(responseTime);
        state.stats.sessionQuestions++;
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
        
        if (!response.ok) throw new Error('Failed to submit answer');
        
        const data = await response.json();
        
        showResult(data);
        updateStats(data.similarity);
        saveToHistory(data, userAnswer);
        checkAchievements();
        updateProgress();
        
        
        // Add to review if answer was incorrect
        if (data.similarity < 70) {
            addToReview({
                question: data.question,
                userAnswer: userAnswer,
                correctAnswer: data.correctAnswer,
                category: elements.categorySelect.value || 'General'
            });
        }
        
        if (typeof updateLearningProgress === 'function') {
        updateLearningProgress();
        }

        showToast('⏳ Next question in 2 seconds...', 'info');
        state.autoAskTimer = setTimeout(() => {
            loadNextQuestion();
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting answer:', error);
        showToast('❌ Error submitting answer', 'error');
        elements.submitBtn.disabled = false;
        elements.skipBtn.disabled = false;
    }
}

function loadNextQuestion() {
    if (state.isAutoAsking) return;
    
    state.isAutoAsking = true;
    state.currentIndex = null;
    state.isFreeTime = false;
    state.userIsTyping = false;
    clearTimeout(state.typingTimer);
    
    if (elements.freeTimeBtn) {
        elements.freeTimeBtn.classList.remove('free-time-active');
        elements.freeTimeBtn.innerHTML = '<i class="fas fa-hourglass-end"></i> Free Time';
    }
    
    setTimeout(() => {
        askQuestion();
        state.isAutoAsking = false;
    }, 500);
}

function showResult(data) {
    elements.result.classList.add('active');
    elements.similarityValue.textContent = data.similarity;
    elements.correctAnswer.textContent = data.correctAnswer || 'No correct answer provided';
    
    const percentage = data.similarity;
    elements.scoreCircle.style.background = `conic-gradient(var(--primary) 0% ${percentage}%, var(--border) ${percentage}% 100%)`;
    
    let feedback = '';
    let feedbackClass = '';
    
    if (percentage >= 90) {
        feedback = 'Excellent! 🎯';
        feedbackClass = 'excellent';
        state.stats.perfectScores++;
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

// ================== STATISTICS MANAGEMENT ==================
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
    
    elements.answered.textContent = state.stats.answered;
    elements.streak.textContent = state.stats.streak;
    elements.multiplier.textContent = `${multiplier}x`;
    elements.multiplier.className = `multiplier mult-${multiplier}`;
    elements.score.textContent = Math.round(state.stats.score);
    
    updateAvgAccuracy();
    updateAvgTime();
    updateLeaderboard();
    
    saveScore();
}

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

// ================== SCORE MANAGEMENT ==================
function saveScore() {
    const scoreData = {
        answered: state.stats.answered,
        streak: state.stats.streak,
        bestStreak: state.stats.bestStreak,
        score: state.stats.score,
        totalAccuracy: state.stats.totalAccuracy,
        responseTimes: state.stats.responseTimes,
        perfectScores: state.stats.perfectScores,
        sessionQuestions: state.stats.sessionQuestions,
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

function resetScore() {
    if (confirm('Are you sure you want to reset your score? This cannot be undone.')) {
        state.stats = { 
            answered: 0, 
            streak: 0, 
            score: 0,
            totalAccuracy: 0,
            responseTimes: [],
            bestStreak: 0,
            perfectScores: 0,
            sessionQuestions: 0
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
        updateLearningProgress();
        showToast('🔄 Score reset successfully', 'success');
    }
}

function updateLeaderboard() {
    const bestScore = Math.round(state.stats.score);
    elements.leaderboard.innerHTML = `
        <div class="score-value">${bestScore}</div>
        <div class="score-label">Best Score</div>
    `;
}

// ================== VOICE RECOGNITION ==================
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

// ================== CSV UPLOAD ==================
async function uploadCSV() {
    const file = elements.fileInput.files[0];
    if (!file) {
        showToast('❌ Please select a CSV file first', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
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
            
            elements.fileInput.value = '';
            elements.uploadArea.innerHTML = `
                <i class="fas fa-check-circle upload-icon" style="color: var(--success)"></i>
                <p>Upload successful!</p>
                <p class="upload-subtext">${data.count} questions loaded</p>
            `;
            
            document.getElementById('uploadBtn').disabled = true;
            document.getElementById('uploadBtn').innerHTML = '<i class="fas fa-upload"></i> Upload CSV';
            
            elements.questionCount.textContent = data.count || 0;
            
            await loadCategories();
            
            state.askedByCategory = {};
            
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
        
        setTimeout(() => {
            elements.uploadArea.innerHTML = originalContent;
        }, 5000);
    }
}

// ================== ADVANCED FEATURES ==================
function loadProgressHistory() {
    const history = JSON.parse(localStorage.getItem('progressHistory') || '[]');
    return history;
}

function saveToHistory(resultData, userAnswer) {
    const historyItem = {
        date: new Date().toISOString(),
        question: resultData.question,
        userAnswer: userAnswer,
        correctAnswer: resultData.correctAnswer,
        accuracy: resultData.similarity,
        responseTime: state.stats.responseTimes[state.stats.responseTimes.length - 1] || 0,
        category: elements.categorySelect.value || 'General'
    };
    
    let history = JSON.parse(localStorage.getItem('questionHistory') || '[]');
    history.push(historyItem);
    
    if (history.length > 100) {
        history = history.slice(-100);
    }
    
    localStorage.setItem('questionHistory', JSON.stringify(history));
    state.questionHistory = history;
}

function updateProgress() {
    const progressData = {
        date: new Date().toISOString().split('T')[0],
        questionsAnswered: state.stats.answered,
        avgAccuracy: Math.round(state.stats.totalAccuracy / state.stats.answered) || 0,
        streak: state.stats.streak,
        score: state.stats.score
    };
    
    let progressHistory = JSON.parse(localStorage.getItem('progressHistory') || '[]');
    
    const todayIndex = progressHistory.findIndex(p => p.date === progressData.date);
    if (todayIndex !== -1) {
        progressHistory[todayIndex] = progressData;
    } else {
        progressHistory.push(progressData);
    }
    
    if (progressHistory.length > 30) {
        progressHistory = progressHistory.slice(-30);
    }
    
    localStorage.setItem('progressHistory', JSON.stringify(progressHistory));
}

const ACHIEVEMENTS = {
    FIRST_QUESTION: {
        id: 'first_question',
        name: 'First Step',
        description: 'Answer your first question',
        icon: 'fas fa-star',
        check: (stats) => stats.answered >= 1
    },
    STREAK_5: {
        id: 'streak_5',
        name: 'On Fire!',
        description: 'Achieve a 5-question streak',
        icon: 'fas fa-fire',
        check: (stats) => stats.streak >= 5
    },
    PERFECT_SCORE: {
        id: 'perfect_score',
        name: 'Perfect!',
        description: 'Score 100% accuracy on a question',
        icon: 'fas fa-trophy',
        check: (stats) => stats.perfectScores >= 1
    },
    MARATHON: {
        id: 'marathon',
        name: 'Marathon',
        description: 'Answer 50 questions in one session',
        icon: 'fas fa-running',
        check: (stats) => stats.sessionQuestions >= 50
    },
    CONSISTENT_LEARNER: {
        id: 'consistent_learner',
        name: 'Consistent Learner',
        description: 'Practice for 5 consecutive days',
        icon: 'fas fa-calendar-check',
        check: () => {
            const history = loadProgressHistory();
            if (history.length < 5) return false;
            
            const dates = history.map(h => h.date).sort();
            const last5Days = dates.slice(-5);
            
            for (let i = 1; i < last5Days.length; i++) {
                const diff = (new Date(last5Days[i]) - new Date(last5Days[i-1])) / (1000 * 60 * 60 * 24);
                if (diff !== 1) return false;
            }
            return true;
        }
    }
};

function checkAchievements() {
    const unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
    const newlyUnlocked = [];
    
    Object.values(ACHIEVEMENTS).forEach(achievement => {
        if (!unlocked.includes(achievement.id) && achievement.check(state.stats)) {
            unlocked.push(achievement.id);
            newlyUnlocked.push(achievement);
            showAchievement(achievement);
        }
    });
    
    localStorage.setItem('achievements', JSON.stringify(unlocked));
    return newlyUnlocked;
}

function showAchievement(achievement) {
    const achievementHtml = `
        <div class="achievement-toast">
            <div class="achievement-icon">
                <i class="${achievement.icon}"></i>
            </div>
            <div class="achievement-content">
                <h4>Achievement Unlocked!</h4>
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
            </div>
        </div>
    `;
    
    const container = document.createElement('div');
    container.className = 'achievement-container';
    container.innerHTML = achievementHtml;
    document.body.appendChild(container);
    
    setTimeout(() => {
        if (container.parentNode) {
            container.remove();
        }
    }, 5000);
}

function analyzeTopicStrength() {
    const topicPerformance = {};
    
    state.questionHistory.forEach(item => {
        const topic = item.category || 'General';
        if (!topicPerformance[topic]) {
            topicPerformance[topic] = {
                total: 0,
                correct: 0,
                avgTime: 0,
                times: []
            };
        }
        
        topicPerformance[topic].total++;
        if (item.accuracy >= 70) topicPerformance[topic].correct++;
        topicPerformance[topic].times.push(item.responseTime);
    });
    
    Object.keys(topicPerformance).forEach(topic => {
        const data = topicPerformance[topic];
        data.accuracy = Math.round((data.correct / data.total) * 100);
        data.avgTime = Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length);
        data.strength = calculateStrength(data.accuracy, data.avgTime);
    });
    
    return topicPerformance;
}

function calculateStrength(accuracy, avgTime) {
    if (accuracy >= 90 && avgTime <= 30) return 'excellent';
    if (accuracy >= 80 && avgTime <= 45) return 'good';
    if (accuracy >= 70) return 'fair';
    return 'needs-improvement';
}

function getRecommendations() {
    const recommendations = [];
    const topicStrength = analyzeTopicStrength();
    
    Object.entries(topicStrength).forEach(([topic, data]) => {
        if (data.strength === 'needs-improvement' && data.total >= 3) {
            recommendations.push({
                type: 'weak-topic',
                topic: topic,
                message: `Focus on ${topic}`,
                details: `Current accuracy: ${data.accuracy}% (needs improvement)`,
                icon: 'fas fa-exclamation-triangle'
            });
        }
    });
    
    if (state.stats.streak < 3 && state.stats.answered > 10) {
        recommendations.push({
            type: 'consistency',
            message: 'Build consistency',
            details: 'Try to maintain a 3-question streak',
            icon: 'fas fa-chart-line'
        });
    }
    
    const avgTime = state.stats.responseTimes.length > 0 
        ? Math.round(state.stats.responseTimes.reduce((a, b) => a + b, 0) / state.stats.responseTimes.length)
        : 0;
    
    if (avgTime > 50 && state.stats.answered > 5) {
        recommendations.push({
            type: 'speed',
            message: 'Improve response time',
            details: `Current average: ${avgTime}s (try to reduce to 40s)`,
            icon: 'fas fa-bolt'
        });
    }
    
    return recommendations.slice(0, 3);
}

// ================== UTILITY FUNCTIONS ==================
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
    elements.toast.classList.remove('show');
    
    setTimeout(() => {
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        elements.toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        elements.toast.className = `toast ${type} show`;
        
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
            if (confetti.parentNode) {
                confetti.remove();
            }
        }, 2000);
    }
}

// ================== CLEANUP ==================
window.addEventListener('beforeunload', () => {
    clearInterval(state.timer);
    clearTimeout(state.autoAskTimer);
    clearTimeout(state.typingTimer);
    stopListening();
    
    const sessionData = {
        endTime: Date.now(),
        questionsAnswered: state.stats.sessionQuestions
    };
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
});

// ================== GLOBAL FUNCTIONS ==================
window.setDifficulty = setDifficulty;
window.setStudyMode = setStudyMode;
window.askQuestion = askQuestion;
window.skipQuestion = skipQuestion;
window.submitAnswer = submitAnswer;
window.startListening = startListening;
window.stopListening = stopListening;
window.uploadCSV = uploadCSV;
window.resetScore = resetScore;
window.activateFreeTime = activateFreeTime;

// ================== INITIALIZE APP ==================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}