// ================== LEARNING PROGRESS DASHBOARD ==================
// Simple and stable version

console.log('📊 Learning Progress JS loading...');

// Global chart variable
let progressChart = null;

// ================== GLOBAL FUNCTIONS ==================

// Initialize learning progress dashboard
window.initLearningProgress = function() {
    console.log('📊 Initializing Learning Progress Dashboard...');
    
    // Check if required elements exist
    const progressEl = document.querySelector('.circular-progress');
    if (!progressEl) {
        console.error('❌ Learning Progress elements not found');
        return;
    }
    
    // Initial load of progress data
    loadProgressData();
    
    // Set up auto-refresh every 30 seconds
    setInterval(loadProgressData, 30000);
    
    // Initialize chart after a small delay
    setTimeout(initProgressChart, 1000);
    
    console.log('✅ Learning Progress Dashboard initialized');
};

// Update learning progress dashboard
window.updateLearningProgress = function() {
    console.log('🔄 Updating Learning Progress Dashboard...');
    loadProgressData();
};

// ================== MAIN FUNCTIONS ==================

// Load all progress data
function loadProgressData() {
    try {
        // Get data from localStorage
        const savedScore = JSON.parse(localStorage.getItem('interviewPracticeScore') || '{}');
        const history = JSON.parse(localStorage.getItem('progressHistory') || '[]');
        const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        const questionHistory = JSON.parse(localStorage.getItem('questionHistory') || '[]');
        
        // Default stats if not available
        const stats = {
            answered: savedScore.answered || 0,
            streak: savedScore.streak || 0,
            bestStreak: savedScore.bestStreak || 0,
            totalAccuracy: savedScore.totalAccuracy || 0,
            responseTimes: savedScore.responseTimes || [],
            sessionQuestions: savedScore.sessionQuestions || 0
        };
        
        // Calculate overall progress
        const overallProgress = calculateOverallProgress(stats, history);
        
        // Update circular progress
        updateCircularProgress(overallProgress);
        
        // Update stats
        updateProgressStats(stats, achievements, questionHistory);
        
        // Update weekly progress
        updateWeeklyProgress(history);
        
        // Update detailed statistics
        updateDetailedStats(stats, questionHistory);
        
        // Generate recommendations
        generateRecommendations(stats, questionHistory);
        
        // Update progress chart if available
        updateProgressChart(history);
        
        // Show/hide placeholder
        toggleProgressPlaceholder(stats.answered > 0);
        
    } catch (error) {
        console.error('Error loading progress data:', error);
    }
}

// Calculate overall progress (0-100%)
function calculateOverallProgress(stats, history) {
    if (!stats || stats.answered === 0) return 0;
    
    let score = 0;
    
    // 1. Accuracy (40% weight)
    if (stats.answered > 0) {
        const accuracy = Math.min(100, stats.totalAccuracy / stats.answered);
        score += accuracy * 0.4;
    }
    
    // 2. Consistency (30% weight)
    score += Math.min(100, (stats.bestStreak || 0) * 10) * 0.3;
    
    // 3. Volume (20% weight)
    score += Math.min(100, (stats.answered || 0) * 2) * 0.2;
    
    // 4. Speed (10% weight)
    if (stats.responseTimes && stats.responseTimes.length > 0) {
        const avgTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
        score += Math.max(0, 100 - (avgTime * 2)) * 0.1;
    }
    
    return Math.round(score);
}

// Calculate topic mastery
function calculateTopicMastery(questionHistory) {
    if (!questionHistory || questionHistory.length === 0) return 0;
    
    const topicPerformance = {};
    
    // Calculate accuracy per topic
    questionHistory.forEach(item => {
        if (!item) return;
        
        const topic = item.category || 'General';
        if (!topicPerformance[topic]) {
            topicPerformance[topic] = {
                total: 0,
                correct: 0
            };
        }
        topicPerformance[topic].total++;
        if (item.accuracy >= 70) {
            topicPerformance[topic].correct++;
        }
    });
    
    // Count topics with > 80% accuracy and at least 3 questions
    let masteredTopics = 0;
    Object.values(topicPerformance).forEach(topic => {
        if (topic.total >= 3) {
            const accuracy = (topic.correct / topic.total) * 100;
            if (accuracy >= 80) {
                masteredTopics++;
            }
        }
    });
    
    return masteredTopics;
}

