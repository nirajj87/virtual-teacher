<!-- Improved README.md for your Interview Practice Web App -->

# 🧠 Interview Practice Web App

> A smart, interactive platform to master technical interviews with AI-powered evaluation and real-time progress tracking.

**Live Demo:** 🌐 [https://devsupport.co.in/virtual-teacher/](https://devsupport.co.in/virtual-teacher/)

![Application Screenshot](https://github.com/nirajj87/virtual-teacher/blob/main/public/vertual-teacher.png)

---
## 📖 Table of Contents
1.  [✨ Overview](#-overview)
2.  [🚀 Features](#-features)
3.  [🛠️ Tech Stack](#️-tech-stack)
4.  [📦 Installation](#-installation)
5.  [⚙️ Configuration](#️-configuration)
6.  [🧪 Usage](#-usage)
7.  [📁 Project Structure](#-project-structure)
8.  [🤝 Contributing](#-contributing)
9.  [📜 License](#-license)

---
## ✨ Overview

The **Interview Practice Web App** is a comprehensive tool designed to help learners and job seekers practice technical interview questions effectively. Users can upload custom question banks via CSV, practice under timed conditions, receive instant accuracy feedback, and track their learning journey with detailed analytics.

**Core Concept:** Transform static Q&A lists into an interactive, gamified learning experience that adapts to user performance.

---
## 🚀 Features

### 🎯 **Practice Modes**
*   **Practice Mode**: Answer questions with instant feedback and correct answers.
*   **Test Mode**: Simulate a real exam with 10 questions and a 30-second timer each[citation:2].
*   **Review Mode**: Revisit and master previously incorrectly answered questions.
*   **Free Time Mode**: Disable the timer for complex problem-solving.

### 📊 **Learning Intelligence**
*   **Real-time Evaluation**: Uses string similarity algorithms to score open-ended answers.
*   **Progress Dashboard**: Visual charts track accuracy, streaks, and time-per-question over time.
*   **Smart Recommendations**: The system analyzes weak spots and suggests areas for improvement.
*   **Achievement System**: Unlock badges for milestones like first question, perfect scores, and consistency streaks.

### 🎨 **User Experience**
*   **Voice-to-Text**: Speak your answers using the Web Speech API.
*   **Adaptive Timer**: Configurable timers for Easy (60s), Medium (40s), and Hard (20s) difficulties.
*   **Theme Switching**: Toggle between light and dark modes.
*   **PWA Support**: Install as an app and work offline.

---
## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Vanilla JS, HTML5, CSS3 (with Variables for Theming), Chart.js |
| **Backend** | Node.js, Express.js |
| **Data Processing** | CSV-Parser, String-Similarity NPM Package |
| **Persistence** | LocalStorage (Client), File System (Server) |
| **Deployment** | cPanel with PM2 Process Manager |

---
## 📦 Installation & Quick Start

Follow these steps to run the project locally:

```bash
# 1. Clone the repository
git clone https://github.com/nirajj87/virtual-teacher.git
cd virtual-teacher

# 2. Install backend dependencies
npm install

# 3. Start the development server
npm start
# or use 'npm run dev' for auto-reload

# 4. Open your browser and navigate to:
# http://localhost:3000
Prerequisite: Ensure you have Node.js (v16 or higher) installed on your system.

⚙️ Configuration
Backend (server.js)
Key server-side settings can be adjusted:

javascript
const config = {
  port: process.env.PORT || 3000,
  uploadLimit: '5mb',
  questionLimit: 50, // Max questions per session per category
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};
Frontend (app.js)
Client-side constants for game mechanics:

javascript
const CONFIG = {
  TIMER: { EASY: 60, MEDIUM: 40, HARD: 20, TEST: 30 },
  SCORING: { PERFECT_THRESHOLD: 90, GOOD_THRESHOLD: 70 }
};
🧪 Usage Guide
For Learners
Select a category and difficulty.

Click "Ask Question" - a random question loads with a countdown timer.

Type or speak your answer in the provided area.

Submit to see your accuracy score and the model answer.

Switch to "Review Mode" to focus on your past mistakes.

For Admins/Content Creators
Prepare a CSV file with question, answer, category columns.

Use the upload panel to import the file. The system automatically parses and categorizes questions.

The new questions are instantly available for practice in the selected category.

CSV Format Example:

csv
question,answer,category
"What is a Closure in JavaScript?","A function with access to its outer scope","JavaScript"
"Explain Laravel Middleware.","Filters HTTP requests","Laravel"
📁 Project Structure
text
virtual-teacher/
├── public/                 # Frontend static files
│   ├── index.html         # Main application page
│   ├── app.js             # Core application logic
│   ├── styles.css         # Main stylesheet
│   └── learning-progress.js # Dashboard analytics
├── uploads/               # Default and user-uploaded CSV files
├── server.js              # Express.js backend server
├── package.json           # NPM dependencies and scripts
└── README.md              # This documentation file
🤝 Contributing
Contributions are welcome! If you have an idea for a new feature or find a bug, please follow these steps:

Fork the repository.

Create a Feature Branch: git checkout -b feature/AmazingFeature

Commit Your Changes: git commit -m 'Add some AmazingFeature'

Push to the Branch: git push origin feature/AmazingFeature

Open a Pull Request with a clear description of the changes.

Please ensure your code follows the existing style and includes relevant documentation updates.

📜 License
Distributed under the MIT License. See the LICENSE file for more information.
