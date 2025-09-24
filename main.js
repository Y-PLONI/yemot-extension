import fetch from 'node-fetch';
import fs from 'fs';
import { Octokit } from '@octokit/rest';

// קרא את הטוקן ממשתנה סביבה
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const REPO_OWNER = 'mhotjrubho';
const REPO_NAME = 'yemot-shits-24-9';
const FILE_PATH = 'ym_items.json';
const BRANCH = 'main';

// פונקציה לקרוא CSV משיטס
async function fetchCSV(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`שגיאה ב-fetch: ${res.status}`);
    const text = await res.text();
    return text;
  } catch (err) {
    console.error('שגיאה ב-fetchCSV:', err);
    return null;
  }
}

// המרת CSV ל-JSON
function csvToJson(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines.shift().split(','); // שורה ראשונה ככותרות
  const modules = lines.map(line => {
    const cols = line.split(',');
    return {
      title: cols[0],       // עמודה A
      code: cols[1],        // עמודה B
      keywords: cols[2]     // עמודה C (פרמטרים לחיפוש)
    };
  });
  return { מודולים: modules };
}

// עדכון הקובץ ב-GitHub
async function updateGitHub(jsonData) {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    // קבל SHA של הקובץ הקיים
    const { data: fileData } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      ref: BRANCH
    });

    const sha = fileData.sha;

    // עדכון הקובץ
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: 'עדכון JSON משיטס אוטומטי',
      content: Buffer.from(JSON.stringify(jsonData, null, 2)).toString('base64'),
      sha: sha,
      branch: BRANCH
    });

    console.log('✅ הקובץ עודכן בהצלחה ב-GitHub');
  } catch (err) {
    console.error('❌ שגיאה בעדכון GitHub:', err);
  }
}

async function main() {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSy4WReF1zzNzcvCLoFSlLIWTOzfxkFfU0q0YK_FwhzL7EWJY8d54pxJWSov-GG_oj5iCyQ_bhrRFpq/pub?output=csv';
  const csvText = await fetchCSV(csvUrl);

  if (!csvText) return console.error('לא נמצאו נתונים לשמירה.');

  const jsonData = csvToJson(csvText);

  console.log('JSON מוכן:', JSON.stringify(jsonData, null, 2));

  // עדכן ב-GitHub
  await updateGitHub(jsonData);
}

main();
