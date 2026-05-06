# Update v2 — Adding the Questionnaire (Form 3)

## What's New

A third instrument has been added: **Anonymous Perceptual Survey Questionnaire** (108 items).

- Section A — Demographics (12 items)
- Section B — Security Challenges (18 items, 1–5 frequency)
- Section C — Barriers (18 items, 1–5 hindrance)
- Section D — Adoption of Measures (18 items, 0/1/2)
- Section E — Satisfaction (34 items, 1–5 agreement)
- 6 open-ended response fields
- **Consent gate** — survey only proceeds if respondent agrees

The questionnaire is fully anonymous (no email collection) and writes to a new `Questionnaire_Responses` tab in your Sheet.

---

## What Changed in the Codebase

### Files updated (replace these)
- `public/index.html` — Now shows 3 cards instead of 2
- `public/data.js` — Added 4 new arrays for questionnaire content
- `public/styles.css` — Added 3-column grid variant for the landing page
- `api/AppsScript_Backend.gs` — Added `writeQuestionnaireRow()` and `getQuestionnaireHeaders()`

### Files added (new)
- `public/questionnaire.html` — The new survey form

### Files unchanged
- `public/clergy.html` ✅
- `public/checklist.html` ✅
- `public/form-engine.js` ✅ (engine handles the new form automatically)

---

## How to Deploy the Update (~5 minutes)

### Step 1: Update the Apps Script Backend
1. Open your existing Apps Script project (the one tied to your Google Sheet)
2. Replace the entire script with the new `api/AppsScript_Backend.gs` contents
3. **Save** (💾)
4. Run **`setupSheets`** once — this creates the new `Questionnaire_Responses` tab without touching existing data
5. Re-deploy:
   - **Deploy → Manage deployments**
   - Click the pencil ✏ next to your existing deployment
   - Version → **New version**
   - Description: "v2 — added questionnaire"
   - Click **Deploy**
   - **Important:** the URL stays the same! No need to update `form-engine.js`.

### Step 2: Update the Frontend on Vercel
The five files that changed need to replace their counterparts:
- `index.html`
- `data.js`
- `styles.css`
- `questionnaire.html` (new file)

#### If you used GitHub:
1. Replace the files in your repo
2. Commit and push
3. Vercel auto-deploys

#### If you used drag-and-drop:
1. Go to your Vercel project dashboard
2. Click the latest deployment → **Redeploy**
3. Or simply drag the updated `public` folder onto Vercel again
4. Vercel creates a new deployment with the updated files

### Step 3: Test the Questionnaire
1. Open `https://your-project.vercel.app/questionnaire.html`
2. Fill the consent (select Yes)
3. Fill some demographics + a few items in each section
4. Submit
5. Confirm a new row appears in the `Questionnaire_Responses` tab

---

## Sheet Structure Recap (After Update)

Your single Google Sheet now has **three tabs**:

| Tab Name | Source Form | Columns |
|---|---|---|
| `Clergy_Interviews` | clergy.html | ~340 |
| `Field_Checklists` | checklist.html | ~95 |
| `Questionnaire_Responses` | questionnaire.html | ~120 |

Each row = one submission. All linkable by `church_name` for cross-instrument analysis.

---

## Sharing Strategy

Since this is now one unified app, you only need to share **one URL**:

```
https://your-project.vercel.app
```

People landing on it will see all three forms and can pick the relevant one. If you want to deep-link a specific form to a specific audience:

| Audience | Direct URL |
|---|---|
| Clergy interview only | `https://your-project.vercel.app/clergy.html` |
| Field researcher | `https://your-project.vercel.app/checklist.html` |
| Public/congregation | `https://your-project.vercel.app/questionnaire.html` |

---

## Analysis Tip

Because the questionnaire is anonymous, you cannot link a respondent to a specific clergy interview. But you CAN link by `church_name` to compare:

- **Clergy's perception** (interview Schedule A) vs **congregation's perception** (questionnaire Section B)
- **Researcher's objective scoring** (checklist) vs **congregation's perceived adoption** (questionnaire Section D)

This is a strong analytical move for your thesis — triangulating the same construct from three measurement angles.

---

That's it, Boss. Replace the files, run `setupSheets`, redeploy. ~5 minutes total.
