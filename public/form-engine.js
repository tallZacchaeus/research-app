/* ============================================================
   FORM ENGINE v2 — Shared helpers for all forms
   ============================================================ */

const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwG03QCJ5A_dBDjqhH_NgKJhv9ojGSX9lJ4yD-GUoxdrHUexHgGD28n3Zl2NN0S7EfH/exec';

/* ============ DOM HELPERS ============ */
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

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'sub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

/* ============ FIELD BUILDERS ============ */
function buildTextField({
  id, label, required = false, placeholder = '', help = '',
  type = 'text', inputmode, min, max, prefix
}) {
  const inputAttrs = { type, id, name: id, placeholder };
  if (required) { inputAttrs.required = ''; inputAttrs['data-required'] = 'true'; }
  if (inputmode) inputAttrs.inputmode = inputmode;
  if (min !== undefined && min !== null) inputAttrs.min = min;
  if (max !== undefined && max !== null) inputAttrs.max = max;

  const input = el('input', inputAttrs);
  const inputNode = prefix
    ? el('div', { class: 'input-with-prefix' }, [
        el('span', { class: 'input-prefix' }, prefix),
        input
      ])
    : input;

  return el('div', { class: 'field' }, [
    el('label', { class: 'field-label', for: id, html: `${label}${required ? ' <span class="req">*</span>' : ''}` }),
    inputNode,
    help ? el('div', { class: 'help-text' }, help) : null,
    el('div', { class: 'field-error', id: `${id}_err`, 'aria-live': 'polite' })
  ]);
}

function buildTextarea({ id, label, required = false, placeholder = '', help = '', minHeight = 90 }) {
  const ta = el('textarea', {
    id, name: id, placeholder,
    required: required ? '' : null,
    'data-required': required ? 'true' : null,
    style: `min-height: ${minHeight}px`
  });
  return el('div', { class: 'field' }, [
    el('label', { class: 'field-label', for: id, html: `${label}${required ? ' <span class="req">*</span>' : ''}` }),
    ta,
    help ? el('div', { class: 'help-text' }, help) : null,
    el('div', { class: 'field-error', id: `${id}_err`, 'aria-live': 'polite' })
  ]);
}

function buildDateField({ id, label, required = false, max = todayISO() }) {
  const attrs = { type: 'date', id, name: id };
  if (required) { attrs.required = ''; attrs['data-required'] = 'true'; }
  if (max) attrs.max = max;
  return el('div', { class: 'field' }, [
    el('label', { class: 'field-label', for: id, html: `${label}${required ? ' <span class="req">*</span>' : ''}` }),
    el('input', attrs),
    el('div', { class: 'field-error', id: `${id}_err`, 'aria-live': 'polite' })
  ]);
}

function buildSelect({ id, label, options, required = false, help = '', placeholder = 'Select…' }) {
  const select = el('select', {
    id, name: id,
    required: required ? '' : null,
    'data-required': required ? 'true' : null
  });
  select.appendChild(el('option', { value: '' }, placeholder));
  options.forEach(opt => {
    const value = typeof opt === 'string' ? opt : opt.value;
    const text = typeof opt === 'string' ? opt : opt.label;
    select.appendChild(el('option', { value }, text));
  });
  return el('div', { class: 'field' }, [
    el('label', { class: 'field-label', for: id, html: `${label}${required ? ' <span class="req">*</span>' : ''}` }),
    select,
    help ? el('div', { class: 'help-text' }, help) : null,
    el('div', { class: 'field-error', id: `${id}_err`, 'aria-live': 'polite' })
  ]);
}

