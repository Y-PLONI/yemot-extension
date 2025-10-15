// content.js
// מזריק כפתור צף וחלונית צד לדף ונותן את כל הלוגיקה שנדרשת.
// כתוב בעברית בהתקנים ובכל ההסברים למשתמשים.
(function() {
  if (window.__ym_helper_injected) return;
  window.__ym_helper_injected = true;

  // פונקציה עזר: יצירת אלמנט מהרשימה
  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (!c) return;
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else e.appendChild(c);
    });
    return e;
  }

  // הכפתור הצף
  const fab = el('button', { class: 'ym-fab', title: 'פתח/סגור את חלונית ההגדרות' }, [
    el('span', { html: '&#9881;' }) // gear emoji-like
  ]);
  document.body.appendChild(fab);

  // החלונית
  const panel = el('aside', { class: 'ym-side-panel', dir: 'rtl' });

  // עזר לבחירת אלמנטים מתוך החלונית בלבד
  const gid = (id) => panel.querySelector('#' + id);

  // tooltip דינמי
  let tooltip = null;
  function showTooltip(text, x, y) {
    if (!tooltip) {
      tooltip = el('div', { class: 'ym-tooltip' });
      document.body.appendChild(tooltip);
    }
    tooltip.textContent = text;
    tooltip.style.left = (x + 12) + 'px';
    tooltip.style.top = (y - 8) + 'px';
    tooltip.style.display = 'block';
  }
  function hideTooltip() { if (tooltip) tooltip.style.display = 'none'; }

  // כותרת
  const header = el('div', { class: 'ym-panel-header' }, [
    el('div', {}, [
      el('h2', { text: 'YM Helper — חיפוש ובחירת הגדרות' }),
      el('div', { class: 'ym-panel-sub', text: 'חפשו הגדרות, סמנו לבחירה, והדביקו הכל ל־EXT.INI בלחיצה אחת.' })
    ]),
    el('div', {}, [
      el('button', { class: 'ym-close', title: 'סגור' , text: '✕' })
    ])
  ]);
  panel.appendChild(header);

  // אזור תוכן לחלונית – מחליף את השדות הקודמים: מיכל לסרגל החיפוש/הדבקה
  const settings = el('div', { class: 'ym-settings' }, [
    el('div', { id: 'ym-panel-search-container' })
  ]);
  
  panel.appendChild(settings);
  document.body.appendChild(panel);

  // סגירה/פתיחה
  function syncBodyOpenClass() {
    if (panel.classList.contains('open')) {
      document.body.classList.add('ym-panel-open');
    } else {
      document.body.classList.remove('ym-panel-open');
    }
  }

  fab.addEventListener('click', () => {
    panel.classList.toggle('open');
    syncBodyOpenClass();
  });
  header.querySelector('.ym-close').addEventListener('click', () => {
    panel.classList.remove('open');
    syncBodyOpenClass();
  });

  // לא נטען שדות — הסרגל ייבנה דינמית בתוך המכולה ע"י המודול שמתחת

  // הקש Escape סוגר את החלונית
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      panel.classList.remove('open');
      syncBodyOpenClass();
    }
  });

  // הוספת סמל התוסף מעל תיבת הקלטת המילים
  function addExtIniIcon() {
    // חיפוש תיבת הקלטת המילים
    const extTextarea = document.querySelector('#extini_editor_textarea');
    if (!extTextarea) return;

    // וידוא שלא הוספנו כבר את הסמל
    if (document.querySelector('.ym-extini-icon')) return;

    // יצירת container לסמל
    const iconContainer = el('div', { 
      class: 'ym-extini-icon',
      title: 'פתח/סגור את חלונית ההגדרות'
    }, [
      el('span', { html: '&#9881;' }) // gear emoji-like
    ]);

    // הוספת הסמל מעל תיבת הקלדה
    const extEditor = document.querySelector('#extini_editor');
    if (extEditor) {
      extEditor.insertBefore(iconContainer, extTextarea);
    }

    // הוספת אירוע לחיצה לפתיחת/סגירת החלונית
    iconContainer.addEventListener('click', () => {
      panel.classList.toggle('open');
      syncBodyOpenClass();
    });
  }

  // הפעלת הפונקציה כשהדף נטען
  addExtIniIcon();
  
  // במקרה שהאלמנט נוסף דינמית, נבדוק שוב כל כמה שניות
  setInterval(addExtIniIcon, 3000);

  // הודעה במסוף שהתוסף נטען
  console.log('🎯 YM Helper נטען בהצלחה! שימוש: window.YMHelper או לחיצה על הסמלים');

  // וודא שהחלונית לא תפריע לאלמנטים של הדף (z-index גבוה אבל לא מוגזם)
  // וגם תקן בעיות של overflow במקרה והדף משתמש ב־body overflow:hidden
  document.documentElement.style.removeProperty('overflow');
})();

