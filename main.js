import fetch from "node-fetch";

// ====== הגדרות ======
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv"; // הכנס כאן את הקישור הפומבי ל-CSV
const GITHUB_USER = "mhotjrubho";
const REPO_NAME = "yemot-shits-24-9";
const BRANCH = "main";
const FILE_PATH = "ym_items.json";
const TOKEN = process.env.GITHUB_TOKEN;

// ====== פונקציה לקריאת CSV ======
async function fetchCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  const lines = text.trim().split("\n");
  const items = [];

  for (let i = 1; i < lines.length; i++) { // מתחילים מהשורה השנייה
    const [col1, col2, col3] = lines[i].split(",");
    items.push({
      title: col1,
      code: col2,
      keywords: col3
    });
  }
  return items;
}

// ====== פונקציה לעדכון GitHub ======
async function updateGithubJSON(items) {
  const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${FILE_PATH}`;

  // קודם כל קבלת ה-SHA של הקובץ הקיים
  const getResponse = await fetch(url, {
    headers: {
      "Authorization": `token ${TOKEN}`,
      "Accept": "application/vnd.github.v3+json"
    }
  });

  const data = await getResponse.json();
  const sha = data.sha;

  const payload = {
    message: "עדכון JSON אוטומטי משיטס",
    content: Buffer.from(JSON.stringify(items, null, 2)).toString("base64"),
    sha: sha,
    branch: BRANCH
  };

  const putResponse = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${TOKEN}`,
      "Accept": "application/vnd.github.v3+json"
    },
    body: JSON.stringify(payload)
  });

  const result = await putResponse.json();
  console.log("GitHub response:", result);
}

// ====== הרצה ======
async function main() {
  const items = await fetchCSV(SHEET_CSV_URL);
  if (items.length === 0) {
    console.log("לא נמצאו נתונים לשמירה.");
    return;
  }
  await updateGithubJSON(items);
  console.log("✅ JSON עודכן בהצלחה ב-GitHub!");
}

main();