/* ============ SCORING GRID ============ */
function buildScoringGrid({ id, prefix, rows, columns, label, help = '', required = true }) {
  const wrapper = el('div', { class: 'field' });
  if (label) wrapper.appendChild(el('label', { class: 'field-label', html: `${label}${required ? ' <span class="req">*</span>' : ''}` }));
  if (help) wrapper.appendChild(el('div', { class: 'help-text', style: 'margin-bottom: 0.75rem;' }, help));

  const table = el('div', { class: 'grid-table', id, role: 'group' });

  const headerRow = el('div', {
    class: 'grid-table-row header',
    style: `grid-template-columns: minmax(180px, 2.5fr) repeat(${columns.length}, 1fr);`
  });
  headerRow.appendChild(el('div', { class: 'row-label' }, 'Item'));
  columns.forEach(col => headerRow.appendChild(el('div', { class: 'grid-cell col-header' }, col)));
  table.appendChild(headerRow);

  rows.forEach((rowText, rIdx) => {
    const fieldName = `${prefix}_${rIdx + 1}`;
    const dataRow = el('div', {
      class: 'grid-table-row',
      'data-row': fieldName,
      style: `grid-template-columns: minmax(180px, 2.5fr) repeat(${columns.length}, 1fr);`
    });
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
        'data-required': required ? 'true' : null,
        'aria-label': `${rowText} — ${col}`
      });
      const cell = el('label', { class: 'grid-cell', for: cellId, 'data-label': col }, [
        radio,
        el('span', { class: 'mobile-col-label' }, col)
      ]);
      dataRow.appendChild(cell);
    });
    table.appendChild(dataRow);
  });

  wrapper.appendChild(table);
  return wrapper;
}

/* ============ TOP-N SELECTION (with optional search + hard cap) ============ */
function buildSelectionList({ id, prefix, items, label, help, expectedCount, withSearch = true, hardCap = true }) {
  const wrapper = el('div', { class: 'field', 'data-selection-list': id });
  if (label) wrapper.appendChild(el('label', { class: 'field-label', html: `${label} <span class="req">*</span>` }));
  if (help) wrapper.appendChild(el('div', { class: 'help-text', style: 'margin-bottom: 0.75rem;' }, help));

  if (withSearch) {
    const searchInput = el('input', {
      type: 'search',
      class: 'list-search',
      placeholder: `Search ${items.length} options…`,
      'aria-label': `Filter ${label || 'options'}`
    });
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      list.querySelectorAll('.checklist-item').forEach(it => {
        const text = (it.querySelector('.item-label')?.textContent || '').toLowerCase();
        const num = (it.querySelector('.item-num')?.textContent || '').toLowerCase();
        const match = !q || text.includes(q) || num.includes(q);
        it.style.display = match ? '' : 'none';
      });
    });
    wrapper.appendChild(searchInput);
  }

  const list = el('div', { class: 'checklist', id });
  items.forEach((item, idx) => {
    const itemId = `${id}_${idx + 1}`;
    const checkbox = el('input', {
      type: 'checkbox',
      id: itemId,
      name: `${id}[]`,
      value: `${prefix}${idx + 1}`
    });
    const labelEl = el('label', { class: 'checklist-item', for: itemId }, [
      checkbox,
      el('span', { class: 'item-num' }, `${prefix}${idx + 1}`),
      el('span', { class: 'item-label' }, item)
    ]);
    list.appendChild(labelEl);
  });

  const counter = el('div', {
    class: 'selection-counter',
    id: `${id}_counter`,
    'aria-live': 'polite'
  }, `0 of ${expectedCount} selected`);

  function refreshCounter() {
    const checked = list.querySelectorAll('input:checked').length;
    counter.textContent = `${checked} of ${expectedCount} selected`;
    counter.className = 'selection-counter ' +
      (checked === expectedCount ? 'valid' : checked > expectedCount ? 'invalid' : 'pending');

    list.querySelectorAll('.checklist-item').forEach(it => {
      const cb = it.querySelector('input');
      it.classList.toggle('selected', cb.checked);
      if (hardCap) {
        const atCap = checked >= expectedCount;
        if (!cb.checked && atCap) {
          cb.disabled = true;
          it.classList.add('disabled');
          it.setAttribute('title', `Maximum ${expectedCount} reached. Uncheck one to choose another.`);
        } else {
          cb.disabled = false;
          it.classList.remove('disabled');
          it.removeAttribute('title');
        }
      }
    });

    // Notify any linked rank groups
    wrapper.dispatchEvent(new CustomEvent('selectionchange', {
      bubbles: true,
      detail: { id, selected: getSelectedItems() }
    }));
  }

  function getSelectedItems() {
    return Array.from(list.querySelectorAll('input:checked')).map(cb => ({
      value: cb.value,
      label: items[parseInt(cb.value.replace(prefix, ''), 10) - 1]
    }));
  }

  list.addEventListener('change', refreshCounter);
  // Expose a method for re-sync after draft load
  wrapper._refresh = refreshCounter;

  wrapper.appendChild(list);
  wrapper.appendChild(counter);
  return wrapper;
}

