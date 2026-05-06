/* ============================================================
   FORM ENGINE — Shared helpers for both forms
   ============================================================ */

// ============ CONFIG ============
// IMPORTANT: Replace this with your Apps Script Web App URL after deployment
const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwG03QCJ5A_dBDjqhH_NgKJhv9ojGSX9lJ4yD-GUoxdrHUexHgGD28n3Zl2NN0S7EfH/exec';

// ============ DOM HELPERS ============
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

// ============ TEXT FIELD BUILDERS ============
function buildTextField({ id, label, required = false, placeholder = '', help = '' }) {
  return el('div', { class: 'field' }, [
    el('label', { class: 'field-label', for: id, html: `${label}${required ? ' <span class="req">*</span>' : ''}` }),
    el('input', { type: 'text', id, name: id, placeholder, required: required ? '' : null, 'data-required': required ? 'true' : null }),
    help ? el('div', { class: 'help-text' }, help) : null
  ]);
}

function buildTextarea({ id, label, required = false, placeholder = '', help = '', minHeight = 90 }) {
  const ta = el('textarea', { id, name: id, placeholder, required: required ? '' : null, 'data-required': required ? 'true' : null, style: `min-height: ${minHeight}px` });
  return el('div', { class: 'field' }, [
    el('label', { class: 'field-label', for: id, html: `${label}${required ? ' <span class="req">*</span>' : ''}` }),
    ta,
    help ? el('div', { class: 'help-text' }, help) : null
  ]);
}

function buildDateField({ id, label, required = false }) {
  return el('div', { class: 'field' }, [
    el('label', { class: 'field-label', for: id, html: `${label}${required ? ' <span class="req">*</span>' : ''}` }),
    el('input', { type: 'date', id, name: id, required: required ? '' : null, 'data-required': required ? 'true' : null })
  ]);
}

function buildSelect({ id, label, options, required = false, help = '', placeholder = 'Select…' }) {
  const select = el('select', { id, name: id, required: required ? '' : null, 'data-required': required ? 'true' : null });
  select.appendChild(el('option', { value: '' }, placeholder));
  options.forEach(opt => {
    const value = typeof opt === 'string' ? opt : opt.value;
    const text = typeof opt === 'string' ? opt : opt.label;
    select.appendChild(el('option', { value }, text));
  });
  return el('div', { class: 'field' }, [
    el('label', { class: 'field-label', for: id, html: `${label}${required ? ' <span class="req">*</span>' : ''}` }),
    select,
    help ? el('div', { class: 'help-text' }, help) : null
  ]);
}

// ============ GRID BUILDERS ============
/**
 * Build a single-select grid: rows × columns, one radio per row.
 * @param {object} config - { id, prefix, rows, columns, label, help, required }
 */
function buildScoringGrid({ id, prefix, rows, columns, label, help = '', required = true }) {
  const wrapper = el('div', { class: 'field' });
  if (label) wrapper.appendChild(el('label', { class: 'field-label', html: `${label}${required ? ' <span class="req">*</span>' : ''}` }));
  if (help) wrapper.appendChild(el('div', { class: 'help-text', style: 'margin-bottom: 0.75rem;' }, help));

  const table = el('div', { class: 'grid-table', id });

  // Header row
  const headerRow = el('div', { class: 'grid-table-row header', style: `grid-template-columns: minmax(180px, 2.5fr) repeat(${columns.length}, 1fr);` });
  headerRow.appendChild(el('div', { class: 'row-label' }, 'Item'));
  columns.forEach(col => {
    headerRow.appendChild(el('div', { class: 'grid-cell col-header' }, col));
  });
  table.appendChild(headerRow);

  // Data rows
  rows.forEach((rowText, rIdx) => {
    const fieldName = `${prefix}_${rIdx + 1}`;
    const dataRow = el('div', { class: 'grid-table-row', style: `grid-template-columns: minmax(180px, 2.5fr) repeat(${columns.length}, 1fr);` });
    dataRow.appendChild(el('div', { class: 'row-label' }, [
      el('span', { class: 'row-num' }, `${prefix}${rIdx + 1}`),
      el('span', {}, rowText)
    ]));
    columns.forEach((col, cIdx) => {
      const cellId = `${fieldName}_c${cIdx}`;
      const radio = el('input', {
        type: 'radio',
        id: cellId,
        name: fieldName,
        value: col,
        'data-required': required ? 'true' : null
      });
      const cell = el('label', { class: 'grid-cell', for: cellId, 'data-label': col }, radio);
      dataRow.appendChild(cell);
    });
    table.appendChild(dataRow);
  });

  wrapper.appendChild(table);
  return wrapper;
}

