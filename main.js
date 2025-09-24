import fetch from "node-fetch";
import { request } from "@octokit/request";

// Env Variable: GITHUB_TOKEN
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "mhotjrubho";
const REPO_NAME = "yemot-shits-24-9";
const FILE_PATH = "ym_items.json";
const BRANCH = "main";

// הנתונים שאתה רוצה לשים בקובץ
const jsonData = {
  "מודולים": [
    { "title": "תפריט", "code": "type=menu", "keywords": "..." },
    { "title": "השמעת קבצים", "code": "type=playfile", "keywords": "..." }
  ]
};

// פונקציה לעדכון או יצירה של הקובץ
async function updateGitHub() {
  try {
    // קודם נבדוק אם הקובץ קיים כדי לקבל את ה-SHA
    let sha;
    try {
      const res = await request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: FILE_PATH,
        ref: BRANCH,
        headers: {
          authorization: `token ${GITHUB_TOKEN}`,
          accept: "application/vnd.github.v3+json"
        }
      });
      sha = res.data.sha; // אם הקובץ קיים, נשתמש ב-SHA שלו
    } catch (err) {
      if (err.status === 404) {
        console.log("הקובץ לא קיים – ייווצר אוטומטית.");
      } else {
        throw err;
      }
    }

    // עדכון או יצירת הקובץ
    const contentBase64 = Buffer.from(JSON.stringify(jsonData, null, 2)).toString("base64");

    const resUpdate = await request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: "עדכון JSON משיטס אוטומטי",
      content: contentBase64,
      sha: sha, // אם לא היה SHA, GitHub ייצור את הקובץ
      branch: BRANCH,
      headers: {
        authorization: `token ${GITHUB_TOKEN}`,
        accept: "application/vnd.github.v3+json"
      }
    });

    console.log("✅ הקובץ עודכן/נוצר בהצלחה:", resUpdate.data.content.path);

  } catch (err) {
    console.error("❌ שגיאה בעדכון GitHub:", err);
  }
}

// קריאה לפונקציה
updateGitHub();