/* ============ RANK DROPDOWNS (full list) ============ */
function buildRankDropdowns({ id, prefix, options, count, label, help, dependsOn = null }) {
  return _buildRankDropdownsCore({ id, prefix, options, count, label, help, dependsOn, withExplanation: false });
}

/* ============ RANK + EXPLANATION ============ */
function buildRankWithExplanation({ id, prefix, options, count, label, help, includeCost = false, dependsOn = null }) {
  return _buildRankDropdownsCore({ id, prefix, options, count, label, help, dependsOn, withExplanation: true, includeCost });
}

function _buildRankDropdownsCore({ id, prefix, options, count, label, help, dependsOn, withExplanation, includeCost = false }) {
  const wrapper = el('div', { class: 'field', 'data-rank-block': id });
  if (label) wrapper.appendChild(el('label', { class: 'field-label', html: `${label} <span class="req">*</span>` }));
  if (help) wrapper.appendChild(el('div', { class: 'help-text', style: 'margin-bottom: 0.75rem;' }, help));

  if (dependsOn) {
    wrapper.appendChild(el('div', {
      class: 'banner info',
      style: 'margin-bottom: 1rem; font-size: 0.85rem;'
    }, [
      el('span', {}, '↑'),
      el('div', { style: 'flex: 1;' }, `Choose from the ${count} items you selected above. Update Step 1 if you want different items here.`)
    ]));
  }

  const selectsBlock = el('div', { class: 'rank-list' });
  for (let i = 1; i <= count; i++) {
    const selectId = `${id}_rank${i}`;
    const explainId = `${id}_rank${i}_explain`;
    const costId = `${id}_rank${i}_cost`;

    const select = el('select', {
      id: selectId,
      name: selectId,
      'data-rank-group': id,
      'data-required': 'true',
      'aria-label': `Rank ${i}`
    });
    select.appendChild(el('option', { value: '' }, 'Select…'));
    if (!dependsOn) {
      // Pre-populate with full list
      options.forEach((opt, idx) => {
        select.appendChild(el('option', { value: `${prefix}${idx + 1}` }, `${prefix}${idx + 1}. ${opt}`));
      });
    }

    const block = withExplanation
      ? el('div', { class: 'rank-row with-explanation', style: 'flex-direction: column; align-items: stretch; padding: 1rem;' })
      : el('div', { class: 'rank-row' });

    if (withExplanation) {
      const topRow = el('div', { style: 'display: grid; grid-template-columns: 60px 1fr; gap: 1rem; align-items: center; width: 100%;' }, [
        el('div', { class: 'rank-badge' }, `#${i}`),
        select
      ]);
      block.appendChild(topRow);
      block.appendChild(el('textarea', {
        id: explainId,
        name: explainId,
        placeholder: 'Why is this critical? How does it manifest?',
        'data-required': 'true',
        style: 'margin-top: 0.5rem;'
      }));
      if (includeCost) {
        block.appendChild(el('div', { class: 'input-with-prefix', style: 'margin-top: 0.5rem;' }, [
          el('span', { class: 'input-prefix' }, '₦'),
          el('input', {
            type: 'text',
            inputmode: 'numeric',
            id: costId,
            name: costId,
            placeholder: 'Estimated cost'
          })
        ]));
      }
    } else {
      block.appendChild(el('div', { class: 'rank-badge' }, `#${i}`));
      block.appendChild(select);
    }
    selectsBlock.appendChild(block);
  }
  wrapper.appendChild(selectsBlock);

  // === Wire dependsOn → repopulate from selection list ===
  function repopulate(selectedItems) {
    const selects = wrapper.querySelectorAll('select');
    selects.forEach(s => {
      const current = s.value;
      const stillValid = selectedItems.some(it => it.value === current);
      // Wipe & rebuild
      s.innerHTML = '';
      s.appendChild(el('option', { value: '' }, selectedItems.length ? 'Select…' : '(Pick items in Step 1 first)'));
      selectedItems.forEach(it => {
        s.appendChild(el('option', { value: it.value }, `${it.value}. ${it.label}`));
      });
      if (stillValid) s.value = current;
    });
    refreshUniqueness();
  }

  function refreshUniqueness() {
    const selects = wrapper.querySelectorAll('select');
    const values = Array.from(selects).map(s => s.value).filter(Boolean);
    const dupes = values.filter((v, i) => values.indexOf(v) !== i);
    selects.forEach(s => {
      s.classList.toggle('has-error', !!s.value && dupes.includes(s.value));
    });
  }

  wrapper.addEventListener('change', refreshUniqueness);
  wrapper._repopulate = repopulate;

  if (dependsOn) {
    // Attach handler later via wireDependencies()
    wrapper.dataset.dependsOn = dependsOn;
  }

  return wrapper;
}