/**
 * Build a Top-N selection list with live counter.
 */
function buildSelectionList({ id, prefix, items, label, help, expectedCount }) {
  const wrapper = el('div', { class: 'field' });
  if (label) wrapper.appendChild(el('label', { class: 'field-label', html: `${label} <span class="req">*</span>` }));
  if (help) wrapper.appendChild(el('div', { class: 'help-text', style: 'margin-bottom: 0.75rem;' }, help));

  const list = el('div', { class: 'checklist', id });
  items.forEach((item, idx) => {
    const itemId = `${id}_${idx + 1}`;
    const checkbox = el('input', {
      type: 'checkbox',
      id: itemId,
      name: `${id}[]`,
      value: `${prefix}${idx + 1}`
    });
    const label = el('label', { class: 'checklist-item', for: itemId }, [
      checkbox,
      el('span', { class: 'item-num' }, `${prefix}${idx + 1}`),
      el('span', { class: 'item-label' }, item)
    ]);
    list.appendChild(label);
  });

  const counter = el('div', { class: 'selection-counter', id: `${id}_counter` }, `0 / ${expectedCount} selected`);

  list.addEventListener('change', () => {
    const checked = list.querySelectorAll('input:checked').length;
    counter.textContent = `${checked} / ${expectedCount} selected`;
    counter.className = 'selection-counter ' + (checked === expectedCount ? 'valid' : 'invalid');

    // Toggle item highlight
    list.querySelectorAll('.checklist-item').forEach(item => {
      const cb = item.querySelector('input');
      item.classList.toggle('selected', cb.checked);
    });

    // Optional: cap selections at expectedCount
    if (checked > expectedCount) {
      const lastChecked = Array.from(list.querySelectorAll('input:checked')).pop();
      // Don't auto-uncheck; just visually warn
    }
  });

  wrapper.appendChild(list);
  wrapper.appendChild(counter);
  return wrapper;
}

/**
 * Build a row of N rank dropdowns.
 */
function buildRankDropdowns({ id, prefix, options, count, label, help }) {
  const wrapper = el('div', { class: 'field' });
  if (label) wrapper.appendChild(el('label', { class: 'field-label', html: `${label} <span class="req">*</span>` }));
  if (help) wrapper.appendChild(el('div', { class: 'help-text', style: 'margin-bottom: 0.75rem;' }, help));

  for (let i = 1; i <= count; i++) {
    const fieldId = `${id}_rank${i}`;
    const select = el('select', {
      id: fieldId,
      name: fieldId,
      'data-rank-group': id,
      'data-required': 'true'
    });
    select.appendChild(el('option', { value: '' }, 'Select…'));
    options.forEach((opt, idx) => {
      select.appendChild(el('option', { value: `${prefix}${idx + 1}` }, `${prefix}${idx + 1}. ${opt}`));
    });

    const row = el('div', { class: 'rank-row' }, [
      el('div', { class: 'rank-badge' }, `#${i}`),
      select
    ]);
    wrapper.appendChild(row);
  }

  // Validate uniqueness on change
  wrapper.addEventListener('change', () => {
    const selects = wrapper.querySelectorAll('select');
    const values = Array.from(selects).map(s => s.value).filter(v => v);
    const dupes = values.filter((v, i) => values.indexOf(v) !== i);
    selects.forEach(s => {
      s.style.borderColor = (s.value && dupes.includes(s.value)) ? 'var(--danger)' : '';
    });
  });

  return wrapper;
}

/**
 * Build a rank dropdown WITH per-row explanation textarea.
 */