// ============================
// YM Search Helper Bar — מודול חיפוש והדבקה ל-EXT.INI (בהשראת התקיה החדשה)
// ============================
(function YMSearchHelper() {
  'use strict';

  const PASTE_MODE = 'append';
  const HOTKEY = { key: 'k' };
  // ניתן להפוך לקונפיגורבילי דרך ה-UI מאוחר יותר
  // RAW URL חייב להיות בפורמט: https://raw.githubusercontent.com/<user>/<repo>/<branch>/<path>
  const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/mhotjrubho/yemot-shits-24-9/main/ym_items_1.json';

  let ITEMS = JSON.parse(localStorage.getItem('YM_ITEMS') || '[]');
  let LAST_UPDATE = localStorage.getItem('YM_LAST_UPDATE') || 'לא ידוע';

  if (!ITEMS.length) {
    ITEMS = [
      { title: 'הגדרה 1', code: 'EXT1=123' },
      { title: 'הגדרה 2', code: 'EXT2=456' },
      { title: 'הגדרה 3', code: 'EXT3=789' }
    ];
  }

  function saveItems() {
    localStorage.setItem('YM_ITEMS', JSON.stringify(ITEMS));
    localStorage.setItem('YM_LAST_UPDATE', new Date().toLocaleString('he-IL'));
    LAST_UPDATE = localStorage.getItem('YM_LAST_UPDATE');
    updateLastUpdateDisplay();
  }

  function showToast(msg, ms = 2000) {
    const t = document.createElement('div');
    t.className = 'ym-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  function normalize(str) { return (str || '').toLowerCase().replace(/[\u0591-\u05C7]/g, '').trim(); }
  function filterItems(items, q) { const n = normalize(q); if (!n) return items.slice(0, 50); return items.filter(it => normalize(it.title).includes(n) || normalize(it.code).includes(n)).slice(0, 50); }

  // פונקציה לקריאת תוכן תיבת הקלטת המילים
  function getExtIniContent() {
    const textarea = document.querySelector('#extini_editor_textarea');
    return textarea ? textarea.value : '';
  }

  // פונקציה לעדכון תוכן תיבת הקלטת המילים
  function setExtIniContent(content) {
    const textarea = document.querySelector('#extini_editor_textarea');
    if (textarea) {
      textarea.value = content;
      // הפעלת אירועי שינוי כדי שהדף יזהה את השינוי
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  // פונקציה לניתוח תוכן ה-EXT.INI
  function parseExtIniContent(content) {
    const lines = content.split('\n');
    const settings = [];
    let currentCategory = 'כללי';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // זיהוי קטגוריה
      if (trimmed.startsWith(';') && trimmed.includes('===')) {
        const match = trimmed.match(/===\s*(.+?)\s*===/);
        if (match) {
          currentCategory = match[1].trim();
        }
        continue;
      }
      
      // זיהוי הגדרה
      if (trimmed && !trimmed.startsWith(';') && trimmed.includes('=')) {
        const equalIndex = trimmed.indexOf('=');
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        
        // חיפוש הסבר בתגובה
        const commentMatch = trimmed.match(/\/\/(.+)$/);
        const description = commentMatch ? commentMatch[1].trim() : '';
        
        settings.push({
          key,
          value,
          description,
          category: currentCategory,
          fullLine: trimmed
        });
      }
    }
    
    return settings;
  }

  // פונקציה לקבלת סטטיסטיקות על תוכן ה-EXT.INI
  function getExtIniStats() {
    const content = getExtIniContent();
    const settings = parseExtIniContent(content);
    
    const stats = {
      totalLines: content.split('\n').length,
      totalSettings: settings.length,
      categories: {},
      isEmpty: content.trim() === ''
    };
    
    // ספירת הגדרות לפי קטגוריה
    for (const setting of settings) {
      if (!stats.categories[setting.category]) {
        stats.categories[setting.category] = 0;
      }
      stats.categories[setting.category]++;
    }
    
    return stats;
  }

  // חשיפת הפונקציות לשימוש גלובלי (למקרה שנרצה להשתמש בהן בהמשך)
  window.YMHelper = {
    getExtIniContent,
    setExtIniContent,
    parseExtIniContent,
    getExtIniStats,
    openPanel: () => {
      panel.classList.add('open');
      syncBodyOpenClass();
    },
    closePanel: () => {
      panel.classList.remove('open');
      syncBodyOpenClass();
    },
    togglePanel: () => {
      panel.classList.toggle('open');
      syncBodyOpenClass();
    }
  };

  // ממיר מבנה JSON כללי לה扭 ITEMS שטוחים עם קטגוריות
  // תומך בשני פורמטים:
  // 1) Array[{ title, code, category? }]
  // 2) Object{ "שם קטגוריה": [ {title,code} | "כותרת:קוד" | ["כותרת","קוד"] ] }
  function normalizeLoadedData(data) {
    const out = [];
    // פורמט 1: מערך של פריטים
    if (Array.isArray(data)) {
      data.forEach(it => {
        if (it && typeof it === 'object' && it.title && it.code) {
          out.push({ title: String(it.title), code: String(it.code), category: (it.category || it.cat || 'כללי') });
        }
      });
      return out;
    }
    // פורמט 2: אובייקט של קטגוריות
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(cat => {
        const arr = data[cat];
        if (!Array.isArray(arr)) return;
        arr.forEach(entry => {
          if (entry == null) return;
          // אובייקט {title,code}
          if (typeof entry === 'object' && entry.title && entry.code) {
            out.push({ title: String(entry.title), code: String(entry.code), category: cat });
            return;
          }
          // מחרוזת "כותרת:קוד"
          if (typeof entry === 'string') {
            const idx = entry.indexOf(':');
            if (idx > -1) {
              const t = entry.slice(0, idx).trim();
              const c = entry.slice(idx + 1).trim();
              if (t && c) out.push({ title: t, code: c, category: cat });
            }
            return;
          }
          // מערך [כותרת, קוד]
          if (Array.isArray(entry) && entry.length >= 2) {
            const t = String(entry[0] ?? '').trim();
            const c = String(entry[1] ?? '').trim();
            if (t && c) out.push({ title: t, code: c, category: cat });
            return;
          }
        });
      });
      return out;
    }
    return out;
  }

  // הפקת רשימת קטגוריות מתוך ה-ITEMS (אם אין שדה category, נשתמש ב"כללי")
  function deriveCategories(list) {
    const cats = new Map();
    list.forEach(it => {
      const c = (it.category || it.cat || 'כללי').trim() || 'כללי';
      cats.set(c, (cats.get(c) || 0) + 1);
    });
    return Array.from(cats.keys());
  }

  // מצב בחירה: מזהי פריטים שנבחרו
  const SELECTED = new Set();

  function aggregateSelectedText() {
    const lines = [];
    // קיבוץ לפי קטגוריה כדי להוסיף כותרת קטגוריה לפני הפריטים
    const byCat = new Map();
    ITEMS.forEach(it => {
      const c = (it.category || it.cat || 'כללי');
      if (!byCat.has(c)) byCat.set(c, []);
      byCat.get(c).push(it);
    });
    for (const [cat, arr] of byCat.entries()) {
      const catLines = [];
      arr.forEach(it => {
        const key = it.title + '|' + it.code;
        if (SELECTED.has(key)) {
          catLines.push(`${it.code}//${it.title}`);
        }
      });
      if (catLines.length) {
        lines.push(`; === ${cat} ===`);
        lines.push(...catLines);
      }
    }
    return lines.join('\n');
  }

  function findExtIniTextarea() {
    const labels = Array.from(document.querySelectorAll('label, b, strong, span, div')).filter(el => /ext\.??ini|תוכן\s*השלוחה/i.test(el.textContent || ''));
    for (const lbl of labels) {
      const area = lbl.parentElement?.querySelector('textarea') || lbl.closest('tr, .form-group, .panel, .card, .box, .row')?.querySelector('textarea');
      if (area) return area;
    }
    const cand = Array.from(document.querySelectorAll('textarea')).filter(t => /ext|ini/i.test(t.id) || /ext|ini/i.test(t.name));
    if (cand.length) return cand[0];
    const all = Array.from(document.querySelectorAll('textarea'));
    if (all.length) return all.sort((a, b) => (b.rows * b.cols) - (a.rows * a.cols))[0];
    return null;
  }


  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); showToast('הועתק ללוח'); }
    catch { showToast('נכשל בהעתקה'); }
  }

  async function loadJSONFromGitHub(url) {
    const refreshBtn = document.querySelector('#ymRefreshBtn');
    if (refreshBtn) refreshBtn.classList.add('loading');
    showToast('טוען JSON...');
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      const normalized = normalizeLoadedData(data);
      if (normalized.length) {
        ITEMS = normalized;
        saveItems();
        // רענון קטגוריות ורשימה בהתאם לבחירה וחיפוש נוכחיים
        const $cat = document.querySelector('#ymCategorySelect');
        const $input = document.querySelector('#ymSearchInput');
        const inputValue = $input?.value || '';
        if ($cat) {
          renderCategories(ITEMS);
        }
        const base = !$cat || $cat.value === '__all__' ? ITEMS : ITEMS.filter(it => (it.category||it.cat||'כללי')===$cat.value);
        renderResults(filterItems(base, inputValue));
        showToast('JSON נטען בהצלחה!');
      } else showToast('JSON אינו תקין');
    } catch (e) {
      console.error(e);
      showToast('טעינת JSON נכשלה');
    } finally {
      if (refreshBtn) refreshBtn.classList.remove('loading');
    }
  }

  function exportToFile() {
    const dataStr = JSON.stringify(ITEMS, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ym_items_export.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('הגדרות יוצאו בהצלחה!');
  }

  function importFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const normalized = normalizeLoadedData(data);
        if (normalized.length) {
          ITEMS = normalized;
          saveItems();
          const $cat = document.querySelector('#ymCategorySelect');
          const inputValue = document.querySelector('#ymSearchInput')?.value || '';
          if ($cat) renderCategories(ITEMS);
          const base = !$cat || $cat.value === '__all__' ? ITEMS : ITEMS.filter(it => (it.category||it.cat||'כללי')===$cat.value);
          renderResults(filterItems(base, inputValue));
          showToast('הגדרות יובאו בהצלחה!');
        } else {
          showToast('קובץ JSON אינו תקין');
        }
      } catch {
        showToast('שגיאה בייבוא קובץ');
      }
    };
    reader.readAsText(file);
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ym-helper-bar { background: transparent; padding: 10px 0; font-family: system-ui, -apple-system, Segoe UI, Arial, sans-serif; direction: rtl; color: #0f172a; }
      .ym-helper-wrap { display: flex; flex-direction: column; gap: 10px; width: 100%; }
      .ym-input-wrap { flex: 1 1 220px; min-width: 160px; }
      .ym-input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 12px; outline: none; font-size: 15px; background: #ffffff; color: #0f172a; transition: all 0.2s; line-height: 1.35; }
      .ym-input::placeholder { color: #94a3b8; }
      .ym-input:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,.15); }
      .ym-select { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; color: #0f172a; font-size: 15px; }
      .ym-btn { padding: 10px 14px; border: 1px solid #cbd5e1; background: #0ea5e9; color: #ffffff; border-radius: 12px; cursor: pointer; font-size: 14px; transition: all 0.2s; white-space: nowrap; box-shadow: 0 2px 6px rgba(14,165,233,.25); }
      .ym-btn:hover { background: #0284c7; transform: translateY(-1px); }
      .ym-btn.ghost { background: #ffffff; color: #0f172a; }
      .ym-btn.loading { position: relative; color: transparent; }
      .ym-btn.loading::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 2px solid #4f46e5; border-top-color: transparent; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; }
      @keyframes spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
      .ym-last-update { font-size: 11px; color: #64748b; white-space: nowrap; }
      .ym-bar-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; width: 100%; }
      .ym-results { position: relative; background: #ffffff; border: 1px solid #e2e8f0; height: 45vh; overflow: auto; border-radius: 12px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04); margin-top: 10px; }
      .ym-results.hidden { display: block; }
      .ym-result { padding: 10px 12px; border-bottom: 1px solid #eef2ff; display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; }
      .ym-result:last-child { border-bottom: none; }
      .ym-result:hover { background: #f1f5f9; cursor: pointer; }
      .ym-result.selected { background: #e0f2fe; }
      .ym-check { margin-top: 3px; }
      .ym-info { overflow: hidden; }
      .ym-title { font-weight: 700; font-size: 14px; color: #0f172a; }
      .ym-code { white-space: pre-wrap; font-family: ui-monospace, monospace; font-size: 13px; color: #334155; opacity: .95; max-height: 6em; overflow: hidden; }
      .ym-selected-box { margin-top: 10px; display: grid; gap: 8px; }
      .ym-selected-textarea { width: 100%; min-height: 150px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; font-family: ui-monospace, monospace; font-size: 13px; }
      .ym-category { font-weight: 700; padding: 8px 10px; background: #f0f9ff; border: 1px solid #e0f2fe; color: #0369a1; border-radius: 10px; margin-top: 10px; }
      .ym-toast { position: fixed; top: 15px; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 6px 10px; border-radius: 10px; font-size: 12px; z-index: 100000; opacity: 0.95; box-shadow: 0 3px 8px rgba(0,0,0,0.15); }
      .ym-file-input { display: none; }
      @media (max-width: 600px) {
        .ym-helper-wrap, .ym-bar-row { flex-direction: column; align-items: stretch; }
        .ym-btn, .ym-last-update, .ym-select { width: 100%; text-align: center; font-size: 14px; padding: 10px; }
        .ym-results { height: 60vh; }
        .ym-input { font-size: 14px; }
      }
    `;
    document.head.appendChild(style);
  }

  function updateLastUpdateDisplay() {
    const lastUpdateEl = document.querySelector('#ymLastUpdate');
    if (lastUpdateEl) lastUpdateEl.textContent = `עדכון אחרון: ${LAST_UPDATE}`;
  }

  function buildUI() {
    addStyles();
    const bar = document.createElement('div');
    bar.className = 'ym-helper-bar';
    bar.innerHTML = `
      <div class="ym-helper-wrap">
        <div class="ym-bar-row">
          <select class="ym-select" id="ymCategorySelect" title="סינון לפי קטגוריה">
            <option value="__all__">כל הקטגוריות</option>
          </select>
          <div class="ym-input-wrap">
            <input class="ym-input" id="ymSearchInput" type="text" placeholder="חיפוש הגדרה... (Alt+K)"/>
          </div>
        </div>
        <div class="ym-bar-row">
          <button class="ym-btn" id="ymRefreshBtn" title="טעינת נתונים מקובץ ה-GitHub">עדכן מגיטהב</button>
          <button class="ym-btn ghost" id="ymExportBtn" title="ייצוא הרשימה הנוכחית לקובץ JSON">ייצא לקובץ</button>
          <label class="ym-btn ghost" for="ymImportInput" title="ייבוא מקובץ JSON מהמחשב">ייבא מקובץ</label>
          <input type="file" id="ymImportInput" class="ym-file-input" accept=".json"/>
          <span class="ym-last-update" id="ymLastUpdate">עדכון אחרון: ${LAST_UPDATE}</span>
        </div>
        <div class="ym-results" id="ymResults"></div>
        <div class="ym-selected-box">
          <label class="ym-title">תצוגת EXT שנבחרו</label>
          <textarea id="ymSelectedText" class="ym-selected-textarea" placeholder="השורות שתבחר יופיעו כאן"></textarea>
          <div class="ym-bar-row">
            <button class="ym-btn" id="ymCopySelected" title="העתקת כל השורות הנבחרות ללוח">העתק הכל</button>
            <button class="ym-btn" id="ymPasteSelected" title="הדבקת כל השורות הנבחרות ל-EXT.INI">הדבק הכל ל-EXT.INI</button>
            <button class="ym-btn ghost" id="ymClearSelected" title="איפוס בחירה">נקה בחירה</button>
          </div>
        </div>
      </div>
    `;
    const container = document.querySelector('#ym-panel-search-container') || document.body;
    // נקה תוכן קודם והטמע בתוך החלונית הימנית
    container.innerHTML = '';
    container.appendChild(bar);

    const $input = bar.querySelector('#ymSearchInput');
    const $results = bar.querySelector('#ymResults');
    const $cat = bar.querySelector('#ymCategorySelect');
    const $selected = bar.querySelector('#ymSelectedText');

    function applySelectedText() { $selected.value = aggregateSelectedText(); }
    function itemKey(it){ return it.title + '|' + it.code; }
    window.renderCategories = function(list){
      const cats = deriveCategories(list);
      if (!$cat) return;
      $cat.innerHTML = '<option value="__all__">כל הקטגוריות</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
    }

    window.renderResults = function (list) {
      if (!$results) return;
      if (!list.length) {
        $results.innerHTML = `<div class="ym-result"><div class="ym-title">לא נמצאו תוצאות</div></div>`;
        $results.classList.remove('hidden');
        return;
      }
      $results.innerHTML = '';
      // קיבוץ לפי קטגוריות + כותרת לכל קטגוריה
      const byCat = new Map();
      list.forEach(it => {
        const c = (it.category || it.cat || 'כללי');
        if (!byCat.has(c)) byCat.set(c, []);
        byCat.get(c).push(it);
      });
      for (const [cat, arr] of byCat.entries()) {
        const header = document.createElement('div');
        header.className = 'ym-category';
        header.textContent = cat;
        $results.appendChild(header);
        arr.forEach((it) => {
          const r = document.createElement('div');
          r.className = 'ym-result';
          const desc = it.desc || it.help || '';
          r.innerHTML = `
            <div class="ym-info">
              <div class="ym-title" title="${desc ? desc.replace(/\"/g,'\\\"') : 'הגדרה'}">${it.title}</div>
              <div class="ym-code" title="${desc ? desc.replace(/\"/g,'\\\"') : ''}">${it.code}</div>
              ${desc ? `<div class=\"ym-hint\">${desc}</div>` : ''}
            </div>
          `;
          const k = itemKey(it);
          if (SELECTED.has(k)) {
            r.classList.add('selected');
          }
          r.addEventListener('click', () => {
            if (SELECTED.has(k)) {
              SELECTED.delete(k);
              r.classList.remove('selected');
            } else {
              SELECTED.add(k);
              r.classList.add('selected');
            }
            applySelectedText();
          });
          $results.appendChild(r);
        });
      }
      // נשאיר תמיד גלוי
    };

    // הצגת תוצאות קבועה; אין הסתרה ב-blur
    const baseFocus = () => {
      const base = $cat.value==='__all__' ? ITEMS : ITEMS.filter(it => (it.category||it.cat||'כללי')===$cat.value);
      renderResults(filterItems(base, $input.value));
    };
    $input.addEventListener('focus', baseFocus);
    $input.addEventListener('input', () => {
      const base = $cat.value==='__all__' ? ITEMS : ITEMS.filter(it => (it.category||it.cat||'כללי')===$cat.value);
      renderResults(filterItems(base, $input.value));
    });

    bar.querySelector('#ymRefreshBtn').addEventListener('click', () => loadJSONFromGitHub(GITHUB_RAW_URL));
    bar.querySelector('#ymExportBtn').addEventListener('click', exportToFile);
    bar.querySelector('#ymImportInput').addEventListener('change', importFromFile);
    bar.querySelector('#ymCopySelected').addEventListener('click', ()=>{ copyToClipboard(aggregateSelectedText()); });
    bar.querySelector('#ymPasteSelected').addEventListener('click', ()=>{
      const ta = findExtIniTextarea(); if(!ta){ showToast('לא נמצאה תיבת טקסט של EXT.INI'); return; }
      const txt = aggregateSelectedText();
      if (!txt) { showToast('לא נבחרו הגדרות'); return; }
      ta.value += (ta.value.endsWith('\n')?'':'\n') + txt + '\n';
      ta.dispatchEvent(new Event('input',{bubbles:true})); ta.dispatchEvent(new Event('change',{bubbles:true})); ta.focus(); ta.scrollTop = ta.scrollHeight;
      showToast('נוסף ל-EXT.INI');
    });
    bar.querySelector('#ymClearSelected').addEventListener('click', ()=>{ 
      SELECTED.clear(); 
      applySelectedText(); 
      bar.querySelectorAll('.ym-result.selected').forEach(el => el.classList.remove('selected')); 
    });

    // הכנת קטגוריות ותצוגה ראשונית
    renderCategories(ITEMS);
    const base = ITEMS;
    renderResults(filterItems(base, ''));
    applySelectedText();
    updateLastUpdateDisplay();
    // טעינה אוטומטית ראשונית מה-RAW כדי שהרשימה תתעדכן בלי לחיצה
    loadJSONFromGitHub(GITHUB_RAW_URL).catch(()=>{});
    $cat.addEventListener('change', ()=>{
      const base2 = $cat.value==='__all__' ? ITEMS : ITEMS.filter(it => (it.category||it.cat||'כללי')===$cat.value);
      renderResults(filterItems(base2, $input.value));
    });
  }

  buildUI();

  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === HOTKEY.key) {
      const inp = document.querySelector('#ymSearchInput');
      if (inp) { inp.focus(); inp.select(); e.preventDefault(); }
    }
  });
})();

// YM IDE Module — תמיכת IDE לעריכת EXT.INI
(function YMIDEModule() {
  'use strict';

  const SCHEMA_URL = 'https://raw.githubusercontent.com/Y-PLONI/yemot-extension/main/ym_settings_schema.json';
  let SCHEMA = null;
  let VALIDATION_ENABLED = false;

  // סכימה מוטמעת (כברירת מחדל עד שנעלה ל-GitHub)
  const EMBEDDED_SCHEMA = {
    "version": "1.0.0",
    "lastUpdate": "2025-10-15",
    "modules": {
      "general": {
        "name": "הגדרות כלליות",
        "description": "הגדרות שאינן תלויות במודול ספציפי",
        "settings": [
          {"key": "title", "description": "כותרת השלוחה", "type": "text", "required": false, "example": "title=ברוכים הבאים"},
          {"key": "password", "description": "סיסמה לשלוחה", "type": "text", "required": false, "example": "password=1234"},
          {"key": "language", "description": "שפת המערכת", "type": "enum", "required": false, "values": ["he", "en", "ar"], "default": "he", "example": "language=he"}
        ]
      },
      "menu": {
        "name": "תפריט",
        "description": "מודול תפריט בסיסי",
        "type_value": "menu",
        "settings": [
          {"key": "type", "description": "הגדרת מודול", "type": "fixed", "required": true, "value": "menu", "example": "type=menu"},
          {"key": "digits", "description": "מספר ספרות", "type": "number", "required": false, "range": [1, 9], "example": "digits=2"}
        ]
      },
      "api": {
        "name": "API",
        "description": "חיבור לשרתים חיצוניים",
        "type_value": "api",
        "settings": [
          {"key": "type", "description": "הגדרת מודול API", "type": "fixed", "required": true, "value": "api", "example": "type=api"},
          {"key": "api_link", "description": "כתובת URL של ה-API", "type": "url", "required": true, "example": "api_link=https://example.com/api"},
          {"key": "api_call_id_send", "description": "שליחת מזהה שיחה", "type": "enum", "required": false, "values": ["yes", "no"], "default": "no", "example": "api_call_id_send=no"}
        ]
      }
    }
  };

  // טעינת הסכימה - תחילה מוטמעת, אז מ-GitHub
  async function loadSchema() {
    try {
      const response = await fetch(SCHEMA_URL);
      SCHEMA = await response.json();
      console.log('✅ YM IDE Schema loaded from GitHub');
      return true;
    } catch (error) {
      console.warn('⚠️  Failed to load from GitHub, using embedded schema');
      SCHEMA = EMBEDDED_SCHEMA;
      console.log('✅ YM IDE Schema loaded (embedded)');
      return true;
    }
  }

  // פרסור תוכן EXT.INI
  function parseExtIni(content) {
    const lines = content.split('\n');
    const parsed = {
      module: null,
      settings: {},
      errors: [],
      warnings: [],
      lineInfo: []
    };

    let currentModule = 'general';
    let lineNumber = 0;

    for (const rawLine of lines) {
      lineNumber++;
      const line = rawLine.trim();

      const lineInfo = {
        number: lineNumber,
        raw: rawLine,
        trimmed: line,
        type: 'empty',
        key: null,
        value: null,
        module: currentModule
      };

      if (!line) {
        parsed.lineInfo.push(lineInfo);
        continue;
      }

      if (line.startsWith(';') || line.startsWith('//')) {
        lineInfo.type = 'comment';
        parsed.lineInfo.push(lineInfo);
        continue;
      }

      if (line.includes('=')) {
        const equalIndex = line.indexOf('=');
        const key = line.substring(0, equalIndex).trim();
        const value = line.substring(equalIndex + 1).trim();

        lineInfo.type = 'setting';
        lineInfo.key = key;
        lineInfo.value = value;

        if (key === 'type') {
          currentModule = value.toLowerCase(); // ממיר לאותיות קטנות
          parsed.module = currentModule;
          lineInfo.module = currentModule;
          console.log('📋 Module detected:', currentModule);
        }

        parsed.settings[key.toLowerCase()] = value; // גם מפתחות באותיות קטנות
        parsed.lineInfo.push(lineInfo);
        continue;
      }

      lineInfo.type = 'unknown';
      parsed.errors.push({
        line: lineNumber,
        message: 'שורה לא מזוהה - צריך להיות בפורמט key=value',
        severity: 'error'
      });
      parsed.lineInfo.push(lineInfo);
    }

    console.log('📋 Final parsed module:', parsed.module);
    return parsed;
  }

  // ולידציה של הגדרות מול הסכימה
  function validateSettings(parsed) {
    if (!SCHEMA) return parsed;

    const currentModule = parsed.module || 'general';
    const moduleSchema = SCHEMA.modules[currentModule];
    const generalSchema = SCHEMA.modules.general;

    if (!moduleSchema && !generalSchema) {
      parsed.errors.push({
        line: 0,
        message: `מודול לא מוכר: ${currentModule}`,
        severity: 'error'
      });
      return parsed;
    }

    for (const lineInfo of parsed.lineInfo) {
      if (lineInfo.type !== 'setting') continue;

      // חפש בסכימה של המודול הנוכחי
      let settingDef = moduleSchema?.settings.find(s => s.key === lineInfo.key);
      
      // אם לא נמצא, חפש בהגדרות כלליות
      if (!settingDef && generalSchema) {
        settingDef = generalSchema.settings.find(s => s.key === lineInfo.key);
      }
      
      if (!settingDef) {
        parsed.errors.push({
          line: lineInfo.number,
          message: `הגדרה לא מוכרת: ${lineInfo.key}`,
          severity: 'error',
          key: lineInfo.key
        });
        continue;
      }

      // בדיקת ערכים אפשריים עבור enum
      if (settingDef.type === 'enum' && settingDef.values) {
        if (!settingDef.values.includes(lineInfo.value)) {
          parsed.errors.push({
            line: lineInfo.number,
            message: `ערך לא תקין. ערכים אפשריים: ${settingDef.values.join(', ')}`,
            severity: 'error',
            key: lineInfo.key
          });
        }
      }
    }

    return parsed;
  }

  // קבלת הצעות השלמה חכמות
  function getSmartSuggestions(parsed) {
    if (!SCHEMA) {
      console.warn('⚠️  Schema not loaded, cannot provide suggestions');
      return [];
    }

    const suggestions = [];
    const currentModule = parsed.module || 'general';
    const moduleSchema = SCHEMA.modules[currentModule];
    const generalSchema = SCHEMA.modules.general;

    console.log('💡 Generating suggestions for module:', currentModule);

    // הוסף הצעות מהמודול הנוכחי
    if (moduleSchema) {
      for (const settingDef of moduleSchema.settings) {
        // אל תציע 'type' אם כבר יש מודול מוגדר (למעט אם אנחנו ב-general)
        if (settingDef.key === 'type' && parsed.module && parsed.module !== 'general') continue;
        
        if (!parsed.settings[settingDef.key]) {
          suggestions.push({
            key: settingDef.key,
            value: settingDef.default || settingDef.example || '',
            description: settingDef.description || 'אין תיאור',
            required: settingDef.required || false,
            example: settingDef.example || `${settingDef.key}=`,
            priority: settingDef.required ? 100 : 50,
            module: currentModule
          });
        }
      }
    }

    // הוסף הצעות מהגדרות כלליות (אם לא במודול general)
    if (currentModule !== 'general' && generalSchema) {
      for (const settingDef of generalSchema.settings) {
        if (!parsed.settings[settingDef.key]) {
          suggestions.push({
            key: settingDef.key,
            value: settingDef.default || settingDef.example || '',
            description: settingDef.description + ' (כללי)',
            required: false,
            example: settingDef.example || `${settingDef.key}=`,
            priority: 30,
            module: 'general'
          });
        }
      }
    }

    // אם אנחנו ב-general ואין type, הצע את כל המודולים האפשריים
    if (currentModule === 'general' && !parsed.settings['type']) {
      for (const moduleName in SCHEMA.modules) {
        if (moduleName === 'general') continue;
        const modSchema = SCHEMA.modules[moduleName];
        if (modSchema.type_value) {
          suggestions.push({
            key: 'type',
            value: modSchema.type_value,
            description: `מודול ${modSchema.name}`,
            required: false,
            example: `type=${modSchema.type_value}`,
            priority: 80,
            module: moduleName
          });
        }
      }
    }

    // הסר כפילויות (לפי key)
    const uniqueSuggestions = [];
    const seenKeys = new Set();
    for (const sug of suggestions) {
      const uniqueKey = sug.key + '=' + sug.value;
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        uniqueSuggestions.push(sug);
      }
    }

    uniqueSuggestions.sort((a, b) => b.priority - a.priority);
    console.log('💡 Found', uniqueSuggestions.length, 'suggestions');
    return uniqueSuggestions;
  }

  // אתחול
  async function initialize() {
    console.log('🚀 YM IDE Module initializing...');
    
    const schemaLoaded = await loadSchema();
    if (!schemaLoaded) {
      console.error('❌ YM IDE failed to load schema');
      return;
    }

    VALIDATION_ENABLED = true;

    if (window.YMHelper) {
      window.YMHelper.IDE = {
        parseExtIni,
        validateSettings,
        getSmartSuggestions,
        isReady: () => VALIDATION_ENABLED,
        getSchema: () => SCHEMA
      };
      console.log('✅ YM IDE Module ready! Schema has', Object.keys(SCHEMA.modules || {}).length, 'modules');
    }
  }

  initialize();
})();

// ============================
// YM IDE UI Module — ממשק משתמש
// ============================
(function YMIDEUIModule() {
  'use strict';

  let textarea = null;
  let overlay = null;
  let toggleButton = null;
  let isIDEActive = false;

  function waitForIDE() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.YMHelper?.IDE?.isReady()) {
          resolve(true);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  function createIDEWrapper() {
    textarea = document.querySelector('#extini_editor_textarea');
    if (!textarea) {
      console.warn('⚠️  Textarea not found');
      return false;
    }

    if (textarea.parentElement?.classList.contains('ym-ide-wrapper')) {
      console.log('✅ IDE Wrapper exists');
      return true;
    }

    console.log('🔨 Creating IDE Wrapper');

    const wrapper = document.createElement('div');
    wrapper.className = 'ym-ide-wrapper';
    wrapper.style.cssText = 'position:relative;width:100%;height:' + (textarea.style.height || '260px');

    overlay = document.createElement('div');
    overlay.className = 'ym-ide-overlay';
    
    // סנכרון סגנון מדויק בין overlay ל-textarea
    const syncOverlay = () => {
      const cs = window.getComputedStyle(textarea);
      overlay.style.fontSize = cs.fontSize;
      overlay.style.lineHeight = cs.lineHeight;
      overlay.style.fontFamily = cs.fontFamily;
      overlay.style.padding = cs.padding;
      overlay.style.paddingTop = cs.paddingTop;
      overlay.style.paddingRight = cs.paddingRight;
      overlay.style.paddingBottom = cs.paddingBottom;
      overlay.style.paddingLeft = cs.paddingLeft;
      overlay.style.border = cs.border;
      overlay.style.borderWidth = cs.borderWidth;
      overlay.style.letterSpacing = cs.letterSpacing;
      overlay.style.wordSpacing = cs.wordSpacing;
    };
    
    const ro = new ResizeObserver(syncOverlay);
    ro.observe(textarea);
    syncOverlay();

    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.appendChild(overlay);
    wrapper.appendChild(textarea);

    // סנכרון גלילה - overlay לא צריך לגלול כי הוא מתחת
    textarea.addEventListener('scroll', () => {
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;
    });

    // הסתר את הכפתור הצף אם IDE פעיל כדי למנוע התנגשות
    if (toggleButton) {
      toggleButton.style.display = 'none';
    }

    console.log('✅ Wrapper created');
    createToggleButton();
    return true;
  }

  function createToggleButton() {
    const extEditor = document.querySelector('#extini_editor');
    if (!extEditor || document.querySelector('.ym-ide-toggle')) return;

    toggleButton = document.createElement('div');
    toggleButton.className = 'ym-ide-toggle';
    toggleButton.innerHTML = '<span class="ym-ide-toggle-icon">🤖</span><span class="ym-ide-toggle-text">IDE</span>';
    toggleButton.title = 'הפעל/כבה מצב IDE';
    toggleButton.addEventListener('click', toggleIDE);
    
    const wrapper = textarea?.parentElement;
    if (wrapper?.classList.contains('ym-ide-wrapper')) {
      extEditor.insertBefore(toggleButton, wrapper);
    } else {
      extEditor.appendChild(toggleButton);
    }

    console.log('✅ Toggle button created');
  }

  function toggleIDE() {
    isIDEActive = !isIDEActive;
    toggleButton?.classList.toggle('active', isIDEActive);

    if (isIDEActive) {
      startIDE();
    } else {
      stopIDE();
    }
  }

  function startIDE() {
    if (!textarea) return;
    
    textarea.addEventListener('input', analyzeContent);
    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('keydown', handleKeyDown);
    analyzeContent();
    console.log('✅ IDE activated');
  }

  function handleInput(e) {
    // הצג autocomplete תוך כדי הקלדה
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const currentLine = textBeforeCursor.split('\n').pop();
    
    // אם השורה לא ריקה ואין '=' עדיין, הצג הצעות
    if (currentLine.trim() && !currentLine.includes('=')) {
      showAutocomplete();
    }
  }

  function handleKeyDown(e) {
    const menu = document.querySelector('.ym-autocomplete-menu');
    
    // אם יש תפריט פתוח, טפל בניווט
    if (menu) {
      const items = menu.querySelectorAll('.ym-autocomplete-item');
      const selected = menu.querySelector('.ym-autocomplete-item.selected');
      let selectedIndex = selected ? Array.from(items).indexOf(selected) : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelection(items, selectedIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection(items, selectedIndex);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (selected) {
          selected.click();
        } else if (items[0]) {
          items[0].click();
        }
      } else if (e.key === 'Escape') {
        menu.remove();
      }
      return;
    }

    // Ctrl+Space להצגת autocomplete ידנית
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      showAutocomplete();
    }
  }

  function updateSelection(items, index) {
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  function showAutocomplete() {
    if (!textarea || !window.YMHelper?.IDE) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const currentLine = textBeforeCursor.split('\n').pop().trim();

    console.log('🔍 Showing autocomplete for:', currentLine);

    // קבל את כל ההצעות
    let suggestions = window.YMHelper.IDE.getSmartSuggestions(
      window.YMHelper.IDE.parseExtIni(textarea.value)
    );

    // סנן לפי מה שהמשתמש כבר הקליד
    if (currentLine) {
      const searchTerm = currentLine.toLowerCase();
      suggestions = suggestions.filter(sug => 
        sug.key.toLowerCase().startsWith(searchTerm) ||
        sug.key.toLowerCase().includes(searchTerm)
      );
      
      // מיין: תחילה אלה שמתחילים עם המילה, אחר כך אלה שמכילים
      suggestions.sort((a, b) => {
        const aStarts = a.key.toLowerCase().startsWith(searchTerm);
        const bStarts = b.key.toLowerCase().startsWith(searchTerm);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return b.priority - a.priority;
      });
    }

    if (suggestions.length === 0) {
      console.log('⚠️  No suggestions found');
      const menu = document.querySelector('.ym-autocomplete-menu');
      if (menu) menu.remove();
      return;
    }

    console.log('💡 Found', suggestions.length, 'suggestions');
    displayAutocompleteMenu(suggestions, cursorPos);
  }

  function displayAutocompleteMenu(suggestions, cursorPos) {
    // הסר תפריט קיים
    let menu = document.querySelector('.ym-autocomplete-menu');
    if (menu) menu.remove();

    // צור תפריט חדש
    menu = document.createElement('div');
    menu.className = 'ym-autocomplete-menu';
    menu.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-height: 300px;
      overflow-y: auto;
      z-index: 10000;
      min-width: 300px;
    `;

    suggestions.forEach((sug, index) => {
      const item = document.createElement('div');
      item.className = 'ym-autocomplete-item';
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
      `;
      
      item.innerHTML = `
        <div style="font-weight:600;color:#2563eb;">${sug.key}${sug.required ? ' <span style="color:#ef4444;">*</span>' : ''}</div>
        <div style="font-size:12px;color:#666;margin-top:2px;">${sug.description}</div>
        <div style="font-size:11px;color:#999;margin-top:2px;font-family:monospace;">${sug.example}</div>
      `;

      item.addEventListener('mouseenter', () => {
        item.style.background = '#f0f7ff';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.background = '';
      });

      item.addEventListener('click', () => {
        insertSuggestion(sug.example);
        menu.remove();
      });

      menu.appendChild(item);
    });

    // מקם את התפריט
    const coords = getCaretCoordinates();
    menu.style.top = (coords.top + 20) + 'px';
    menu.style.left = coords.left + 'px';

    document.body.appendChild(menu);

    // סגור בלחיצה על Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        menu.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function getCaretCoordinates() {
    const rect = textarea.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX
    };
  }

  function insertSuggestion(text) {
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(cursorPos);
    
    // מצא את תחילת השורה הנוכחית
    const lineStart = textBefore.lastIndexOf('\n') + 1;
    const currentLine = textBefore.substring(lineStart);
    
    // אם יש '=' בשורה הנוכחית, החלף רק את המפתח
    if (text.includes('=')) {
      const newLine = text;
      textarea.value = textBefore.substring(0, lineStart) + newLine + textAfter;
      
      // שים את הסמן אחרי ה-'='
      const equalPos = lineStart + newLine.indexOf('=') + 1;
      textarea.selectionStart = textarea.selectionEnd = equalPos;
    } else {
      // אחרת, החלף את כל השורה
      textarea.value = textBefore.substring(0, lineStart) + text + '\n' + textAfter;
      textarea.selectionStart = textarea.selectionEnd = lineStart + text.length + 1;
    }
    
    // עדכן ניתוח
    analyzeContent();
    textarea.focus();
    
    // הסר את התפריט
    const menu = document.querySelector('.ym-autocomplete-menu');
    if (menu) menu.remove();
  }

  function stopIDE() {
    if (!textarea) return;

    textarea.removeEventListener('input', analyzeContent);
    textarea.removeEventListener('input', handleInput);
    textarea.removeEventListener('keydown', handleKeyDown);
    if (overlay) overlay.innerHTML = '';

    // הסר תפריט autocomplete אם קיים
    const menu = document.querySelector('.ym-autocomplete-menu');
    if (menu) menu.remove();

    // הראה את הכפתור הצף שוב
    if (toggleButton) {
      toggleButton.style.display = '';
    }

    // חזור להורים המקוריים של ה-textarea
    const wrapper = textarea.parentElement;
    if (wrapper?.classList.contains('ym-ide-wrapper')) {
      const parent = wrapper.parentElement;
      if (parent) {
        parent.insertBefore(textarea, wrapper);
        parent.removeChild(wrapper);
      }
    }

    console.log('⏸️  IDE deactivated');
  }

  function analyzeContent() {
    if (!textarea || !overlay || !window.YMHelper?.IDE) return;

    const content = textarea.value;
    const parsed = window.YMHelper.IDE.parseExtIni(content);
    const validated = window.YMHelper.IDE.validateSettings(parsed);

    console.log('🔍 Found', validated.errors.length, 'errors in content analysis');
    console.log('📋 Content preview:', content.substring(0, 200) + '...');

    updateOverlay(validated);
  }

  function updateOverlay(validated) {
    if (!overlay) return;

    const lines = textarea.value.split('\n');
    let html = '';

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const line = lines[i];

      const lineErrors = validated.errors.filter(e => e.line === lineNumber);

      if (lineErrors.length > 0) {
        // הוסף את הטקסט עם סימון שגיאה
        const errorMessages = lineErrors.map(e => e.message).join(', ');
        const escapedLine = line.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
        html += `<span class="ym-ide-error" title="${errorMessages}" style="position: relative; display: inline-block;">${escapedLine}</span>`;
        console.log(`🛑 Error on line ${lineNumber}: ${line} - ${errorMessages}`);
      } else {
        // הוסף טקסט רגיל
        html += line.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
      }

      if (i < lines.length - 1) html += '\n';
    }

    overlay.innerHTML = html;

    // סנכרן גלילה ומיקום
    overlay.scrollTop = textarea.scrollTop;
    overlay.scrollLeft = textarea.scrollLeft;

    // עדכן את הגובה של ה-overlay כדי להתאים לטקסט
    const overlayHeight = overlay.scrollHeight;
    overlay.style.height = overlayHeight + 'px';
  }

  async function initialize() {
    console.log('🎨 YM IDE UI initializing...');
    await waitForIDE();

    let retries = 0;
    const tryCreate = () => {
      if (createIDEWrapper()) {
        console.log('✅ YM IDE UI ready!');
      } else if (retries++ < 10) {
        setTimeout(tryCreate, 1000);
      }
    };
    
    tryCreate();
  }

  initialize();
})();