/* ============ TOP-N AUTO-LABELLED EXPLANATIONS ============ */
/* Renders N textareas whose labels follow which item the user ranked at that position. */
function buildTopNExplanations({ id, dependsOnRank, count, label, help, required = true, minHeight = 100 }) {
  const wrapper = el('div', { class: 'field', 'data-topn-explanations': id });
  if (label) wrapper.appendChild(el('label', { class: 'field-label', html: `${label}${required ? ' <span class="req">*</span>' : ''}` }));
  if (help) wrapper.appendChild(el('div', { class: 'help-text', style: 'margin-bottom: 0.75rem;' }, help));

  for (let i = 1; i <= count; i++) {
    const fid = `${id}_${i}_explain`;
    const block = el('div', { class: 'topn-block', 'data-topn-index': i }, [
      el('div', { class: 'topn-label' }, [
        el('span', { class: 'topn-rank' }, `Top ${i}`),
        el('span', { class: 'topn-item', 'data-topn-item': i }, '— pick a #' + i + ' rank above')
      ]),
      el('textarea', {
        id: fid,
        name: fid,
        placeholder: `Detailed explanation for your #${i} ranked item`,
        'data-required': required ? 'true' : null,
        style: `min-height: ${minHeight}px;`
      }),
      el('div', { class: 'field-error', id: `${fid}_err`, 'aria-live': 'polite' })
    ]);
    wrapper.appendChild(block);
  }

  wrapper.dataset.dependsOnRank = dependsOnRank;
  return wrapper;
}

/* ============ EXPLANATIONS LIST ============ */
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
        id: fieldId, name: fieldId,
        placeholder: 'Reason (leave blank if not applicable)',
        style: 'min-height: 60px;'
      })
    ]);
    wrapper.appendChild(block);
  });
  return wrapper;
}

/* ============ COLLAPSIBLE SECTION ============ */
function makeSection({ id, eyebrow, title, body, startCollapsed = false, eta = null }) {
  const section = el('section', {
    class: 'section' + (startCollapsed ? ' collapsed' : ''),
    id,
    'data-section': id
  });
  const header = el('div', { class: 'section-header', tabindex: '0', role: 'button', 'aria-expanded': startCollapsed ? 'false' : 'true' }, [
    el('div', { style: 'flex: 1;' }, [
      eyebrow ? el('div', { class: 'eyebrow' }, eyebrow) : null,
      el('h2', {}, title),
      eta ? el('div', { class: 'section-eta' }, `~ ${eta}`) : null
    ]),
    el('div', { class: 'section-meta' }, [
      el('span', { class: 'section-progress-pill', 'data-section-pill': id }, ''),
      el('div', { class: 'section-toggle', html: '▾' })
    ])
  ]);
  const toggle = () => {
    section.classList.toggle('collapsed');
    header.setAttribute('aria-expanded', section.classList.contains('collapsed') ? 'false' : 'true');
  };
  header.addEventListener('click', toggle);
  header.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
  section.appendChild(header);

  const bodyWrap = el('div', { class: 'section-body' });
  if (Array.isArray(body)) body.forEach(b => b && bodyWrap.appendChild(b));
  else if (body) bodyWrap.appendChild(body);
  section.appendChild(bodyWrap);

  return section;
}

function expandSection(section) {
  if (!section) return;
  section.classList.remove('collapsed');
  const hdr = section.querySelector('.section-header');
  if (hdr) hdr.setAttribute('aria-expanded', 'true');
}

