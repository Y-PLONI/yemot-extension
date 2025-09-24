import fetch from "node-fetch";
import fs from "fs";

// קישור CSV פומבי מ-Google Sheets
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ.../pub?output=csv"; // החלף כאן בקישור הפומבי שלך

async function fetchCSV() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`שגיאה ב-fetch: ${res.status}`);
    const text = await res.text();

    // מפצל לשורות
    const lines = text.trim().split("\n");
    console.log("שורות מה-CSV:", lines);

    if (lines.length <= 1) {
      console.log("לא נמצאו נתונים לשמירה.");
      return [];
    }

    const headers = lines[0].split(/,|;/); // מפריד , או ;
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(/,|;/);
      // מתעלם משורות ריקות
      if (row.every(cell => cell.trim() === "")) continue;

      items.push({
        title: row[0] || "",
        code: row[1] || "",
        keywords: row[2] || ""
      });
    }

    console.log("נתונים שנמצאו:", items);
    return items;

  } catch (err) {
    console.error("שגיאה ב-fetchCSV:", err);
    return [];
  }
}

async function main() {
  const data = await fetchCSV();
  if (data.length === 0) return;

  // כאן תוכל להוסיף את קוד העדכון ל-GitHub או שמירה ל־JSON
  fs.writeFileSync("ym_items.json", JSON.stringify(data, null, 2));
  console.log("JSON נוצר בהצלחה!");
}

main();
