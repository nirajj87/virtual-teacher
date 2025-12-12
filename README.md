🚀 Interview Practice Web App
A smart and interactive Interview Practice Application built using Node.js + Express + Vanilla JS, designed to help users practice technical interview questions with real-time evaluation, category-based filtering, timers, auto-next questions, and a clean UI.

🔗 Live URL: https://devsupport.co.in/interview/

📸 Screenshots
🖥️ Desktop View
https:///screenshot-desktop.png
Main interface with question panel, answer area, and progress dashboard

📱 Mobile View
https:///screenshot-mobile.png
Responsive design for mobile devices

📊 Learning Dashboard
https:///screenshot-dashboard.png
Learning progress tracking with charts and recommendations

📘 Overview
This application allows users to practice interview questions from various technical domains including:

Laravel

JavaScript

React

Node.js

PHP

MySQL

Python

HTML/CSS

And 18+ more categories...

Users can upload their own CSV files containing Q/A pairs. The system automatically categorizes questions, ensures no repetition, evaluates answers using AI-powered similarity checking, and tracks learning progress over time.

✨ Features
🎯 Core Features
Random question generator with intelligent distribution

Category selection from 18+ technical domains

Auto-skip for already asked questions

Countdown timer with Easy/Medium/Hard difficulty modes

Real-time answer evaluation using string similarity algorithms

Speech-to-text answer input with voice recognition

Works offline (PWA supported)

Upload CSV to generate custom interview questions

Shows count of total questions & available categories

🧠 Study Modes
Practice Mode - Normal practice with instant feedback

Test Mode - Timed exam simulation (10 questions, 30s each)

Review Mode - Practice previously incorrect answers

Free Time Mode - Unlimited time for complex questions

📊 Learning Analytics
Overall progress tracking with circular progress indicator

Topic mastery calculation per category

Weekly progress charts (accuracy vs questions)

Response time analytics with averages

Achievement system with badges

Smart recommendations based on performance

Streak tracking and best performance records

🏆 Gamification
Score system with multipliers for streaks

Achievements for milestones (First Question, 5-Streak, Perfect Score, etc.)

Confetti animations for perfect scores

Leaderboard for best scores

🏗️ Technology Stack
Frontend
HTML5 with semantic markup

CSS3 with CSS Variables for theming

Vanilla JavaScript (no frameworks)

Chart.js for data visualization

Web Speech API for voice recognition

Fetch API for server communication

LocalStorage for offline data persistence

Service Worker (PWA support)

Responsive Design with mobile-first approach

Backend
Node.js runtime environment

Express.js web framework

Multer for CSV file uploads

CSV-Parser for data processing

String-Similarity for answer evaluation

File System (fs) for data management

Development & Deployment
Git for version control

cPanel for deployment

PM2 for process management

JSON-based REST API

Error handling with user-friendly messages

Rate limiting for API protection

📂 Folder Structure
text
project-root/
│
├── public/
│   ├── index.html              # Main application page
│   ├── app.js                  # Main application logic
│   ├── learning-progress.js    # Dashboard functionality
│   ├── styles.css              # Main stylesheet
│   ├── learning-progress.css   # Dashboard styles
│   ├── manifest.json           # PWA manifest
│   └── service-worker.js       # Service worker for offline
│
├── uploads/
│   ├── sample-qa.csv           # Default question bank
│   └── [user-uploads]/         # User uploaded CSV files
│
├── server.js                   # Express server
├── package.json                # Dependencies and scripts
├── README.md                   # This documentation
└── .htaccess                   # Apache configuration
⚙️ Installation & Setup
1. Clone the Repository
bash
git clone https://github.com/your-username/interview-practice-app.git
cd interview-practice-app
2. Install Dependencies
bash
npm install
3. Configure Environment
Create a .env file (optional for development):

env
PORT=3000
NODE_ENV=development
BASE_PATH=/interview
4. Add Sample Questions
Place your CSV file in the uploads/ directory with format:

csv
question,answer,category
"What is Laravel Middleware?","Middleware filters HTTP requests","Laravel"
"Explain closures in JS","Functions with lexical scope","JavaScript"
5. Start Development Server
bash
npm start
# or for development with auto-reload
npm run dev
6. Access Application
Open browser and navigate to:

text
http://localhost:3000
🌐 Deployment (cPanel)
This project is successfully deployed on cPanel using:

Deployment Steps:
Node.js App Setup in cPanel

Application root set to project directory

Application URL mapped to /interview

Environment variables configured in cPanel