/* ============ DATA COLLECTION ============ */
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

/* ============ VALIDATION ============ */
function clearErrors(formEl) {
  formEl.querySelectorAll('.has-error').forEach(n => n.classList.remove('has-error'));
  formEl.querySelectorAll('.field-error').forEach(n => { n.textContent = ''; });
  formEl.querySelectorAll('.grid-table-row.has-error-row').forEach(r => r.classList.remove('has-error-row'));
  const banner = formEl.querySelector('.form-error-banner');
  if (banner) banner.remove();
}

function validateForm(formEl) {
  clearErrors(formEl);
  const errors = [];
  const requiredInputs = formEl.querySelectorAll('[data-required="true"]');
  const radioGroupsChecked = new Set();

  requiredInputs.forEach(input => {
    if (input.type === 'radio') {
      const group = input.name;
      if (radioGroupsChecked.has(group)) return;
      radioGroupsChecked.add(group);
      const anyChecked = formEl.querySelectorAll(`input[name="${group}"]:checked`).length > 0;
      if (!anyChecked) {
        const row = input.closest('.grid-table-row');
        if (row) row.classList.add('has-error-row');
        const block = input.closest('.field') || row;
        if (block) block.classList.add('has-error');
        const labelText = row ? row.querySelector('.row-label')?.textContent?.trim() : group;
        errors.push({ field: group, label: labelText || group, node: row || input });
      }
    } else if (!input.value || input.value.trim() === '') {
      input.classList.add('has-error');
      const errSlot = formEl.querySelector(`#${CSS.escape(input.id)}_err`);
      if (errSlot) errSlot.textContent = 'Required.';
      const labelEl = formEl.querySelector(`label[for="${CSS.escape(input.id)}"]`);
      const labelText = labelEl ? labelEl.textContent.replace('*', '').trim() : (input.name || input.id);
      errors.push({ field: input.id, label: labelText, node: input });
    }
  });

  // Selection-list expectedCount enforcement
  formEl.querySelectorAll('[data-selection-list]').forEach(block => {
    const counter = block.querySelector('.selection-counter');
    if (!counter) return;
    if (counter.classList.contains('invalid') || counter.classList.contains('pending')) {
      block.classList.add('has-error');
      errors.push({ field: block.dataset.selectionList, label: counter.textContent, node: block });
    }
  });

  // Rank uniqueness
  const rankGroups = new Set();
  formEl.querySelectorAll('[data-rank-group]').forEach(s => rankGroups.add(s.dataset.rankGroup));
  rankGroups.forEach(group => {
    const selects = formEl.querySelectorAll(`[data-rank-group="${group}"]`);
    const values = Array.from(selects).map(s => s.value).filter(Boolean);
    const dupes = values.filter((v, i) => values.indexOf(v) !== i);
    if (dupes.length) {
      const dupSet = new Set(dupes);
      selects.forEach(s => {
        if (dupSet.has(s.value)) s.classList.add('has-error');
      });
      errors.push({ field: group, label: `Duplicate ranks in ${group}: ${[...dupSet].join(', ')}`, node: selects[0] });
    }
  });

  // Auto-expand sections containing errors and inject banner
  if (errors.length) {
    const sectionsWithErrors = new Set();
    errors.forEach(e => {
      const section = e.node.closest && e.node.closest('.section');
      if (section) {
        expandSection(section);
        sectionsWithErrors.add(section);
      }
    });
    injectErrorBanner(formEl, errors);
  }

  return errors;
}

