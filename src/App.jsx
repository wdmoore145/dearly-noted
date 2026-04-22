import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, ChevronLeft, Trash2, X,
  Sparkles, Pencil, ExternalLink, Cake, Heart
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================
const STORAGE_KEY = 'giftradar:data';

// Occasion preset definitions.
// - For Birthday/Anniversary: user picks the date (year matters for age / years-since).
// - For fixed holidays: date is auto-set; user just taps to add.
// - For Custom: user enters both a name and a date.
// Mother's Day, Father's Day, Hanukkah, Diwali, Eid intentionally omitted from v1
// because they're moving holidays that need a real recurrence engine.
const PRESET_OCCASIONS = [
  { type: 'Birthday', kind: 'pickDate' },
  { type: 'Anniversary', kind: 'pickDate' },
  { type: 'Christmas', kind: 'fixed', month: 12, day: 25 },
  { type: "Valentine's Day", kind: 'fixed', month: 2, day: 14 },
  { type: "New Year's Day", kind: 'fixed', month: 1, day: 1 },
  { type: 'Halloween', kind: 'fixed', month: 10, day: 31 },
  { type: 'Custom', kind: 'custom' },
];

// Used in the gift-logging form's occasion dropdown.
const GIFT_OCCASION_OPTIONS = [
  'Birthday', 'Anniversary', 'Christmas', "Valentine's Day",
  "New Year's Day", 'Halloween', 'Just because', 'Thank you',
  'Housewarming', 'Wedding', 'Other'
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================
// Helpers
// ============================================================
const uid = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function formatShortDate(s) {
  const p = parseDate(s);
  if (!p) return '';
  return `${MONTHS[p.m - 1]} ${p.d}`;
}

// Days until the next MM-DD recurrence of the given date (ignores year).
function daysUntilNext(dateStr) {
  const p = parseDate(dateStr);
  if (!p) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let target = new Date(today.getFullYear(), p.m - 1, p.d);
  if (target < today) target = new Date(today.getFullYear() + 1, p.m - 1, p.d);
  return Math.round((target - today) / 86400000);
}

function ageOnNext(dateStr) {
  const p = parseDate(dateStr);
  if (!p) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisYearTarget = new Date(today.getFullYear(), p.m - 1, p.d);
  const targetYear = thisYearTarget < today ? today.getFullYear() + 1 : today.getFullYear();
  return targetYear - p.y;
}

function getInitials(name) {
  return name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fixedHolidayDate(month, day) {
  // Store using current year; only MM-DD is used for recurrence.
  const y = new Date().getFullYear();
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Display name: for Custom, use the user-entered name; else use the type.
function occasionDisplayName(occasion) {
  return occasion.type === 'Custom' ? (occasion.customName || 'Custom') : occasion.type;
}

// ============================================================
// Storage hook (localStorage-backed)
// ============================================================
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { people: [], occasions: [], wishlist: [], gifts: [] };
    const parsed = JSON.parse(raw);
    return {
      people: parsed.people || [],
      occasions: parsed.occasions || [],
      wishlist: parsed.wishlist || [],
      gifts: parsed.gifts || [],
    };
  } catch {
    return { people: [], occasions: [], wishlist: [], gifts: [] };
  }
}

function useData() {
  const [data, setData] = useState(() => loadData());

  const persist = (next) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to persist data', e);
    }
  };

  return { data, persist };
}

