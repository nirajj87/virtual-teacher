# 🎤 Interview Practice App (Voice + Smart Feedback)

This app allows users to practice interview questions using **voice input**, and gives **AI-style smart feedback** on their answers.

---

## 📁 Project Structure

```
interview-app-advanced/
├── public/
│   └── index.html        ← Main front-end interface
├── uploads/              ← Folder for uploaded Q&A CSV files
├── app.js                ← Node.js backend server
├── package.json          ← Project dependencies
```

---

## 🚀 How to Run the Project (Step-by-Step)

### 🧰 1. Requirements
- Node.js (v14 or above)
- NPM (Node Package Manager)

---

### 📦 2. Install Dependencies

Open terminal inside the project folder and run:

```bash
npm install
```

---

### ▶️ 3. Start the Server

```bash
node app.js
```

This will run the backend on:

```
http://localhost:3000
```

---

### 🌐 4. Open the App in Browser

Visit:

```
http://localhost:3000
```

---

### 📂 5. Upload a File

1. Click `Choose File` and select your CSV file (format: `question,answer,category`)
2. Click `Upload`
3. Questions are now loaded and ready to ask

---

### 🎤 6. Ask & Answer

1. Click `Ask Question`
2. Click `Start Speak` to answer using your microphone
3. Click `End Speak` once you're done
4. Click `Submit Answer` to check your response

---

### 🧠 7. Smart Feedback Includes

- ✅ Correct answer highlighted
- ❌ Missed/wrong words (in red)
- 🟡 Extra/unnecessary words (in yellow)
- 🎯 Accuracy percentage

---

## 💡 Tips

- Ensure microphone access is **allowed** in browser
- Speak clearly, pause briefly between lines
- You can also **type answers manually**

---

## 📚 License

Free to use and customize. Made with ❤️ for interview preparation.

