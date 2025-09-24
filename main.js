import fetch from "node-fetch";
import fs from "fs";
import { Octokit } from "@octokit/rest";

// ====== הגדרות ======
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSy4WReF1zzNzcvCLoFSlLIWTOzfxkFfU0q0YK_FwhzL7EWJY8d54pxJWSov-GG_oj5iCyQ_bhrRFpq/pub?output=csv";

const GITHUB_USER = "mhotjrubho";            // שם המשתמש ב-GitHub
const REPO_NAME = "yemot-shits-24-9";        // שם הריפוזיטורי
const FILE_PATH = "ym_items.json";            // מיקום הקובץ בריפוזיטורי
const BRANCH = "main";                        // ענף לעדכון
const TOKEN = process.env.GITHUB_TOKEN;       // השתמש ב-Env Variable (בטוח יותר)
const FILE_SHA = "";                           // אפשר להשאיר ריק אם רוצים לטעון את SHA אוטומטית

// ====== פונקציה שמביאה CSV וממירה לאובייקטים ======
async function fetchCSV(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`שגיאה ב-fetch: ${response.status}`);
    const text = await response.text();

    const lines = text.split("\n").filter(line => line.trim() !== "");
    if (lines.length < 2) return []; // אין נתונים

    const headers = lines[0].split(","); // השורה הראשונה - כותרות
    const data = lines.slice(1).map(line => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] || "";
      });
      return obj;
    });

    return data;
  } catch (err) {
    console.error("שגיאה ב-fetchCSV:", err);
    return [];
  }
}

// ====== פונקציה לעדכון GitHub ======
async function updateGitHubJSON(data) {
  if (!TOKEN) {
    console.error("שגיאה: אין GITHUB_TOKEN בסביבת העבודה");
    return;
  }

  const octokit = new Octokit({ auth: TOKEN });

  try {
    // קידוד JSON לבסיס64
    const contentEncoded = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

    // בדיקה אם צריך לשלוף SHA של הקובץ
    let sha = FILE_SHA;
    if (!sha) {
      try {
        const { data: fileData } = await octokit.repos.getContent({
          owner: GITHUB_USER,
          repo: REPO_NAME,
          path: FILE_PATH,
          ref: BRANCH
        });
        sha = fileData.sha;
      } catch (e) {
        console.log("קובץ חדש, אין SHA קודם, ניצור אותו.");
      }
    }

    const response = await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_USER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: "עדכון JSON משיטס אוטומטי",
      content: contentEncoded,
      sha: sha || undefined,
      branch: BRANCH
    });

    console.log("✅ JSON עודכן בהצלחה ב-GitHub!", response.data.content.html_url);
  } catch (err) {
    console.error("❌ שגיאה בעדכון GitHub:", err);
  }
}

// ====== פונקציה ראשית ======
async function main() {
  const data = await fetchCSV(SHEET_CSV_URL);

  if (data.length === 0) {
    console.log("לא נמצאו נתונים לשמירה.");
    return;
  }

  // שמירה מקומית
  fs.writeFileSync("ym_items.json", JSON.stringify(data, null, 2), "utf-8");
  console.log("✅ נתונים נשמרו בהצלחה לקובץ ym_items.json");

  // עדכון GitHub
  await updateGitHubJSON(data);
}

main();