function injectErrorBanner(formEl, errors) {
  const items = errors.slice(0, 5).map(e => {
    const node = e.node;
    const target = node.id || (node.querySelector && node.querySelector('input, select')?.id);
    const link = el('a', {
      href: '#',
      onClick: (ev) => {
        ev.preventDefault();
        const dest = formEl.querySelector(`#${CSS.escape(target || '')}`) || node;
        const section = dest.closest && dest.closest('.section');
        if (section) expandSection(section);
        dest.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable = dest.matches('input, select, textarea') ? dest : dest.querySelector('input, select, textarea');
        if (focusable && focusable.focus) setTimeout(() => focusable.focus(), 350);
      }
    }, e.label || e.field);
    return el('li', {}, link);
  });
  if (errors.length > 5) {
    items.push(el('li', { class: 'more' }, `…and ${errors.length - 5} more.`));
  }
  const banner = el('div', { class: 'form-error-banner banner warn', role: 'alert' }, [
    el('span', {}, '⚠'),
    el('div', { style: 'flex: 1;' }, [
      el('strong', {}, `${errors.length} field${errors.length === 1 ? '' : 's'} need${errors.length === 1 ? 's' : ''} attention`),
      el('ul', { class: 'error-list' }, items)
    ])
  ]);
  formEl.insertBefore(banner, formEl.firstChild);
}

