import fetch from "node-fetch";
import fs from "fs";

// הקישור הפומבי ל־CSV
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSy4WReF1zzNzcvCLoFSlLIWTOzfxkFfU0q0YK_FwhzL7EWJY8d54pxJWSov-GG_oj5iCyQ_bhrRFpq/pub?output=csv";

// פונקציה שמביאה את ה־CSV וממירה למערך אובייקטים
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

// פונקציה ראשית
async function main() {
  const data = await fetchCSV(SHEET_CSV_URL);
  if (data.length === 0) {
    console.log("לא נמצאו נתונים לשמירה.");
    return;
  }

  // שמירה כ־JSON מקומי (או כאן אפשר להוסיף קוד לעדכון GitHub)
  fs.writeFileSync("ym_items.json", JSON.stringify(data, null, 2), "utf-8");
  console.log("נתונים נשמרו בהצלחה לקובץ ym_items.json");
}

main();