function buildRankWithExplanation({ id, prefix, options, count, label, help, includeCost = false }) {
  const wrapper = el('div', { class: 'field' });
  if (label) wrapper.appendChild(el('label', { class: 'field-label', html: `${label} <span class="req">*</span>` }));
  if (help) wrapper.appendChild(el('div', { class: 'help-text', style: 'margin-bottom: 0.75rem;' }, help));

  for (let i = 1; i <= count; i++) {
    const selectId = `${id}_rank${i}`;
    const explainId = `${id}_rank${i}_explain`;
    const costId = `${id}_rank${i}_cost`;

    const select = el('select', {
      id: selectId,
      name: selectId,
      'data-rank-group': id,
      'data-required': 'true'
    });
    select.appendChild(el('option', { value: '' }, 'Select…'));
    options.forEach((opt, idx) => {
      select.appendChild(el('option', { value: `${prefix}${idx + 1}` }, `${prefix}${idx + 1}. ${opt}`));
    });

    const block = el('div', { class: 'rank-row with-explanation', style: 'flex-direction: column; align-items: stretch; padding: 1rem;' });
    const topRow = el('div', { style: 'display: grid; grid-template-columns: 60px 1fr; gap: 1rem; align-items: center; width: 100%;' }, [
      el('div', { class: 'rank-badge' }, `#${i}`),
      select
    ]);
    block.appendChild(topRow);

    const textarea = el('textarea', {
      id: explainId,
      name: explainId,
      placeholder: 'Explanation…',
      'data-required': 'true',
      style: 'margin-top: 0.5rem;'
    });
    block.appendChild(textarea);

    if (includeCost) {
      const costInput = el('input', {
        type: 'text',
        id: costId,
        name: costId,
        placeholder: 'Estimated cost (₦)',
        style: 'margin-top: 0.5rem;'
      });
      block.appendChild(costInput);
    }

    wrapper.appendChild(block);
  }

  // Uniqueness validation
  wrapper.addEventListener('change', () => {
    const selects = wrapper.querySelectorAll('select');
    const values = Array.from(selects).map(s => s.value).filter(v => v);
    const dupes = values.filter((v, i) => values.indexOf(v) !== i);
    selects.forEach(s => {
      s.style.borderColor = (s.value && dupes.includes(s.value)) ? 'var(--danger)' : '';
    });
  });

  return wrapper;
}

/**
 * Build a list of optional explanation paragraphs (one per item).
 */
function buildExplanationsList({ id, prefix, items, label, help }) {
  const wrapper = el('div', { class: 'field' });
  if (label) wrapper.appendChild(el('label', { class: 'field-label' }, label));
  if (help) wrapper.appendChild(el('div', { class: 'help-text', style: 'margin-bottom: 0.75rem;' }, help));

  items.forEach((item, idx) => {
    const fieldId = `${id}_${idx + 1}`;
    const block = el('div', { style: 'margin-bottom: 1rem;' }, [
      el('div', { style: 'font-size: 0.85rem; color: var(--muted); margin-bottom: 0.3rem;' }, [
        el('span', { style: 'font-family: IBM Plex Mono, monospace; color: var(--accent);' }, `${prefix}${idx + 1}`),
        el('span', {}, ` — ${item}`)
      ]),
      el('textarea', {
        id: fieldId,
        name: fieldId,
        placeholder: 'Reason (leave blank if not applicable)',
        style: 'min-height: 60px;'
      })
    ]);
    wrapper.appendChild(block);
  });

  return wrapper;
}

// ============ COLLAPSIBLE SECTIONS ============
function makeSection({ id, eyebrow, title, body, startCollapsed = false }) {
  const section = el('section', { class: 'section' + (startCollapsed ? ' collapsed' : ''), id });
  const header = el('div', { class: 'section-header' }, [
    el('div', {}, [
      eyebrow ? el('div', { class: 'eyebrow' }, eyebrow) : null,
      el('h2', {}, title)
    ]),
    el('div', { class: 'section-toggle', html: '▾' })
  ]);
  header.addEventListener('click', () => section.classList.toggle('collapsed'));
  section.appendChild(header);

  const bodyWrap = el('div', { class: 'section-body' });
  if (Array.isArray(body)) body.forEach(b => bodyWrap.appendChild(b));
  else bodyWrap.appendChild(body);
  section.appendChild(bodyWrap);

  return section;
}

// ============ DATA COLLECTION ============
function collectFormData(formEl) {
  const data = {};
  const inputs = formEl.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const name = input.name || input.id;
    if (!name) return;

    if (input.type === 'checkbox') {
      if (name.endsWith('[]')) {
        const key = name.slice(0, -2);
        if (!data[key]) data[key] = [];
        if (input.checked) data[key].push(input.value);
      } else {
        data[name] = input.checked;
      }
    } else if (input.type === 'radio') {
      if (input.checked) data[name] = input.value;
      else if (!(name in data)) data[name] = '';
    } else {
      data[name] = input.value;
    }
  });
  return data;
}

