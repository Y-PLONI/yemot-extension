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

