🚀 Interview Practice Web App

A smart and interactive Interview Practice Application built using Node.js + Express + Vanilla JS, designed to help users practice technical interview questions with real-time evaluation, category-based filtering, timers, auto-next questions, and a clean UI.

🔗 Live URL:
https://devsupport.co.in/interview/

📸 Screenshot

(Click to view the live app)

If you don't have /screenshot.png, upload one later — the link is already placed.

📘 Overview

This application allows users to practice interview questions from various categories such as:

Laravel

JavaScript

React

Node.js

PHP

MySQL

And more…

Users can upload their own CSV files containing Q/A pairs. The system automatically categorizes questions, ensures no repetition, and evaluates answers.

✨ Features
🎯 Core Features

Random question generator

Category selection

Auto-skip for already asked questions

Countdown timer (Easy / Medium / Hard modes)

Real-time answer evaluation

Speech-to-text answer input

Works offline (PWA supported)

Upload CSV to generate custom interview questions

Shows count of total questions & categories

🧠 AI Logic

Uses string similarity to match user answers

Shows accuracy percentage

Provides expected answer for learning

🏗️ Technology Stack
Frontend

HTML5

CSS3

Vanilla JavaScript

Fetch API

LocalStorage

Service Worker (PWA support)

Backend

Node.js

Express.js

Multer (CSV upload)

CSV-Parser

String-Similarity

File System (fs)

Other

JSON-based API

Secure deployment on cPanel

Error handling + rate limiting

📂 Folder Structure
project-root/
│── public/
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── manifest.json
│   ├── service-worker.js
│── uploads/
│   ├── sample-qa.csv
│── server.js
│── package.json
│── README.md

⚙️ Installation
1. Clone the Repo
git clone https://github.com/your-username/interview-practice-app.git
cd interview-practice-app

2. Install Dependencies
npm install

3. Run Server
node server.js

4. Visit in Browser
http://localhost:3000

🌐 Deployment (cPanel)

This project is successfully deployed using:

Node.js App Setup on cPanel

Public folder served via Express static route

Reverse proxy mapping

Production build with PM2 or cPanel Node runner

📝 API Endpoints
GET /interview/api/question?category=Laravel

Fetch random question.

GET /interview/api/categories

Fetch all categories.

GET /interview/api/question-count

Fetch total questions count.

POST /interview/api/upload

Upload CSV file.

💡 How It Works

User selects a category

App requests a random filtered question

Prevents repeated questions until all are completed

Timer starts depending on difficulty

User types or speaks the answer

System compares and shows accuracy

Auto-loads next question after submission

🧪 CSV Format Example
question,answer,category
"What is Laravel Middleware?","Middleware filters HTTP requests.",Laravel
"Explain closures in JS","Functions with lexical scope.",JavaScript

🤝 Contributing

Pull requests are welcome.
For major updates, open an issue first to discuss changes.

📜 License

MIT License.