// ============ VALIDATION ============
function validateForm(formEl) {
  const errors = [];
  const requiredInputs = formEl.querySelectorAll('[data-required="true"]');

  // Check standard required fields
  const radioGroupsChecked = new Set();
  requiredInputs.forEach(input => {
    if (input.type === 'radio') {
      const group = input.name;
      if (radioGroupsChecked.has(group)) return;
      radioGroupsChecked.add(group);
      const anyChecked = formEl.querySelectorAll(`input[name="${group}"]:checked`).length > 0;
      if (!anyChecked) {
        errors.push(`Missing required selection: ${group}`);
        // Highlight the row in any parent grid-table-row
        const gridRow = input.closest('.grid-table-row');
        if (gridRow) gridRow.style.background = 'rgba(168, 50, 50, 0.05)';
      }
    } else if (!input.value || input.value.trim() === '') {
      errors.push(`Missing required field: ${input.id || input.name}`);
      input.style.borderColor = 'var(--danger)';
    }
  });

  // Check rank uniqueness
  const rankGroups = new Set();
  formEl.querySelectorAll('[data-rank-group]').forEach(s => rankGroups.add(s.dataset.rankGroup));
  rankGroups.forEach(group => {
    const selects = formEl.querySelectorAll(`[data-rank-group="${group}"]`);
    const values = Array.from(selects).map(s => s.value).filter(v => v);
    const dupes = values.filter((v, i) => values.indexOf(v) !== i);
    if (dupes.length) {
      errors.push(`Duplicate rankings in ${group}: ${[...new Set(dupes)].join(', ')}`);
    }
  });

  return errors;
}

// ============ DRAFT SAVE / RESUME (localStorage) ============
function saveDraft(formId, formEl) {
  try {
    const data = collectFormData(formEl);
    localStorage.setItem(`draft_${formId}`, JSON.stringify({
      data,
      savedAt: new Date().toISOString()
    }));
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

function loadDraft(formId, formEl) {
  try {
    const raw = localStorage.getItem(`draft_${formId}`);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Checkbox group
        formEl.querySelectorAll(`input[name="${key}[]"]`).forEach(cb => {
          cb.checked = value.includes(cb.value);
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
      } else {
        const input = formEl.querySelector(`[name="${key}"], [id="${key}"]`);
        if (!input) return;
        if (input.type === 'radio') {
          const radio = formEl.querySelector(`[name="${key}"][value="${value}"]`);
          if (radio) radio.checked = true;
        } else {
          input.value = value;
        }
      }
    });
    return savedAt;
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

function clearDraft(formId) {
  localStorage.removeItem(`draft_${formId}`);
}

// ============ TOAST ============
function toast(msg, type = '') {
  const t = el('div', { class: `toast ${type}` }, msg);
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ============ SUBMIT ============
async function submitToBackend(formType, data) {
  if (APPS_SCRIPT_URL.startsWith('REPLACE')) {
    throw new Error('Apps Script URL not configured. Edit form-engine.js to add your URL.');
  }

  const payload = {
    formType,
    submittedAt: new Date().toISOString(),
    data
  };

  // Apps Script Web Apps require text/plain to avoid CORS preflight
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }

  return await response.json();
}

// ============ AUTOSAVE ============
function setupAutosave(formId, formEl, intervalMs = 15000) {
  setInterval(() => saveDraft(formId, formEl), intervalMs);
  formEl.addEventListener('change', () => saveDraft(formId, formEl));
}

// ============ PROGRESS TRACKING ============
function updateProgress(formEl) {
  const requiredInputs = Array.from(formEl.querySelectorAll('[data-required="true"]'));
  const radioGroups = new Set();
  let total = 0;
  let filled = 0;

  requiredInputs.forEach(input => {
    if (input.type === 'radio') {
      if (radioGroups.has(input.name)) return;
      radioGroups.add(input.name);
      total++;
      if (formEl.querySelectorAll(`input[name="${input.name}"]:checked`).length > 0) filled++;
    } else {
      total++;
      if (input.value && input.value.trim()) filled++;
    }
  });

  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  const bar = $('.progress-fill');
  const label = $('.progress-label');
  if (bar) bar.style.width = `${pct}%`;
  if (label) label.textContent = `${pct}% complete · ${filled}/${total} required fields`;
}

// Public API attached to window
window.FormEngine = {
  el, $, $$,
  buildTextField, buildTextarea, buildDateField, buildSelect,
  buildScoringGrid, buildSelectionList, buildRankDropdowns,
  buildRankWithExplanation, buildExplanationsList,
  makeSection,
  collectFormData, validateForm,
  saveDraft, loadDraft, clearDraft,
  toast, submitToBackend, setupAutosave, updateProgress
};