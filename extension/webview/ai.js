/**
 * ai.js — AlgoViz WebView Module
 * ================================
 * Handles rendering of the 5-section AI analysis panel with tab navigation.
 */

"use strict";

window.AlgoVizAI = (() => {

  const SECTION_MAP = {
    "EXPLANATION":     "aiExplanation",
    "COMPLEXITY":      "aiComplexity",
    "STEP_BY_STEP":    "aiStepByStep",
    "OPTIMIZATIONS":   "aiOptimizations",
    "RELATED_PROBLEMS":"aiRelatedProblems",
  };

  const TAB_LABELS = {
    "aiExplanation":    "Explanation",
    "aiComplexity":     "Complexity",
    "aiStepByStep":     "Trace",
    "aiOptimizations":  "Optimize",
    "aiRelatedProblems":"Related",
  };

  // Section accent colors (left-border)
  const SECTION_COLORS = {
    "aiExplanation":    "#7dd3fc",
    "aiComplexity":     "#f0883e",
    "aiStepByStep":     "#c084fc",
    "aiOptimizations":  "#4ade80",
    "aiRelatedProblems":"#fb923c",
  };

  function escapeHtml(str) {
    return str
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;")
      .replace(/'/g,  "&#039;");
  }

  /**
   * Parse AI response text into sections by ALL-CAPS header lines.
   */
  function parseSections(text) {
    const HEADERS = Object.keys(SECTION_MAP);
    const result  = {};
    let current   = null;
    let buffer    = [];

    text.split("\n").forEach(line => {
      const trimmed = line.trim().toUpperCase().replace(/[:\-\s]+$/, "");
      if (HEADERS.includes(trimmed)) {
        if (current !== null) result[current] = buffer.join("\n").trim();
        current = trimmed;
        buffer  = [];
      } else {
        buffer.push(line);
      }
    });
    if (current !== null) result[current] = buffer.join("\n").trim();

    // Fallback: if model ignored structure entirely
    if (Object.keys(result).length === 0) {
      result["EXPLANATION"] = text.trim();
    }
    return result;
  }

  /**
   * Render parsed AI sections into the DOM.
   */
  function renderSections(sections) {
    Object.entries(SECTION_MAP).forEach(([key, elementId]) => {
      const el = document.getElementById(elementId);
      if (!el) return;
      const content = sections[key];
      if (!content) return;

      // Format the content: detect numbered items and wrap nicely
      const formatted = formatContent(content, elementId);

      el.innerHTML = `
        <div class="ai-section-inner" style="border-left-color: ${SECTION_COLORS[elementId]}">
          <div class="ai-section-content">${formatted}</div>
        </div>
      `;
    });
  }

  /**
   * Light formatting for readability — no markdown, just smart text structure.
   */
  function formatContent(text, sectionId) {
    const escaped = escapeHtml(text);
    const lines   = escaped.split("\n");
    let html      = "";

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        html += "<br>";
        return;
      }

      // Detect lines starting with "1." / "2." / "3." for numbered sections
      if (/^\d+\.\s/.test(trimmed)) {
        const [num, ...rest] = trimmed.split(/\.\s(.+)/);
        html += `<div class="ai-item">
          <span class="ai-item__num">${num}</span>
          <span class="ai-item__text">${rest.join("")}</span>
        </div>`;
        return;
      }

      // Inline labels like "Time complexity:" or "Space complexity:"
      const labelMatch = trimmed.match(/^([A-Za-z ]+complexity[^:]*|Best case|Worst case|LeetCode[^:]*|Difficulty[^:]*|Problem[^:]*)\s*:/i);
      if (labelMatch) {
        const label   = escapeHtml(labelMatch[1]);
        const rest    = trimmed.slice(labelMatch[0].length).trim();
        html += `<div class="ai-kv"><span class="ai-kv__key">${label}:</span> <span class="ai-kv__val">${rest}</span></div>`;
        return;
      }

      html += `<p class="ai-para">${trimmed}</p>`;
    });

    return html;
  }

  /**
   * Initialize tab switching behavior.
   */
  function initTabs() {
    const tabs     = document.querySelectorAll(".ai-tab");
    const sections = document.querySelectorAll(".ai-section");

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.section;
        tabs.forEach(t => t.classList.remove("ai-tab--active"));
        sections.forEach(s => { s.hidden = (s.id !== target); });
        tab.classList.add("ai-tab--active");
      });
    });
  }

  /**
   * Also extract space complexity from COMPLEXITY section to update the card.
   */
  function extractSpaceComplexity(sections) {
    const text = sections["COMPLEXITY"] || "";
    const match = text.match(/space complexity[^:]*:\s*([^\n.]+)/i);
    return match ? match[1].trim() : null;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function renderResult(text) {
    document.getElementById("aiLoading").hidden = true;
    document.getElementById("aiResult").hidden  = false;

    const sections = parseSections(text);
    renderSections(sections);
    initTabs();

    // Update space complexity card
    const spaceLabel = extractSpaceComplexity(sections);
    if (spaceLabel) {
      const el = document.getElementById("spaceComplexity");
      if (el) el.textContent = spaceLabel.replace(/\bO\((.+?)\)\b/, "O($1)");
    }
  }

  function renderNoKey() {
    document.getElementById("aiLoading").hidden = true;
    document.getElementById("aiNoKey").hidden   = false;
  }

  function renderError(message) {
    document.getElementById("aiLoading").hidden = true;
    const result = document.getElementById("aiResult");
    result.hidden = false;
    const section = document.getElementById("aiExplanation");
    if (section) {
      section.innerHTML = `<div class="ai-section-inner" style="border-left-color:#f87171">
        <div class="ai-section-content">
          <p class="ai-para" style="color: #f87171;">⚠ ${escapeHtml(message)}</p>
        </div>
      </div>`;
    }
    initTabs();
  }

  return { renderResult, renderNoKey, renderError };
})();