// ============================================================
// Styles (single injected stylesheet — refactor to CSS modules later if desired)
// ============================================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Geist:wght@300..700&family=Geist+Mono:wght@400..600&display=swap');

    :root {
      --paper: #F1EADC;
      --paper-2: #EAE1CF;
      --surface: #FAF5E9;
      --ink: #1C1913;
      --ink-2: #4A443A;
      --ink-3: #7A7265;
      --line: #D9CFB9;
      --accent: #B5502F;
      --accent-2: #974327;
      --gold: #B88A3E;
      --landed: #5E7A54;
      --missed: #9E5B50;
      --neutral: #8B7F6A;
    }

    *, *::before, *::after { box-sizing: border-box; }
    html, body, #root { margin: 0; padding: 0; min-height: 100%; }
    body { background: var(--paper); }

    .gr-root {
      min-height: 100vh;
      background: var(--paper);
      background-image:
        radial-gradient(1200px 600px at 20% -10%, rgba(184,138,62,0.08), transparent 60%),
        radial-gradient(800px 500px at 110% 10%, rgba(181,80,47,0.05), transparent 60%);
      color: var(--ink);
      font-family: 'Geist', ui-sans-serif, system-ui, sans-serif;
      font-feature-settings: "ss01", "cv11";
      -webkit-font-smoothing: antialiased;
      letter-spacing: -0.005em;
      padding-bottom: 120px;
    }

    .gr-grain {
      position: fixed; inset: 0; pointer-events: none; opacity: 0.05;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.9'/></svg>");
      mix-blend-mode: multiply;
      z-index: 1;
    }

    .gr-container { max-width: 640px; margin: 0 auto; padding: 0 20px; position: relative; z-index: 2; }

    .gr-header { padding: 28px 0 12px; display: flex; align-items: center; justify-content: space-between; }
    .gr-brand { display: flex; align-items: center; gap: 10px; }
    .gr-brand-mark { position: relative; width: 28px; height: 28px; }
    .gr-brand-mark .ring { position: absolute; inset: 0; border: 1px solid var(--ink); border-radius: 50%; }
    .gr-brand-mark .ring.r2 { inset: 5px; opacity: 0.55; }
    .gr-brand-mark .ring.r3 { inset: 10px; opacity: 0.3; }
    .gr-brand-mark .dot { position: absolute; top: 3px; right: 3px; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px rgba(181,80,47,0.15); }
    .gr-brand-mark .sweep { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 210deg, transparent 0deg, rgba(181,80,47,0.18) 40deg, transparent 80deg); animation: sweep 4.5s linear infinite; }
    @keyframes sweep { to { transform: rotate(360deg); } }
    .gr-brand-name { font-family: 'Fraunces', serif; font-weight: 400; font-style: italic; font-size: 22px; letter-spacing: -0.02em; font-variation-settings: "opsz" 144; }
    .gr-brand-name b { font-style: normal; font-weight: 500; font-family: 'Fraunces', serif; }

    .gr-tabs { display: inline-flex; background: var(--surface); padding: 4px; border-radius: 999px; border: 1px solid var(--line); gap: 2px; margin: 8px 0 22px; }
    .gr-tab { border: none; background: transparent; padding: 8px 16px; font-family: inherit; font-size: 13px; color: var(--ink-3); border-radius: 999px; cursor: pointer; letter-spacing: 0.01em; }
    .gr-tab.active { background: var(--ink); color: var(--paper); }

    .gr-display {
      font-family: 'Fraunces', serif;
      font-weight: 380; font-size: 42px; line-height: 1.02; letter-spacing: -0.03em;
      font-variation-settings: "opsz" 144, "SOFT" 30; color: var(--ink); margin: 6px 0 4px;
    }
    .gr-display em { font-style: italic; font-weight: 300; color: var(--ink-2); }
    .gr-eyebrow { text-transform: uppercase; font-size: 11px; letter-spacing: 0.18em; color: var(--ink-3); font-family: 'Geist Mono', monospace; margin-bottom: 10px; }
    .gr-section-title { font-family: 'Fraunces', serif; font-size: 22px; letter-spacing: -0.02em; font-weight: 450; margin: 32px 0 14px; }

    .gr-card {
      background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 18px;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; cursor: pointer;
    }
    .gr-card:hover { transform: translateY(-1px); box-shadow: 0 6px 20px -12px rgba(28,25,19,0.2); border-color: #c8baa0; }
    .gr-card.static { cursor: default; }
    .gr-card.static:hover { transform: none; box-shadow: none; border-color: var(--line); }

    .gr-upcoming-card { display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: center; }
    .gr-days-badge {
      font-family: 'Fraunces', serif; font-weight: 380; font-size: 32px; line-height: 1; letter-spacing: -0.04em; min-width: 52px;
    }
    .gr-days-badge small { display: block; font-family: 'Geist Mono', monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--ink-3); text-transform: uppercase; margin-top: 4px; font-weight: 500; }
    .gr-days-badge.soon { color: var(--accent); }
    .gr-days-badge.today { color: var(--accent); }

    .gr-up-name { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 450; letter-spacing: -0.015em; }
    .gr-up-meta { font-size: 13px; color: var(--ink-3); margin-top: 3px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .gr-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-family: 'Geist Mono', monospace; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 8px; border-radius: 6px; background: var(--paper-2); color: var(--ink-2); }
    .gr-chip.accent { background: rgba(181,80,47,0.1); color: var(--accent-2); }
    .gr-chip.gold { background: rgba(184,138,62,0.15); color: #8C6520; }

    .gr-person-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--line); cursor: pointer; }
    .gr-person-row:hover .gr-person-name { color: var(--accent-2); }
    .gr-person-row:last-child { border-bottom: none; }
    .gr-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--paper-2); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 17px; color: var(--ink-2); }
    .gr-person-name { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 450; transition: color 0.15s; }
    .gr-person-sub { font-size: 12px; color: var(--ink-3); margin-top: 2px; font-family: 'Geist Mono', monospace; letter-spacing: 0.04em; }

    .gr-btn {
      font-family: inherit; font-size: 14px; letter-spacing: -0.005em;
      padding: 10px 16px; border-radius: 10px; border: 1px solid var(--ink);
      background: var(--ink); color: var(--paper); cursor: pointer;
      display: inline-flex; align-items: center; gap: 7px;
      transition: background 0.15s, transform 0.05s;
    }
    .gr-btn:hover { background: #2a2519; }
    .gr-btn:active { transform: translateY(1px); }
    .gr-btn.ghost { background: transparent; color: var(--ink); }
    .gr-btn.ghost:hover { background: var(--paper-2); }
    .gr-btn.accent { background: var(--accent); border-color: var(--accent); }
    .gr-btn.accent:hover { background: var(--accent-2); }
    .gr-btn.sm { padding: 6px 10px; font-size: 12px; }
    .gr-btn.danger { background: transparent; border: 1px solid var(--line); color: var(--missed); }
    .gr-btn.danger:hover { background: rgba(158,91,80,0.08); }

    .gr-fab {
      position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
      background: var(--ink); color: var(--paper); border: none;
      padding: 14px 22px; border-radius: 999px; font-family: inherit;
      font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
      box-shadow: 0 12px 30px -10px rgba(28,25,19,0.45), 0 2px 6px rgba(28,25,19,0.15);
      z-index: 5; transition: transform 0.15s;
    }
    .gr-fab:hover { transform: translateX(-50%) translateY(-1px); }

    .gr-field { display: block; margin-bottom: 14px; }
    .gr-field label { display: block; font-family: 'Geist Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--ink-3); margin-bottom: 6px; font-weight: 500; }
    .gr-input, .gr-select, .gr-textarea {
      width: 100%; padding: 11px 12px; border: 1px solid var(--line); border-radius: 8px;
      background: var(--surface); font-family: inherit; font-size: 15px; color: var(--ink);
      transition: border-color 0.15s, background 0.15s;
    }
    .gr-input:focus, .gr-select:focus, .gr-textarea:focus { outline: none; border-color: var(--ink); background: #fff; }
    .gr-textarea { resize: vertical; min-height: 72px; }
    .gr-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .gr-segmented { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .gr-seg-btn {
      padding: 10px; border: 1px solid var(--line); background: var(--surface);
      font-family: inherit; font-size: 13px; color: var(--ink-2); border-radius: 8px;
      cursor: pointer; text-align: center; transition: all 0.15s;
    }
    .gr-seg-btn.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }
    .gr-seg-btn.reaction-landed.active { background: var(--landed); border-color: var(--landed); }
    .gr-seg-btn.reaction-missed.active { background: var(--missed); border-color: var(--missed); }
    .gr-seg-btn.reaction-neutral.active { background: var(--neutral); border-color: var(--neutral); }

    .gr-modal-bg {
      position: fixed; inset: 0; background: rgba(28,25,19,0.3);
      backdrop-filter: blur(4px); z-index: 50;
      display: flex; align-items: flex-end; justify-content: center;
      animation: fade 0.2s ease;
    }
    .gr-modal {
      background: var(--paper); width: 100%; max-width: 640px;
      border-radius: 20px 20px 0 0; padding: 24px 20px 32px;
      max-height: 90vh; overflow-y: auto;
      animation: rise 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      border-top: 1px solid var(--line);
    }
    @media (min-width: 700px) {
      .gr-modal-bg { align-items: center; }
      .gr-modal { border-radius: 18px; max-width: 500px; }
    }
    .gr-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .gr-modal-title { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 400; letter-spacing: -0.02em; }
    .gr-close { border: none; background: transparent; cursor: pointer; color: var(--ink-2); padding: 6px; border-radius: 8px; display: flex; }
    .gr-close:hover { background: var(--paper-2); color: var(--ink); }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes rise { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .gr-empty { text-align: center; padding: 48px 20px; }
    .gr-empty-radar { width: 120px; height: 120px; margin: 0 auto 20px; position: relative; }
    .gr-empty-radar .ring { position: absolute; inset: 0; border: 1px dashed var(--line); border-radius: 50%; }
    .gr-empty-radar .ring.r2 { inset: 18px; opacity: 0.7; }
    .gr-empty-radar .ring.r3 { inset: 36px; opacity: 0.5; }
    .gr-empty-radar .ring.r4 { inset: 52px; opacity: 0.3; }
    .gr-empty-radar .sweep { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0deg, rgba(181,80,47,0.22) 60deg, transparent 100deg); animation: sweep 5s linear infinite; }
    .gr-empty-title { font-family: 'Fraunces', serif; font-size: 22px; letter-spacing: -0.02em; margin-bottom: 6px; }
    .gr-empty-body { color: var(--ink-3); max-width: 340px; margin: 0 auto 18px; font-size: 14px; line-height: 1.55; }

    .gr-back { background: transparent; border: none; padding: 8px 10px 8px 4px; display: inline-flex; align-items: center; gap: 4px; color: var(--ink-2); cursor: pointer; font-family: inherit; font-size: 13px; margin-bottom: 8px; border-radius: 6px; }
    .gr-back:hover { color: var(--accent-2); }
    .gr-detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 22px; }
    .gr-detail-name { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 380; letter-spacing: -0.03em; line-height: 1.02; margin: 0 0 6px; }
    .gr-detail-meta { font-size: 13px; color: var(--ink-3); font-family: 'Geist Mono', monospace; letter-spacing: 0.04em; }

    .gr-list-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--line); }
    .gr-list-item:last-child { border-bottom: none; }
    .gr-wish-name { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 450; line-height: 1.3; }
    .gr-wish-meta { font-size: 12px; color: var(--ink-3); margin-top: 3px; }
    .gr-wish-link { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; color: var(--accent-2); font-size: 12px; font-family: 'Geist Mono', monospace; letter-spacing: 0.04em; text-decoration: none; }
    .gr-wish-link:hover { text-decoration: underline; }
    .gr-icon-btn { border: none; background: transparent; padding: 6px; border-radius: 6px; cursor: pointer; color: var(--ink-3); display: flex; }
    .gr-icon-btn:hover { color: var(--accent); background: rgba(181,80,47,0.08); }

    .gr-reaction-dot { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-family: 'Geist Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-3); }
    .gr-reaction-dot::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--ink-3); }
    .gr-reaction-dot.landed::before { background: var(--landed); }
    .gr-reaction-dot.landed { color: var(--landed); }
    .gr-reaction-dot.missed::before { background: var(--missed); }
    .gr-reaction-dot.missed { color: var(--missed); }
    .gr-reaction-dot.neutral::before { background: var(--neutral); }

    .gr-prep-brief {
      background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
      padding: 18px; margin-bottom: 14px; position: relative; overflow: hidden;
    }
    .gr-prep-brief::before { content: ''; position: absolute; right: -60px; top: -60px; width: 160px; height: 160px; border-radius: 50%; border: 1px dashed var(--line); opacity: 0.6; }
    .gr-prep-brief::after { content: ''; position: absolute; right: -30px; top: -30px; width: 100px; height: 100px; border-radius: 50%; border: 1px dashed var(--line); opacity: 0.5; }

    .gr-empty-sub { color: var(--ink-3); font-size: 13px; padding: 12px 0; font-style: italic; }

    .gr-history-item { display: grid; grid-template-columns: auto 1fr; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--line); }
    .gr-history-item:last-child { border-bottom: none; }
    .gr-history-date { font-family: 'Geist Mono', monospace; font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; padding-top: 2px; }
    .gr-history-item-title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 450; }
    .gr-history-item-meta { font-size: 12px; color: var(--ink-3); margin-top: 4px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

    .gr-occasion-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--line); }
    .gr-occasion-row:last-child { border-bottom: none; }
    .gr-occasion-name { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 450; display: flex; align-items: center; gap: 8px; }
    .gr-occasion-meta { font-size: 12px; color: var(--ink-3); font-family: 'Geist Mono', monospace; letter-spacing: 0.04em; margin-top: 3px; }
    .gr-occasion-icon { color: var(--accent); display: inline-flex; }

    .gr-preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .gr-preset-btn {
      padding: 14px 12px; border: 1px solid var(--line); background: var(--surface);
      font-family: inherit; font-size: 14px; color: var(--ink); border-radius: 10px;
      cursor: pointer; text-align: left; transition: all 0.15s; display: flex; align-items: center; gap: 8px;
    }
    .gr-preset-btn:hover { background: var(--paper-2); border-color: var(--ink-3); }

    .gr-footer-note { text-align: center; font-size: 11px; color: var(--ink-3); margin-top: 40px; font-family: 'Geist Mono', monospace; letter-spacing: 0.08em; }
  `}</style>
);

// ============================================================
// Reusable: Modal
// ============================================================
const Modal = ({ title, onClose, children }) => (
  <div className="gr-modal-bg" onClick={onClose}>
    <div className="gr-modal" onClick={e => e.stopPropagation()}>
      <div className="gr-modal-head">
        <div className="gr-modal-title">{title}</div>
        <button className="gr-close" onClick={onClose}><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ============================================================
// Forms
// ============================================================
const PersonForm = ({ initial, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name || '');
  const [relationship, setRelationship] = useState(initial?.relationship || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id || uid('person'),
      name: name.trim(),
      relationship: relationship.trim(),
      notes: notes.trim(),
      createdAt: initial?.createdAt || Date.now(),
    });
  };

  return (
    <div>
      <div className="gr-field">
        <label>Name</label>
        <input className="gr-input" value={name} onChange={e => setName(e.target.value)} placeholder="Sarah" autoFocus />
      </div>
      <div className="gr-field">
        <label>Relationship</label>
        <input className="gr-input" value={relationship} onChange={e => setRelationship(e.target.value)} placeholder="sister, friend, partner…" />
      </div>
      <div className="gr-field">
        <label>Notes</label>
        <textarea className="gr-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Allergies, sizes, brands they love, things to avoid…" />
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: -4, marginBottom: 14, fontStyle: 'italic' }}>
        You'll add birthdays, anniversaries, and other occasions on the next screen.
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="gr-btn ghost" onClick={onCancel}>Cancel</button>
        <button className="gr-btn accent" onClick={submit}>Save</button>
      </div>
    </div>
  );
};

const OccasionAddSheet = ({ onAdd, onCancel }) => {
  // mode: 'list' | 'pickDate' | 'custom'
  const [mode, setMode] = useState('list');
  const [pickType, setPickType] = useState(null); // 'Birthday' or 'Anniversary'
  const [date, setDate] = useState('');
  const [customName, setCustomName] = useState('');

  const handlePresetClick = (preset) => {
    if (preset.kind === 'fixed') {
      onAdd({ type: preset.type, date: fixedHolidayDate(preset.month, preset.day) });
    } else if (preset.kind === 'pickDate') {
      setPickType(preset.type);
      setMode('pickDate');
    } else if (preset.kind === 'custom') {
      setMode('custom');
    }
  };

  const submitDate = () => {
    if (!date) return;
    onAdd({ type: pickType, date });
  };

  const submitCustom = () => {
    if (!customName.trim() || !date) return;
    onAdd({ type: 'Custom', customName: customName.trim(), date });
  };

  if (mode === 'pickDate') {
    return (
      <div>
        <div className="gr-field">
          <label>{pickType} date</label>
          <input type="date" className="gr-input" value={date} onChange={e => setDate(e.target.value)} autoFocus />
        </div>
        {pickType === 'Birthday' && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: -8, marginBottom: 14, fontStyle: 'italic' }}>
            Include the year — we use it to show their age on prep briefs.
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="gr-btn ghost" onClick={() => setMode('list')}>Back</button>
          <button className="gr-btn accent" onClick={submitDate} disabled={!date}>Add</button>
        </div>
      </div>
    );
  }

  if (mode === 'custom') {
    return (
      <div>
        <div className="gr-field">
          <label>Occasion name</label>
          <input className="gr-input" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Naming day, work anniversary, etc." autoFocus />
        </div>
        <div className="gr-field">
          <label>Date</label>
          <input type="date" className="gr-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="gr-btn ghost" onClick={() => setMode('list')}>Back</button>
          <button className="gr-btn accent" onClick={submitCustom} disabled={!customName.trim() || !date}>Add</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 4 }}>Pick an occasion to add.</div>
      <div className="gr-preset-grid">
        {PRESET_OCCASIONS.map(p => (
          <button key={p.type} className="gr-preset-btn" onClick={() => handlePresetClick(p)}>
            {p.type}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="gr-btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

const WishForm = ({ onSave, onCancel }) => {
  const [item, setItem] = useState('');
  const [notes, setNotes] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [link, setLink] = useState('');

  const submit = () => {
    if (!item.trim()) return;
    onSave({
      item: item.trim(),
      notes: notes.trim(),
      priceRange: priceRange.trim(),
      link: link.trim(),
    });
  };

  return (
    <div>
      <div className="gr-field">
        <label>Item *</label>
        <input className="gr-input" value={item} onChange={e => setItem(e.target.value)} placeholder="Pasta maker" autoFocus />
      </div>
      <div className="gr-field">
        <label>Context / where you heard it</label>
        <textarea className="gr-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder='"She mentioned this at brunch in July"' />
      </div>
      <div className="gr-field-row">
        <div className="gr-field">
          <label>Price range</label>
          <input className="gr-input" value={priceRange} onChange={e => setPriceRange(e.target.value)} placeholder="$50–75" />
        </div>
        <div className="gr-field">
          <label>Product link</label>
          <input className="gr-input" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
        <button className="gr-btn ghost" onClick={onCancel}>Cancel</button>
        <button className="gr-btn accent" onClick={submit} disabled={!item.trim()}>Add to wishlist</button>
      </div>
    </div>
  );
};

const GiftForm = ({ onSave, onCancel }) => {
  const [item, setItem] = useState('');
  const [date, setDate] = useState(todayISO());
  const [occasion, setOccasion] = useState('Birthday');
  const [price, setPrice] = useState('');
  const [reaction, setReaction] = useState('neutral');
  const [notes, setNotes] = useState('');

  const submit = () => {
    if (!item.trim()) return;
    onSave({
      item: item.trim(),
      date,
      occasion,
      price: price ? Number(price) : null,
      reaction,
      notes: notes.trim(),
    });
  };

  return (
    <div>
      <div className="gr-field">
        <label>Gift</label>
        <input className="gr-input" value={item} onChange={e => setItem(e.target.value)} placeholder="Linen scarf" autoFocus />
      </div>
      <div className="gr-field-row">
        <div className="gr-field">
          <label>Date</label>
          <input type="date" className="gr-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="gr-field">
          <label>Occasion</label>
          <select className="gr-select" value={occasion} onChange={e => setOccasion(e.target.value)}>
            {GIFT_OCCASION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="gr-field">
        <label>Price (optional)</label>
        <input type="number" className="gr-input" value={price} onChange={e => setPrice(e.target.value)} placeholder="60" />
      </div>
      <div className="gr-field">
        <label>How it landed</label>
        <div className="gr-segmented">
          <button className={`gr-seg-btn reaction-landed ${reaction === 'landed' ? 'active' : ''}`} onClick={() => setReaction('landed')}>Landed</button>
          <button className={`gr-seg-btn reaction-neutral ${reaction === 'neutral' ? 'active' : ''}`} onClick={() => setReaction('neutral')}>Neutral</button>
          <button className={`gr-seg-btn reaction-missed ${reaction === 'missed' ? 'active' : ''}`} onClick={() => setReaction('missed')}>Missed</button>
        </div>
      </div>
      <div className="gr-field">
        <label>Notes</label>
        <textarea className="gr-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="What made it hit (or flop)…" />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
        <button className="gr-btn ghost" onClick={onCancel}>Cancel</button>
        <button className="gr-btn accent" onClick={submit}>Log gift</button>
      </div>
    </div>
  );
};

// ============================================================
// Views
// ============================================================
const UpcomingCard = ({ person, occasionLabel, occasionType, dateStr, days, wishlistCount, age, onClick }) => {
  const label = days === 0 ? 'today' : days === 1 ? 'day' : 'days';
  const cls = days === 0 ? 'today' : days <= 14 ? 'soon' : '';
  return (
    <div className="gr-card gr-upcoming-card" onClick={onClick}>
      <div className={`gr-days-badge ${cls}`}>
        {days === 0 ? 'Today' : days}
        {days !== 0 && <small>{label} out</small>}
      </div>
      <div>
        <div className="gr-up-name">{person.name}</div>
        <div className="gr-up-meta">
          <span className="gr-chip accent">{occasionLabel}</span>
          <span>
            {formatShortDate(dateStr)}
            {age && occasionType === 'Birthday' ? ` · turning ${age}` : ''}
          </span>
          {wishlistCount > 0 && (
            <span className="gr-chip gold"><Sparkles size={10} /> {wishlistCount} idea{wishlistCount === 1 ? '' : 's'}</span>
          )}
        </div>
      </div>
      <ChevronLeft size={18} style={{ transform: 'rotate(180deg)', color: 'var(--ink-3)' }} />
    </div>
  );
};

const Dashboard = ({ data, onOpenPerson, onAddPerson }) => {
  const upcoming = useMemo(() => {
    const items = [];
    for (const occ of data.occasions) {
      const person = data.people.find(p => p.id === occ.personId);
      if (!person) continue;
      const days = daysUntilNext(occ.date);
      if (days !== null && days <= 90) {
        items.push({
          person,
          occasionLabel: occasionDisplayName(occ),
          occasionType: occ.type,
          dateStr: occ.date,
          days,
          age: occ.type === 'Birthday' ? ageOnNext(occ.date) : null,
        });
      }
    }
    return items.sort((a, b) => a.days - b.days);
  }, [data.occasions, data.people]);

  const wishlistCountFor = (pid) => data.wishlist.filter(w => w.personId === pid && w.status !== 'purchased').length;

  if (data.people.length === 0) {
    return (
      <div className="gr-empty">
        <div className="gr-empty-radar">
          <div className="ring"></div>
          <div className="ring r2"></div>
          <div className="ring r3"></div>
          <div className="ring r4"></div>
          <div className="sweep"></div>
        </div>
        <div className="gr-empty-title">Nothing on the radar yet</div>
        <div className="gr-empty-body">
          Add the people you give gifts to — family, close friends, your partner. Gift Radar will keep an eye on their occasions and remember what they've mentioned wanting.
        </div>
        <button className="gr-btn accent" onClick={onAddPerson}><Plus size={16} /> Add your first person</button>
      </div>
    );
  }

  return (
    <div>
      <div className="gr-eyebrow">On the Radar</div>
      <h1 className="gr-display">The next <em>ninety days</em>.</h1>

      {upcoming.length === 0 ? (
        <div className="gr-card static" style={{ marginTop: 16 }}>
          <div style={{ color: 'var(--ink-3)', fontSize: 14, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
            No occasions coming up in the next 90 days. Add some on each person's page.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {upcoming.map((u, i) => (
            <UpcomingCard
              key={`${u.person.id}-${u.occasionLabel}-${i}`}
              person={u.person}
              occasionLabel={u.occasionLabel}
              occasionType={u.occasionType}
              dateStr={u.dateStr}
              days={u.days}
              age={u.age}
              wishlistCount={wishlistCountFor(u.person.id)}
              onClick={() => onOpenPerson(u.person.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PeopleList = ({ data, onOpenPerson, onAddPerson }) => {
  if (data.people.length === 0) {
    return (
      <div className="gr-empty">
        <div className="gr-empty-title">No one yet</div>
        <div className="gr-empty-body">Start by adding someone you give gifts to.</div>
        <button className="gr-btn accent" onClick={onAddPerson}><Plus size={16} /> Add person</button>
      </div>
    );
  }

  const sorted = [...data.people].sort((a, b) => a.name.localeCompare(b.name));

  const nextOccasionLabel = (p) => {
    const personOccasions = data.occasions
      .filter(o => o.personId === p.id)
      .map(o => ({ ...o, days: daysUntilNext(o.date) }))
      .filter(o => o.days !== null)
      .sort((a, b) => a.days - b.days);
    if (personOccasions.length === 0) return 'No occasions set';
    const next = personOccasions[0];
    return `${occasionDisplayName(next)} · ${next.days} day${next.days === 1 ? '' : 's'}`;
  };

  return (
    <div>
      <div className="gr-eyebrow">The People</div>
      <h1 className="gr-display">Everyone you're <em>keeping an eye on</em>.</h1>
      <div style={{ marginTop: 16 }}>
        {sorted.map(p => (
          <div key={p.id} className="gr-person-row" onClick={() => onOpenPerson(p.id)}>
            <div className="gr-avatar">{getInitials(p.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="gr-person-name">{p.name}</div>
              <div className="gr-person-sub">
                {p.relationship ? `${p.relationship} · ` : ''}{nextOccasionLabel(p)}
              </div>
            </div>
            <ChevronLeft size={16} style={{ transform: 'rotate(180deg)', color: 'var(--ink-3)' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

const PersonDetail = ({
  data, personId,
  onBack, onEditPerson, onDeletePerson,
  onAddOccasion, onRemoveOccasion,
  onAddWishlist, onRemoveWishlist,
  onAddGift, onRemoveGift,
}) => {
  const person = data.people.find(p => p.id === personId);
  if (!person) return null;

  const occasions = data.occasions
    .filter(o => o.personId === personId)
    .map(o => ({ ...o, days: daysUntilNext(o.date) }))
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));

  const wishlist = data.wishlist
    .filter(w => w.personId === personId)
    .sort((a, b) => b.capturedAt - a.capturedAt);

  const gifts = data.gifts
    .filter(g => g.personId === personId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const upcomingOccasions = occasions.filter(o => o.days !== null && o.days <= 60);
  const brief = upcomingOccasions[0];
  const briefLabel = brief ? occasionDisplayName(brief) : null;
  const briefAge = brief?.type === 'Birthday' ? ageOnNext(brief.date) : null;

  const openWishlistCount = wishlist.filter(w => w.status !== 'purchased').length;

  return (
    <div>
      <button className="gr-back" onClick={onBack}><ChevronLeft size={16} /> Back</button>

      <div className="gr-detail-head">
        <div>
          <h1 className="gr-detail-name">{person.name}</h1>
          <div className="gr-detail-meta">
            {person.relationship || '—'}
            {occasions.length > 0 && <> · {occasions.length} occasion{occasions.length === 1 ? '' : 's'}</>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="gr-icon-btn" onClick={onEditPerson} title="Edit"><Pencil size={16} /></button>
          <button className="gr-icon-btn" onClick={onDeletePerson} title="Delete"><Trash2 size={16} /></button>
        </div>
      </div>

      {brief && (
        <div className="gr-prep-brief">
          <div className="gr-eyebrow" style={{ marginBottom: 6 }}>Prep brief</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, letterSpacing: '-0.015em', lineHeight: 1.3 }}>
            {briefLabel} in <b style={{ color: brief.days <= 14 ? 'var(--accent)' : 'var(--ink)' }}>
              {brief.days === 0 ? 'today' : `${brief.days} day${brief.days === 1 ? '' : 's'}`}
            </b>
            {briefAge ? ` · turning ${briefAge}` : ''}.
          </div>
          {openWishlistCount > 0 ? (
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>
              <Sparkles size={12} style={{ display: 'inline', verticalAlign: -1, marginRight: 5 }} />
              {openWishlistCount} idea{openWishlistCount === 1 ? '' : 's'} on file — scroll down to review.
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, fontStyle: 'italic' }}>
              No ideas logged yet. Capture something next time they mention wanting it.
            </div>
          )}
        </div>
      )}

      {/* Occasions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 8 }}>
        <div className="gr-section-title" style={{ margin: 0 }}>Occasions</div>
        <button className="gr-btn sm ghost" onClick={onAddOccasion}><Plus size={14} /> Add</button>
      </div>
      {occasions.length === 0 ? (
        <div className="gr-empty-sub">No occasions set yet. Add a birthday, anniversary, or holiday to start tracking.</div>
      ) : (
        <div>
          {occasions.map(o => (
            <div key={o.id} className="gr-occasion-row">
              <div>
                <div className="gr-occasion-name">
                  {o.type === 'Birthday' && <span className="gr-occasion-icon"><Cake size={14} /></span>}
                  {o.type === 'Anniversary' && <span className="gr-occasion-icon"><Heart size={14} /></span>}
                  {occasionDisplayName(o)}
                </div>
                <div className="gr-occasion-meta">
                  {formatShortDate(o.date)}
                  {o.days !== null && <> · in {o.days} day{o.days === 1 ? '' : 's'}</>}
                  {o.type === 'Birthday' && ageOnNext(o.date) && <> · turning {ageOnNext(o.date)}</>}
                </div>
              </div>
              <button className="gr-icon-btn" onClick={() => onRemoveOccasion(o.id)}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Wishlist */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 8 }}>
        <div className="gr-section-title" style={{ margin: 0 }}>Wishlist</div>
        <button className="gr-btn sm ghost" onClick={onAddWishlist}><Plus size={14} /> Add</button>
      </div>
      {wishlist.length === 0 ? (
        <div className="gr-empty-sub">Nothing captured yet. Next time they mention wanting something, add it here.</div>
      ) : (
        <div>
          {wishlist.map(w => (
            <div key={w.id} className="gr-list-item">
              <div style={{ flex: 1 }}>
                <div className="gr-wish-name">{w.item}</div>
                {w.notes && <div className="gr-wish-meta">{w.notes}</div>}
                <div className="gr-wish-meta" style={{ marginTop: 4, fontFamily: 'Geist Mono, monospace', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {w.priceRange && <>{w.priceRange} · </>}
                  captured {new Date(w.capturedAt).toLocaleDateString()}
                </div>
                {w.link && (
                  <a className="gr-wish-link" href={w.link} target="_blank" rel="noopener noreferrer">
                    View product <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <button className="gr-icon-btn" onClick={() => onRemoveWishlist(w.id)}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Gift history */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 8 }}>
        <div className="gr-section-title" style={{ margin: 0 }}>Gift history</div>
        <button className="gr-btn sm ghost" onClick={onAddGift}><Plus size={14} /> Log</button>
      </div>
      {gifts.length === 0 ? (
        <div className="gr-empty-sub">No gifts logged yet. Record what you give to build a pattern over time.</div>
      ) : (
        <div>
          {gifts.map(g => (
            <div key={g.id} className="gr-history-item">
              <div className="gr-history-date">{formatShortDate(g.date)}<br />{g.date.slice(0, 4)}</div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div className="gr-history-item-title">{g.item}</div>
                    <div className="gr-history-item-meta">
                      <span>{g.occasion}</span>
                      {g.price != null && <span>· ${g.price}</span>}
                      <span className={`gr-reaction-dot ${g.reaction}`}>{g.reaction}</span>
                    </div>
                    {g.notes && <div className="gr-wish-meta" style={{ marginTop: 5 }}>{g.notes}</div>}
                  </div>
                  <button className="gr-icon-btn" onClick={() => onRemoveGift(g.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// App root
// ============================================================
export default function App() {
  const { data, persist } = useData();
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'people'
  const [openPersonId, setOpenPersonId] = useState(null);
  const [modal, setModal] = useState(null); // 'addPerson' | 'editPerson' | 'addOccasion' | 'addWishlist' | 'addGift'

  const openPerson = data.people.find(p => p.id === openPersonId);

  // --- Mutations ---
  const savePerson = (person) => {
    const exists = data.people.find(p => p.id === person.id);
    const people = exists
      ? data.people.map(p => p.id === person.id ? person : p)
      : [...data.people, person];
    persist({ ...data, people });
    setModal(null);
    if (!exists) setOpenPersonId(person.id);
  };

  const deletePerson = (id) => {
    if (!window.confirm('Delete this person and all their occasions, wishlist, and gift history?')) return;
    persist({
      people: data.people.filter(p => p.id !== id),
      occasions: data.occasions.filter(o => o.personId !== id),
      wishlist: data.wishlist.filter(w => w.personId !== id),
      gifts: data.gifts.filter(g => g.personId !== id),
    });
    setOpenPersonId(null);
  };

  const addOccasion = ({ type, customName, date }) => {
    const o = {
      id: uid('occ'),
      personId: openPersonId,
      type,
      customName: customName || null,
      date,
      createdAt: Date.now(),
    };
    persist({ ...data, occasions: [...data.occasions, o] });
    setModal(null);
  };

  const removeOccasion = (id) => {
    persist({ ...data, occasions: data.occasions.filter(o => o.id !== id) });
  };

  const addWishlist = ({ item, notes, priceRange, link }) => {
    const w = {
      id: uid('wish'),
      personId: openPersonId,
      item, notes, priceRange, link,
      capturedAt: Date.now(),
      status: 'open',
    };
    persist({ ...data, wishlist: [...data.wishlist, w] });
    setModal(null);
  };

  const removeWishlist = (id) => {
    persist({ ...data, wishlist: data.wishlist.filter(w => w.id !== id) });
  };

  const addGift = (payload) => {
    const g = { id: uid('gift'), personId: openPersonId, ...payload };
    persist({ ...data, gifts: [...data.gifts, g] });
    setModal(null);
  };

  const removeGift = (id) => {
    persist({ ...data, gifts: data.gifts.filter(g => g.id !== id) });
  };

  return (
    <div className="gr-root">
      <GlobalStyles />
      <div className="gr-grain"></div>
      <div className="gr-container">
        <div className="gr-header">
          <div className="gr-brand">
            <div className="gr-brand-mark">
              <div className="ring"></div>
              <div className="ring r2"></div>
              <div className="ring r3"></div>
              <div className="sweep"></div>
              <div className="dot"></div>
            </div>
            <div className="gr-brand-name">Gift <b>Radar</b></div>
          </div>
        </div>

        {!openPersonId && (
          <div className="gr-tabs">
            <button className={`gr-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming</button>
            <button className={`gr-tab ${tab === 'people' ? 'active' : ''}`} onClick={() => setTab('people')}>People</button>
          </div>
        )}

        {openPersonId ? (
          <PersonDetail
            data={data}
            personId={openPersonId}
            onBack={() => setOpenPersonId(null)}
            onEditPerson={() => setModal('editPerson')}
            onDeletePerson={() => deletePerson(openPersonId)}
            onAddOccasion={() => setModal('addOccasion')}
            onRemoveOccasion={removeOccasion}
            onAddWishlist={() => setModal('addWishlist')}
            onRemoveWishlist={removeWishlist}
            onAddGift={() => setModal('addGift')}
            onRemoveGift={removeGift}
          />
        ) : tab === 'upcoming' ? (
          <Dashboard data={data} onOpenPerson={setOpenPersonId} onAddPerson={() => setModal('addPerson')} />
        ) : (
          <PeopleList data={data} onOpenPerson={setOpenPersonId} onAddPerson={() => setModal('addPerson')} />
        )}

        <div className="gr-footer-note">GIFT RADAR · v0.2 · LOCAL</div>
      </div>

      {!openPersonId && (
        <button className="gr-fab" onClick={() => setModal('addPerson')}>
          <Plus size={16} /> Add person
        </button>
      )}

      {modal === 'addPerson' && (
        <Modal title="Add a person" onClose={() => setModal(null)}>
          <PersonForm onSave={savePerson} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'editPerson' && openPerson && (
        <Modal title="Edit person" onClose={() => setModal(null)}>
          <PersonForm initial={openPerson} onSave={savePerson} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'addOccasion' && openPerson && (
        <Modal title={`Add occasion for ${openPerson.name}`} onClose={() => setModal(null)}>
          <OccasionAddSheet onAdd={addOccasion} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'addWishlist' && openPerson && (
        <Modal title={`Add to ${openPerson.name}'s wishlist`} onClose={() => setModal(null)}>
          <WishForm onSave={addWishlist} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'addGift' && openPerson && (
        <Modal title={`Log a gift for ${openPerson.name}`} onClose={() => setModal(null)}>
          <GiftForm onSave={addGift} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
