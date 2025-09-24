import fetch from "node-fetch";
import { parse } from "csv-parse/sync";
import { Octokit } from "@octokit/rest";

// ====== הגדרות ======
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSy4WReF1zzNzcvCLoFSlLIWTOzfxkFfU0q0YK_FwhzL7EWJY8d54pxJWSov-GG_oj5iCyQ_bhrRFpq/pub?output=csv";
const GITHUB_USER = "mhotjrubho";
const REPO_NAME = "yemot-shits-24-9";
const FILE_PATH = "ym_items.json";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_PAT; // הכנס את ה-PAT שלך כ-ENV ב-Railway
const FILE_SHA = "fa31416bfad75f32cdc1507915a4e6fbf20e2da2";

// ====== פונקציה לקריאת CSV ======
async function fetchCSV(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`שגיאה ב-fetch: ${res.status}`);
    const text = await res.text();
    const records = parse(text, { columns: true, skip_empty_lines: true });
    return records;
  } catch (err) {
    console.error("שגיאה ב-fetchCSV:", err);
    return [];
  }
}

// ====== פונקציה לעדכון GitHub ======
async function updateGitHub(jsonContent) {
  try {
    const octokit = new Octokit({ auth: TOKEN });
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_USER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: "עדכון JSON משיטס אוטומטי",
      content: Buffer.from(jsonContent).toString("base64"),
      sha: FILE_SHA,
      branch: BRANCH
    });
    console.log("✅ JSON עודכן בהצלחה ב-GitHub!");
  } catch (err) {
    console.error("❌ שגיאה בעדכון GitHub:", err);
  }
}

// ====== MAIN ======
async function main() {
  const records = await fetchCSV(CSV_URL);

  if (!records.length) {
    console.log("לא נמצאו נתונים לשמירה.");
    return;
  }

  const modules = records.map(r => ({
    title: r["שם ההגדרה"],   // A
    code: r["הקוד"],         // B
    keywords: r["פרמטרים לחיפוש"] // C
  }));

  const finalJSON = JSON.stringify({ מודולים: modules }, null, 2);

  await updateGitHub(finalJSON);
}

main();
