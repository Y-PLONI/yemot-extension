import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSy4WReF1zzNzcvCLoFSlLIWTOzfxkFfU0q0YK_FwhzL7EWJY8d54pxJWSov-GG_oj5iCyQ_bhrRFpq/pub?output=csv';
const GITHUB_TOKEN = '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';
const OWNER = 'mhotjrubho';
const REPO = 'yemot-shits-24-9';
const PATH = 'ym_items.json';
const BRANCH = 'main';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`שגיאה ב-fetch: ${res.status}`);
  return await res.text();
}

function csvToJson(csv) {
  const lines = csv.split('\n').filter(Boolean);
  const headers = lines.shift().split(',');
  return lines.map(line => {
    const cols = line.split(',');
    return {
      title: cols[0],
      code: cols[1],
      keyWords: cols[2]
    };
  });
}

async function updateGitHub(jsonData) {
  const content = Buffer.from(JSON.stringify({ modules: jsonData }, null, 2)).toString('base64');

  // מנסה למחוק קודם (אם קיים)
  try {
    const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: PATH, ref: BRANCH });
    await octokit.repos.delete({
      owner: OWNER,
      repo: REPO,
      path: PATH,
      sha: data.sha,
      branch: BRANCH,
      message: 'מחיקה לפני עדכון אוטומטי'
    });
    console.log('קובץ קיים נמחק.');
  } catch (err) {
    if (err.status === 404) console.log('אין קובץ קיים – ממשיכים.');
    else throw err;
  }

  // יוצר מחדש
  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: PATH,
    branch: BRANCH,
    message: 'עדכון JSON אוטומטי מהשיטס',
    content
  });

  console.log('✅ JSON עודכן בהצלחה ב-GitHub!');
}

async function main() {
  try {
    const csvText = await fetchCSV(SHEET_URL);
    const jsonData = csvToJson(csvText);
    if (!jsonData.length) {
      console.log('לא נמצאו נתונים לשמירה.');
      return;
    }
    await updateGitHub(jsonData);
  } catch (err) {
    console.error('❌ שגיאה בעדכון GitHub:', err);
  }
}

main();