// Update circular progress indicator
function updateCircularProgress(progress) {
    const circularProgress = document.querySelector('.circular-progress');
    const progressPercentage = document.querySelector('.progress-percentage');
    
    if (circularProgress && progressPercentage) {
        progressPercentage.textContent = `${progress}%`;
        circularProgress.style.background = 
            `conic-gradient(var(--primary) 0% ${progress}%, var(--border) ${progress}% 100%)`;
        circularProgress.setAttribute('data-progress', progress);
    }
}

// Update progress stats
function updateProgressStats(stats, achievements, questionHistory) {
    // Topic Mastery
    const topicMastery = calculateTopicMastery(questionHistory);
    const topicMasteryEl = document.getElementById('topicMastery');
    if (topicMasteryEl) topicMasteryEl.textContent = topicMastery;
    
    // Current Streak
    const currentStreakEl = document.getElementById('currentStreak');
    if (currentStreakEl) currentStreakEl.textContent = stats.streak || 0;
    
    // Average Response Time
    let avgResponse = 0;
    if (stats.responseTimes && stats.responseTimes.length > 0) {
        avgResponse = Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length);
    }
    const avgResponseEl = document.getElementById('avgResponseTime');
    if (avgResponseEl) avgResponseEl.textContent = `${avgResponse}s`;
    
    // Achievements Count
    const achievementsEl = document.getElementById('achievementsCount');
    if (achievementsEl) achievementsEl.textContent = achievements.length || 0;
}

// Update weekly progress bars
function updateWeeklyProgress(history) {
    try {
        // Calculate this week's data
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const weekHistory = history.filter(item => {
            if (!item || !item.date) return false;
            try {
                const itemDate = new Date(item.date);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate >= startOfWeek;
            } catch (e) {
                return false;
            }
        });
        
        // Calculate weekly accuracy
        let weeklyAccuracy = 0;
        if (weekHistory.length > 0) {
            const correctAnswers = weekHistory.filter(item => item.avgAccuracy >= 70).length;
            weeklyAccuracy = Math.round((correctAnswers / weekHistory.length) * 100);
        }
        
        // Calculate weekly questions (with target of 20 questions/week)
        const weeklyQuestions = weekHistory.length;
        const questionsTarget = 20;
        const questionsProgress = Math.min(100, (weeklyQuestions / questionsTarget) * 100);
        
        // Update accuracy bar and value
        const accuracyBar = document.getElementById('accuracyBar');
        const accuracyValue = document.getElementById('accuracyValue');
        if (accuracyBar && accuracyValue) {
            accuracyBar.style.width = `${weeklyAccuracy}%`;
            accuracyValue.textContent = `${weeklyAccuracy}%`;
            
            // Update color based on accuracy
            if (weeklyAccuracy >= 80) {
                accuracyBar.style.background = 'linear-gradient(90deg, var(--success), #10b981)';
            } else if (weeklyAccuracy >= 60) {
                accuracyBar.style.background = 'linear-gradient(90deg, var(--warning), #f59e0b)';
            } else {
                accuracyBar.style.background = 'linear-gradient(90deg, var(--danger), #ef4444)';
            }
        }
        
        // Update questions bar and value
        const questionsBar = document.getElementById('questionsBar');
        const questionsValue = document.getElementById('questionsValue');
        if (questionsBar && questionsValue) {
            questionsBar.style.width = `${questionsProgress}%`;
            questionsValue.textContent = weeklyQuestions;
            
            // Update color based on progress
            if (questionsProgress >= 80) {
                questionsBar.style.background = 'linear-gradient(90deg, var(--success), #10b981)';
            } else if (questionsProgress >= 50) {
                questionsBar.style.background = 'linear-gradient(90deg, var(--warning), #f59e0b)';
            } else {
                questionsBar.style.background = 'linear-gradient(90deg, var(--danger), #ef4444)';
            }
        }
    } catch (error) {
        console.error('Error updating weekly progress:', error);
    }
}