/* ============ DRAFT SAVE / LOAD ============ */
function saveDraft(formId, formEl) {
  try {
    const data = collectFormData(formEl);
    localStorage.setItem(`draft_${formId}`, JSON.stringify({
      data, savedAt: new Date().toISOString()
    }));
    document.dispatchEvent(new CustomEvent('draftsaved', { detail: { formId, savedAt: new Date() } }));
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

    // Pass 1: checkboxes, radios, text inputs/textareas (selects deferred)
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formEl.querySelectorAll(`input[name="${key}[]"]`).forEach(cb => {
          cb.checked = value.includes(cb.value);
        });
        return;
      }
      const input = formEl.querySelector(`[name="${CSS.escape(key)}"], [id="${CSS.escape(key)}"]`);
      if (!input) return;
      if (input.type === 'radio') {
        const radio = formEl.querySelector(`[name="${CSS.escape(key)}"][value="${CSS.escape(value)}"]`);
        if (radio) radio.checked = true;
      } else if (input.tagName !== 'SELECT') {
        input.value = value;
      }
    });

    // Refresh selection lists → repopulates linked rank dropdowns' options
    formEl.querySelectorAll('[data-selection-list]').forEach(block => {
      if (block._refresh) block._refresh();
    });

    // Pass 2: now set <select> values (options are populated)
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) return;
      const input = formEl.querySelector(`[name="${CSS.escape(key)}"], [id="${CSS.escape(key)}"]`);
      if (!input || input.tagName !== 'SELECT') return;
      input.value = value;
    });

    // Pass 3: refresh rank dependents (top-N labels) once selects are populated
    formEl.querySelectorAll('[data-rank-block]').forEach(rankBlock => {
      rankBlock.dispatchEvent(new Event('change', { bubbles: true }));
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

/* ============ TOAST ============ */
function toast(msg, type = '') {
  const t = el('div', { class: `toast ${type}`, role: 'status' }, msg);
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

/* ============ SUBMIT WITH RETRY + IDEMPOTENCY ============ */
async function submitToBackend(formType, data, { retries = 2, submissionId = null } = {}) {
  if (APPS_SCRIPT_URL.startsWith('REPLACE')) {
    throw new Error('Backend URL not configured.');
  }
  const sid = submissionId || data.submissionId || uuid();
  data.submissionId = sid;

  const payload = {
    formType, submissionId: sid,
    submittedAt: new Date().toISOString(),
    data
  };

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const result = await response.json();
      if (result && result.ok === false) throw new Error(result.error || 'Server reported failure');
      return result;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 800 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastErr;
}

/* ============ AUTOSAVE ============ */
function setupAutosave(formId, formEl, intervalMs = 15000) {
  setInterval(() => saveDraft(formId, formEl), intervalMs);
  formEl.addEventListener('change', () => saveDraft(formId, formEl));
}

/* ============ AUTOSAVE INDICATOR ============ */
function setupSaveIndicator(formId, formEl, hostSelector = '.progress-label') {
  const host = document.querySelector(hostSelector);
  if (!host) return;
  const dot = el('span', { class: 'save-indicator', 'aria-live': 'polite' }, 'Not saved yet');
  host.appendChild(dot);

  let lastSaved = null;
  function render() {
    if (!lastSaved) { dot.textContent = '· Not saved yet'; return; }
    const secs = Math.round((Date.now() - lastSaved) / 1000);
    if (secs < 5) dot.textContent = '· Saved just now';
    else if (secs < 60) dot.textContent = `· Saved ${secs}s ago`;
    else if (secs < 3600) dot.textContent = `· Saved ${Math.round(secs / 60)} min ago`;
    else dot.textContent = `· Saved ${Math.round(secs / 3600)} h ago`;
  }
  document.addEventListener('draftsaved', (e) => {
    if (e.detail.formId === formId) { lastSaved = Date.now(); render(); }
  });
  // Initial state from existing draft
  try {
    const raw = localStorage.getItem(`draft_${formId}`);
    if (raw) { lastSaved = Date.parse(JSON.parse(raw).savedAt) || Date.now(); render(); }
  } catch {}
  setInterval(render, 15000);
}

/* ============ PROGRESS TRACKING ============ */
function updateProgress(formEl) {
  const requiredInputs = Array.from(formEl.querySelectorAll('[data-required="true"]'));
  const radioGroups = new Set();
  let total = 0, filled = 0;

  requiredInputs.forEach(input => {
    if (input.type === 'radio') {
      if (radioGroups.has(input.name)) return;
      radioGroups.add(input.name);
      total++;
      if (formEl.querySelectorAll(`input[name="${CSS.escape(input.name)}"]:checked`).length > 0) filled++;
    } else {
      total++;
      if (input.value && input.value.trim()) filled++;
    }
  });

  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  const bar = $('.progress-fill');
  const label = $('.progress-text');
  if (bar) bar.style.width = `${pct}%`;
  if (label) label.textContent = `${pct}% complete · ${filled}/${total} required fields`;

  updateSectionProgress(formEl);
  updateNavProgress(formEl);
}

function updateSectionProgress(formEl) {
  formEl.querySelectorAll('.section').forEach(section => {
    const id = section.dataset.section;
    if (!id) return;
    const required = Array.from(section.querySelectorAll('[data-required="true"]'));
    const radioGroups = new Set();
    let total = 0, filled = 0;
    required.forEach(input => {
      if (input.type === 'radio') {
        if (radioGroups.has(input.name)) return;
        radioGroups.add(input.name);
        total++;
        if (section.querySelectorAll(`input[name="${CSS.escape(input.name)}"]:checked`).length > 0) filled++;
      } else {
        total++;
        if (input.value && input.value.trim()) filled++;
      }
    });
    const pill = section.querySelector(`[data-section-pill="${id}"]`);
    if (pill) {
      if (total === 0) {
        pill.textContent = '';
        pill.className = 'section-progress-pill';
      } else if (filled === total) {
        pill.textContent = `✓ ${filled}/${total}`;
        pill.className = 'section-progress-pill complete';
      } else if (filled === 0) {
        pill.textContent = `0/${total}`;
        pill.className = 'section-progress-pill';
      } else {
        pill.textContent = `${filled}/${total}`;
        pill.className = 'section-progress-pill partial';
      }
    }
  });
}

/* ============ SECTION NAVIGATOR ============ */
function setupSectionNav(formEl, hostId = 'section-nav') {
  const host = document.getElementById(hostId);
  if (!host) return;
  host.innerHTML = '';
  const sections = formEl.querySelectorAll('.section[data-section]');
  sections.forEach(section => {
    const id = section.dataset.section;
    const titleEl = section.querySelector('h2');
    const eyebrowEl = section.querySelector('.eyebrow');
    const link = el('a', {
      href: `#${id}`,
      class: 'section-nav-link',
      'data-nav-for': id,
      onClick: (e) => {
        e.preventDefault();
        expandSection(section);
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${id}`);
      }
    }, [
      el('span', { class: 'section-nav-marker', 'data-nav-marker': id }, '○'),
      el('span', { class: 'section-nav-text' }, [
        eyebrowEl ? el('span', { class: 'section-nav-eyebrow' }, eyebrowEl.textContent) : null,
        el('span', { class: 'section-nav-title' }, titleEl ? titleEl.textContent : id)
      ].filter(Boolean))
    ]);
    host.appendChild(link);
  });
}

function updateNavProgress(formEl) {
  formEl.querySelectorAll('.section[data-section]').forEach(section => {
    const id = section.dataset.section;
    const pill = section.querySelector(`[data-section-pill="${id}"]`);
    const marker = document.querySelector(`[data-nav-marker="${id}"]`);
    const link = document.querySelector(`[data-nav-for="${id}"]`);
    if (!marker) return;
    if (pill && pill.classList.contains('complete')) {
      marker.textContent = '●';
      link.classList.add('complete');
      link.classList.remove('partial');
    } else if (pill && pill.classList.contains('partial')) {
      marker.textContent = '◐';
      link.classList.add('partial');
      link.classList.remove('complete');
    } else {
      marker.textContent = '○';
      link.classList.remove('complete', 'partial');
    }
  });
}

/* ============ CONTINUE BETWEEN SECTIONS ============ */
function addSectionContinueButtons(formEl) {
  const sections = Array.from(formEl.querySelectorAll('.section[data-section]'));
  sections.forEach((section, idx) => {
    if (idx === sections.length - 1) return;
    const next = sections[idx + 1];
    const body = section.querySelector('.section-body');
    if (!body) return;
    if (body.querySelector('.section-continue')) return;
    const btn = el('button', {
      type: 'button',
      class: 'btn btn-secondary section-continue',
      onClick: () => {
        // Validate this section's required fields softly
        section.classList.add('collapsed');
        section.querySelector('.section-header')?.setAttribute('aria-expanded', 'false');
        expandSection(next);
        next.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 'Save & continue →');
    body.appendChild(el('div', { class: 'section-continue-wrap' }, btn));
  });
}

/* ============ WIRE DEPENDENCIES (selection → rank → top-N labels) ============ */
function wireDependencies(formEl) {
  // Selection list → linked rank dropdowns
  formEl.querySelectorAll('[data-rank-block]').forEach(rankBlock => {
    const dep = rankBlock.dataset.dependsOn;
    if (!dep) return;
    const sourceBlock = formEl.querySelector(`[data-selection-list="${dep}"]`);
    if (!sourceBlock) return;
    const apply = () => {
      const checked = Array.from(sourceBlock.querySelectorAll('input:checked')).map(cb => {
        const lbl = cb.closest('.checklist-item').querySelector('.item-label')?.textContent || '';
        return { value: cb.value, label: lbl };
      });
      if (rankBlock._repopulate) rankBlock._repopulate(checked);
    };
    sourceBlock.addEventListener('selectionchange', apply);
    apply();
  });

  // Rank dropdowns → top-N explanation labels
  formEl.querySelectorAll('[data-topn-explanations]').forEach(block => {
    const rankId = block.dataset.dependsOnRank;
    if (!rankId) return;
    const rankBlock = formEl.querySelector(`[data-rank-block="${rankId}"]`);
    if (!rankBlock) return;
    const apply = () => {
      const selects = rankBlock.querySelectorAll('select');
      selects.forEach((s, idx) => {
        const slot = block.querySelector(`[data-topn-item="${idx + 1}"]`);
        if (!slot) return;
        const opt = s.options[s.selectedIndex];
        if (s.value && opt) {
          slot.textContent = `— ${opt.textContent.replace(/^[A-Z]+\d+\.\s*/, '')}`;
          slot.classList.add('has-pick');
        } else {
          slot.textContent = `— pick a #${idx + 1} rank above`;
          slot.classList.remove('has-pick');
        }
      });
    };
    rankBlock.addEventListener('change', apply);
    apply();
  });
}

/* ============ GPS HELPERS ============ */
function isValidLat(v) { const n = parseFloat(v); return !isNaN(n) && n >= -90 && n <= 90; }
function isValidLng(v) { const n = parseFloat(v); return !isNaN(n) && n >= -180 && n <= 180; }

/* ============ PUBLIC API ============ */
window.FormEngine = {
  el, $, $$, uuid, todayISO,
  buildTextField, buildTextarea, buildDateField, buildSelect,
  buildScoringGrid, buildSelectionList, buildRankDropdowns,
  buildRankWithExplanation, buildExplanationsList, buildTopNExplanations,
  makeSection, expandSection,
  collectFormData, validateForm, clearErrors,
  saveDraft, loadDraft, clearDraft,
  toast, submitToBackend,
  setupAutosave, setupSaveIndicator, updateProgress,
  setupSectionNav, addSectionContinueButtons, wireDependencies,
  isValidLat, isValidLng
};
