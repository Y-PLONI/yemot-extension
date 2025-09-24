// index.js
import fetch from "node-fetch";
import { Octokit } from "octokit";
import cron from "node-cron";

// ====== הגדרות ======
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYdZLuuZacr2IiplRcwk30MZ8VGewHRLtKzMY/pub?output=csv";
const GITHUB_USER = "mhotjrubho";
const REPO_NAME = "yemot-shits-24-9";
const FILE_PATH = "ym_items.json";
const BRANCH = "main";

// חשוב: הכנס את ה-PAT שלך ב-Railway כ-environment variable בשם GITHUB_TOKEN
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// ====== פונקציה לקריאת Google Sheet כ-CSV ======
async function fetchSheet() {
  const res = await fetch(SHEET_CSV_URL);
  const text = await res.text();
  const lines = text.split("\n");
  const items = [];
  const headers = lines[0].split(",");

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    if (row.length < 3) continue; // דילוג על שורות ריקות או לא תקינות
    items.push({
      title: row[0].trim(),
      code: row[1].trim(),
      keywords: row[2].trim(),
    });
  }
  return items;
}

// ====== פונקציה לעדכון GitHub ======
async function updateGithub(jsonData) {
  try {
    // קבלת SHA של הקובץ הקיים
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_USER,
      repo: REPO_NAME,
      path: FILE_PATH,
      ref: BRANCH,
    });

    const sha = data.sha;

    const contentBase64 = Buffer.from(JSON.stringify(jsonData, null, 2)).toString(
      "base64"
    );

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_USER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: "עדכון JSON משיטס אוטומטי",
      content: contentBase64,
      sha,
      branch: BRANCH,
    });

    console.log("✅ JSON עודכן בהצלחה ב-GitHub!");
  } catch (err) {
    console.error("❌ שגיאה בעדכון GitHub:", err);
  }
}

// ====== משימה שבועית ======
cron.schedule("0 0 * * 0", async () => {
  console.log("🔄 מתחיל עדכון שבועי...");
  const data = await fetchSheet();
  await updateGithub(data);
});

// ====== הפעלת עדכון מידי פעם לבדיקה ======
(async () => {
  const data = await fetchSheet();
  await updateGithub(data);
})();
