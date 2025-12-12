const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const stringSimilarity = require("string-similarity");
const csv = require("csv-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== SINGLE CONFIGURATION ==================
// YAHI EK JAGAH CHANGE KARNA HAI - bas yeh ek line
const BASE_PATH = "/virtual-teacher"; // ✅ YAHI CHANGE KARO

// ================== PATHS ==================
const UPLOADS_DIR = path.join(__dirname, "uploads");
const PUBLIC_DIR = path.join(__dirname, "public");
const DEFAULT_CSV_PATH = path.join(UPLOADS_DIR, "sample-qa.csv");

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// ================== GLOBAL VARIABLES ==================
let qaList = [];
let categories = [];
const askedMap = {};

// ================== CSV PARSER ==================
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {
                const question = (row.question || row.Question || "").toString().trim();
                const answer = (row.answer || row.Answer || "").toString().trim();
                const category = (row.category || row.Category || "General").toString().trim();
                if (question && answer) results.push({ question, answer, category });
            })
            .on("end", () => resolve(results))
            .on("error", reject);
    });
}

// ================== LOAD DEFAULT CSV ==================
async function loadDefaultCSV() {
    try {
        if (fs.existsSync(DEFAULT_CSV_PATH)) {
            qaList = await parseCSV(DEFAULT_CSV_PATH);
            updateCategories();
            console.log("✅ Default CSV Loaded:", qaList.length);
        } else {
            console.log("❌ sample-qa.csv missing");
            qaList = [];
            categories = [];
        }
    } catch (err) {
        console.error("CSV Load Error:", err);
        qaList = [];
        categories = [];
    }
}

function updateCategories() {
    categories = [...new Set(qaList.map((q) => q.category))];
}

loadDefaultCSV();

// ================== FILE UPLOAD CONFIG ==================
const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOADS_DIR),
    filename: (_, file, cb) =>
        cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});

const upload = multer({
    storage,
    fileFilter: (_, file, cb) => {
        path.extname(file.originalname).toLowerCase() === ".csv"
            ? cb(null, true)
            : cb(new Error("Only CSV files allowed"));
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

// ================== API ROUTES ==================
const api = express.Router();

// Health
api.get("/health", (_, res) =>
    res.json({
        status: "ok",
        questions: qaList.length,
        categories: categories.length,
    })
);

// Get Question Count
api.get("/question-count", (_, res) => res.json({ count: qaList.length }));

// Get Categories
api.get("/categories", (_, res) => res.json({ categories }));

// Random Question
api.get("/question", (req, res) => {
    if (!qaList.length) return res.json({ error: "No questions available" });
    const category = (req.query.category || "__all__").toLowerCase();
    let pool = qaList;
    if (category !== "__all__") pool = qaList.filter((q) => q.category.toLowerCase() === category);
    if (!pool.length) return res.json({ error: "No questions in this category" });
    if (!askedMap[category]) askedMap[category] = new Set();
    let available = pool.filter((q, i) => !askedMap[category].has(i));
    if (!available.length) {
        askedMap[category].clear();
        available = pool;
    }
    const item = available[Math.floor(Math.random() * available.length)];
    const index = qaList.findIndex((q) => q.question === item.question && q.answer === item.answer);
    askedMap[category].add(index);
    res.json({ question: item.question, index, category: item.category });
});

// Answer Check - ✅ YE AB WORK KAREGA
api.post("/answer", (req, res) => {
    const { index, userAnswer = "" } = req.body;
    if (index == null) return res.status(400).json({ error: "Index required" });
    const q = qaList[index];
    if (!q) return res.status(404).json({ error: "Question not found" });
    const normalize = (t) =>
        t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
    const sim = Math.round(
        stringSimilarity.compareTwoStrings(normalize(userAnswer), normalize(q.answer)) * 100
    );
    res.json({ correctAnswer: q.answer, similarity: sim, question: q.question });
});

// Upload CSV - ✅ YE AB WORK KAREGA
api.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const parsed = await parseCSV(req.file.path);
        if (!parsed.length) return res.status(400).json({ error: "CSV empty/invalid" });
        qaList = parsed;
        updateCategories();
        fs.unlinkSync(req.file.path);
        Object.keys(askedMap).forEach((key) => delete askedMap[key]);
        res.json({
            message: "CSV uploaded successfully",
            count: qaList.length,
            categories,
        });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: "Failed to process CSV" });
    }
});

// Reset to Default
api.post("/reset-to-default", async (_, res) => {
    await loadDefaultCSV();
    Object.keys(askedMap).forEach((key) => delete askedMap[key]);
    res.json({ message: "Reset successful", count: qaList.length, categories });
});

// ================== IMPORTANT: MOUNT API WITH BASE_PATH ==================
// ✅ Ye line sabhi API routes ko BASE_PATH se prefix karegi
app.use(`${BASE_PATH}/api`, api);

// ================== STATIC FILES + SPA FALLBACK ==================
// Static files bhi BASE_PATH se serve honge
app.use(BASE_PATH, express.static(PUBLIC_DIR));

// SPA fallback bhi BASE_PATH ke liye
app.get(`${BASE_PATH}/*`, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// ================== START SERVER ==================
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}${BASE_PATH}`);
    console.log(`📁 API Base: http://localhost:${PORT}${BASE_PATH}/api`);
    console.log(`📁 Upload endpoint: http://localhost:${PORT}${BASE_PATH}/api/upload`);
});

module.exports = app;