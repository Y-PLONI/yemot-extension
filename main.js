// main.js
import simpleGit from "simple-git";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";

// ====== הגדרות ======
const GITHUB_USER = "mhotjrubho";        // שם המשתמש ב-GitHub
const REPO_NAME = "yemot-shits-24-9";    // שם הריפוזיטורי
const BRANCH = "main";                    // ענף לעדכון
const FILE_PATH = "ym_items.json";        // מיקום הקובץ בריפוזיטורי
const TOKEN = process.env.GITHUB_TOKEN;   // PAT שלך מאוחסן כמשתנה סביבה
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ.../pub?output=csv"; // קישור פומבי CSV של השיטס

// ====== פונקציה לקריאה מה-Google Sheets ======
async function getSheetData() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`שגיאה בקריאת הגיליון: ${res.statusText}`);
    const csvText = await res.text();
    const records = parse(csvText, {
      columns: true,    // משתמש בשורה הראשונה ככותרות
      skip_empty_lines: true
    });
    return records.map(r => ({
      title: r["שם הפונקציה"] || "",
      code: r["הקוד"] || "",
      keywords: r["מילים נוספות לחיפוש"] || ""
    }));
  } catch (err) {
    console.error("שגיאה בקריאת השיטס:", err);
    return [];
  }
}

// ====== פונקציה לעדכון GitHub ======
async function updateGitHubJSON(items) {
  const git = simpleGit();
  try {
    // מוודא שה־repo קלונס/עדכונים
    await git.clone(`https://${TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git`, "./tmp-repo", ["--depth", "1"]);
    
    const fs = await import("fs/promises");
    const path = "./tmp-repo/" + FILE_PATH;
    
    await fs.writeFile(path, JSON.stringify(items, null, 2));
    
    await git.cwd("./tmp-repo");
    await git.add(FILE_PATH);
    await git.commit("עדכון JSON משיטס אוטומטי");
    await git.push("origin", BRANCH);
    
    console.log("✅ JSON עודכן בהצלחה ב-GitHub!");
  } catch (err) {
    console.error("❌ שגיאה בעדכון GitHub:", err);
  }
}

// ====== הפעלה ======
(async () => {
  const items = await getSheetData();
  if (items.length === 0) {
    console.log("לא נמצאו נתונים לשמירה.");
    return;
  }
  await updateGitHubJSON(items);
})();