Start script set to node server.js

PM2 process manager for automatic restarts

cPanel Configuration:
Application mode: Production

Node.js version: 18.x or higher

Application URL: https://yourdomain.com/interview

Start command: node server.js

App root: /home/username/interview-practice-app

📝 API Endpoints
Method	Endpoint	Description
GET	/api/health	Server health check
GET	/api/question	Get random question
GET	/api/question?category=JavaScript	Get category-specific question
GET	/api/categories	Get all available categories
GET	/api/question-count	Get total questions count
POST	/api/answer	Submit answer for evaluation
POST	/api/upload	Upload CSV file
GET	/api/test-questions	Get test questions (Test mode)
Example API Response:
json
{
  "question": "What is closure in JavaScript?",
  "answer": "A function with access to its outer scope",
  "category": "JavaScript",
  "index": 42
}
💡 How It Works
1. Question Selection
User selects a category (or "All Categories")

System fetches random question from selected category

Prevents question repetition using session tracking

Shows question with category tag and difficulty indicator

2. Answer Submission
User types or speaks answer using voice recognition

Timer counts down based on selected difficulty

System calculates similarity between user answer and correct answer

Shows accuracy percentage with visual feedback

Provides correct answer for learning

3. Learning Progress
Tracks accuracy, response times, and streaks

Calculates topic mastery based on category performance

Generates weekly progress charts

Provides personalized recommendations

Awards achievements for milestones

4. Study Modes
Practice: Normal mode with feedback

Test: Timed exam with 10 questions

Review: Focus on previously incorrect answers

Free Time: No time pressure for complex questions

🧪 CSV Format Requirements
Required Format:
csv
question,answer,category
"What is Laravel Middleware?","Middleware filters HTTP requests","Laravel"
"Explain closures in JS","Functions with lexical scope","JavaScript"
"React useState hook","Manages state in functional components","React"
CSV Rules:
First row must be headers: question,answer,category

Questions and answers should be in quotes if they contain commas

Categories are auto-detected and sorted

Maximum file size: 5MB

Supported encoding: UTF-8

🎨 UI/UX Features
Theming System
Light/Dark mode toggle

CSS variables for easy theme customization

Smooth transitions and animations

Responsive Design
Mobile-first approach

Breakpoints for tablets and desktops

Touch-friendly controls on mobile

Accessibility
Keyboard navigation support

Screen reader compatible

High contrast mode ready

Focus indicators for all interactive elements

User Experience
Toast notifications for actions

Loading states with spinners

Error messages with recovery options

Auto-save progress

Session persistence

🔧 Configuration Options
Server Configuration (server.js):
javascript
const config = {
  port: process.env.PORT || 3000,
  uploadLimit: '5mb',
  questionLimit: 50, // Questions per session
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  allowedCategories: ['JavaScript', 'React', 'Node.js', 'Laravel', 'PHP', 'MySQL']
};
Client Configuration (app.js):
javascript
const CONFIG = {
  TIMER: {
    EASY: 60,
    MEDIUM: 40,
    HARD: 20,
    TEST: 30
  },
  SCORING: {
    PERFECT_THRESHOLD: 90,
    GOOD_THRESHOLD: 70,
    STREAK_MULTIPLIERS: [1, 2, 3]
  }
};
🤝 Contributing
We welcome contributions! Here's how:

Fork the repository

Create a feature branch: git checkout -b feature/amazing-feature

Commit your changes: git commit -m 'Add amazing feature'

Push to the branch: git push origin feature/amazing-feature

Open a Pull Request

Development Guidelines:
Follow existing code style

Add comments for complex logic

Update documentation for new features

Test thoroughly before submitting

Report Issues:
Use GitHub Issues

Include steps to reproduce

Add screenshots if applicable

Mention browser/device details

📜 License
MIT License

Copyright (c) 2024 DevSupport

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

🙏 Acknowledgments
Icons: Font Awesome

Charts: Chart.js

Similarity Algorithm: string-similarity npm package

Voice Recognition: Web Speech API

Deployment: cPanel Node.js App Support

📞 Support & Contact
GitHub Issues: Report bugs or request features

Live Demo: https://devsupport.co.in/interview/

Documentation: This README file

🚀 Quick Start for Users
Visit the application URL

Select a category from the dropdown

Choose difficulty level

Click "Ask Question" to start

Type or speak your answer

Submit to see your score

Review incorrect answers in Review Mode

Track your progress in the Learning Dashboard

⭐ Star this repository if you found it useful!

Happy Interview Practicing! 🎯