// Update detailed statistics
function updateDetailedStats(stats, questionHistory) {
    try {
        const totalQuestions = stats.answered || 0;
        const correctAnswers = questionHistory.filter(item => item && item.accuracy >= 70).length;
        const accuracyRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        const bestStreak = stats.bestStreak || 0;
        
        let avgResponse = 0;
        if (stats.responseTimes && stats.responseTimes.length > 0) {
            avgResponse = Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length);
        }
        
        const masteredTopics = calculateTopicMastery(questionHistory);
        
        // Update all elements
        const elements = {
            'totalQuestions': totalQuestions,
            'correctAnswers': correctAnswers,
            'accuracyRate': `${accuracyRate}%`,
            'bestStreakValue': bestStreak,
            'timePerQuestion': `${avgResponse}s`,
            'masteredTopics': masteredTopics
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    } catch (error) {
        console.error('Error updating detailed stats:', error);
    }
}

// Generate smart recommendations
function generateRecommendations(stats, questionHistory) {
    const container = document.getElementById('recommendationsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!stats || stats.answered === 0) {
        container.innerHTML = `
            <div class="analyzing-state">
                <i class="fas fa-chart-line"></i>
                <p>Analyzing your performance...</p>
            </div>
        `;
        return;
    }
    
    const recommendations = [];
    
    // Recommendation 1: Based on accuracy
    const accuracy = stats.answered > 0 ? 
        Math.round(stats.totalAccuracy / stats.answered) : 0;
    
    if (accuracy < 70) {
        recommendations.push({
            icon: 'fas fa-bullseye',
            title: 'Improve Accuracy',
            description: `Your current accuracy is ${accuracy}%. Focus on understanding concepts better before answering.`
        });
    } else if (accuracy < 85) {
        recommendations.push({
            icon: 'fas fa-chart-line',
            title: 'Increase Accuracy',
            description: `Great start at ${accuracy}%! Aim for 85%+ by reviewing incorrect answers.`
        });
    } else {
        recommendations.push({
            icon: 'fas fa-trophy',
            title: 'Excellent Accuracy!',
            description: `${accuracy}% accuracy is outstanding! Challenge yourself with harder questions.`
        });
    }
    
    // Recommendation 2: Based on streak
    if (stats.streak < 3 && stats.answered > 5) {
        recommendations.push({
            icon: 'fas fa-fire',
            title: 'Build Consistency',
            description: 'Try to maintain a streak of 3+ correct answers in a row.'
        });
    }
    
    // Recommendation 3: Based on topic mastery
    const masteredTopics = calculateTopicMastery(questionHistory);
    if (masteredTopics === 0 && stats.answered >= 10) {
        recommendations.push({
            icon: 'fas fa-book',
            title: 'Master a Topic',
            description: 'Focus on one topic until you achieve 80%+ accuracy.'
        });
    }
    
    // Recommendation 4: Based on daily practice
    const today = new Date().toISOString().split('T')[0];
    const todayQuestions = questionHistory.filter(item => 
        item && item.date && item.date.startsWith(today)
    ).length;
    
    if (todayQuestions === 0 && stats.answered > 0) {
        recommendations.push({
            icon: 'fas fa-calendar-day',
            title: 'Daily Practice',
            description: 'Practice at least 5 questions today to maintain consistency.'
        });
    }
    
    // Display recommendations
    if (recommendations.length > 0) {
        const list = document.createElement('div');
        list.className = 'recommendations-list';
        
        // Show top 3 recommendations
        recommendations.slice(0, 3).forEach(rec => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <div class="recommendation-icon">
                    <i class="${rec.icon}"></i>
                </div>
                <div class="recommendation-content">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                </div>
            `;
            list.appendChild(item);
        });
        
        container.appendChild(list);
    } else {
        container.innerHTML = `
            <div class="analyzing-state">
                <i class="fas fa-check-circle"></i>
                <p>Keep up the good work! All recommendations are met.</p>
            </div>
        `;
    }
}

// Toggle progress placeholder
function toggleProgressPlaceholder(hasData) {
    try {
        const placeholder = document.getElementById('progressDataPlaceholder');
        const content = document.getElementById('progressDataContent');
        
        if (placeholder && content) {
            if (hasData) {
                placeholder.style.display = 'none';
                content.style.display = 'block';
            } else {
                placeholder.style.display = 'block';
                content.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error toggling placeholder:', error);
    }
}

// ================== CHART FUNCTIONS ==================

// Initialize progress chart
function initProgressChart() {
    const ctx = document.getElementById('weeklyProgressChart');
    if (!ctx) {
        console.log('Weekly progress chart canvas not found, skipping chart initialization');
        return;
    }
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not available, skipping chart initialization');
        return;
    }
    
    try {
        // Clean up any existing chart
        if (progressChart) {
            try {
                progressChart.destroy();
            } catch (e) {
                // Ignore destroy errors
            }
            progressChart = null;
        }
        
        // Clear any existing chart instances on this canvas
        if (Chart.instances) {
            for (let i = 0; i < Chart.instances.length; i++) {
                const chart = Chart.instances[i];
                if (chart && chart.ctx && chart.ctx.canvas === ctx) {
                    try {
                        chart.destroy();
                    } catch (e) {
                        // Ignore destroy errors
                    }
                }
            }
        }
        
        // Get history data
        const history = JSON.parse(localStorage.getItem('progressHistory') || '[]');
        const weeklyData = getWeeklyData(history);
        
        // Create new chart
        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeklyData.days,
                datasets: [
                    {
                        label: 'Accuracy (%)',
                        data: weeklyData.accuracy,
                        borderColor: 'var(--primary)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'var(--text-secondary)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'var(--border)'
                        },
                        ticks: {
                            color: 'var(--text-secondary)',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
        
        console.log('✅ Progress chart initialized successfully');
        
    } catch (error) {
        console.error('Error initializing progress chart:', error);
        // Hide chart container if chart fails
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.display = 'none';
        }
    }
}

// Update progress chart
function updateProgressChart(history) {
    if (!progressChart) {
        return;
    }
    
    try {
        const weeklyData = getWeeklyData(history);
        
        // Update chart data
        progressChart.data.labels = weeklyData.days;
        progressChart.data.datasets[0].data = weeklyData.accuracy;
        
        // Update chart
        progressChart.update('none');
        
    } catch (error) {
        console.error('Error updating progress chart:', error);
    }
}

// Get weekly data for chart
function getWeeklyData(history) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    // Get data for last 7 days
    const weeklyData = {
        days: [],
        accuracy: [],
        questions: []
    };
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Add day label
        weeklyData.days.push(days[date.getDay()]);
        
        // Get questions for this day
        const dayQuestions = history.filter(item => 
            item && item.date && item.date.startsWith(dateStr)
        );
        
        // Calculate accuracy for this day
        let dayAccuracy = 0;
        if (dayQuestions.length > 0) {
            const correct = dayQuestions.filter(item => item.avgAccuracy >= 70).length;
            dayAccuracy = Math.round((correct / dayQuestions.length) * 100);
        }
        
        weeklyData.questions.push(dayQuestions.length);
        weeklyData.accuracy.push(dayAccuracy);
    }
    
    return weeklyData;
}

// Clean up chart when page unloads
function cleanupCharts() {
    if (progressChart) {
        try {
            progressChart.destroy();
            progressChart = null;
        } catch (error) {
            // Ignore cleanup errors
        }
    }
}

// Add cleanup event listeners
window.addEventListener('beforeunload', cleanupCharts);

// ================== INITIALIZATION ==================

// Self-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ Learning Progress JS ready');
        // Check if we should auto-initialize
        setTimeout(() => {
            const progressEl = document.querySelector('.circular-progress');
            if (progressEl && typeof window.initLearningProgress === 'function') {
                window.initLearningProgress();
            }
        }, 1000);
    });
} else {
    console.log('✅ Learning Progress JS ready (DOM already loaded)');
    setTimeout(() => {
        const progressEl = document.querySelector('.circular-progress');
        if (progressEl && typeof window.initLearningProgress === 'function') {
            window.initLearningProgress();
        }
    }, 1000);
}

console.log('✅ learning-progress.js loaded successfully');