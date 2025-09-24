import fs from "fs";
import fetch from "node-fetch";
import simpleGit from "simple-git";
import { parse } from "csv-parse/sync";

// קישור פומבי לייצוא CSV מתוך Google Sheets
const csvUrl =
  "https://docs.google.com/spreadsheets/d/1XY1isQ5QdZLuuZacr2IiplRcwk30MZ8VGewHRLtKzMY/export?format=csv&id=1XY1isQ5QdZLuuZacr2IiplRcwk30MZ8VGewHRLtKzMY&gid=0";

async function fetchData() {
  console.log("📥 מושך נתונים מהקובץ:");
  console.log(csvUrl); // כאן תראה בדיוק מאיזה לינק הנתונים מגיעים

  const response = await fetch(csvUrl);
  const csvText = await response.text();

  // המרה של CSV ל-JSON לפי הכותרות (השורה הראשונה)
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`📊 נטענו ${records.length} שורות מהשיטס.`);
  return records;
}

async function updateJsonAndPush() {
  try {
    const data = await fetchData();

    // שמירת הנתונים בקובץ JSON
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2), "utf-8");
    console.log("✅ הקובץ data.json נבנה בהצלחה!");

    // עדכון ל-GitHub
    const git = simpleGit();
    await git.add("data.json");
    await git.commit("עדכון אוטומטי של נתוני Google Sheets");
    await git.push("origin", "main");

    console.log("🚀 הנתונים הועלו ל-GitHub בהצלחה!");
  } catch (error) {
    console.error("❌ שגיאה:", error);
  }
}

updateJsonAndPush();
