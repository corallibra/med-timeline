/**
 * 中西医发展对照时间轴
 * 年标优先离散校准：先标定全部年份刻度，再挂载左右事件卡。
 */
(function () {
  "use strict";

  const DATA_URL = "./data/timeline.json";

  const PAD_TOP = 48;
  const PAD_BOTTOM = 72;
  const CARD_GAP = 10;
  const YEAR_GAP = 28;
  const MIN_SLOT = 36;

  const state = {
    raw: null,
    events: [],
    allTags: [],
    filters: { side: "all", archaeology: false, search: "", tags: new Set() },
    /** draft selections inside popover (applied only on 确定) */
    draft: { archaeology: false, tags: new Set() },
    popoverOpen: false,
    activeId: null,
    yearSlots: [],
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function formatYearTick(y) {
    if (y < 0) return "前" + Math.abs(y);
    if (y === 0) return "公元1前后";
    return String(y);
  }

  function normalizeEvent(ev) {
    return {
      id: ev.id || String(ev.year) + "-" + (ev.side || "x"),
      side: ev.side === "east" ? "east" : "west",
      year: typeof ev.year === "number" ? ev.year : 0,
      yearEnd: ev.yearEnd == null ? null : ev.yearEnd,
      yearLabel: ev.yearLabel || String(ev.year),
      title: ev.title || "",
      summary: ev.summary || "",
      people: Array.isArray(ev.people) ? ev.people : [],
      works: Array.isArray(ev.works) ? ev.works : [],
      archaeology: !!ev.archaeology,
      tags: Array.isArray(ev.tags) ? ev.tags : [],
      confidence: ev.confidence || "high",
      sources: Array.isArray(ev.sources) ? ev.sources : [],
    };
  }

  function matchesFilters(ev) {
    const f = state.filters;
    if (f.side !== "all" && ev.side !== f.side) return false;
    if (f.archaeology && !ev.archaeology) return false;
    if (f.tags.size > 0) {
      const has = [...f.tags].every((t) => ev.tags.includes(t));
      if (!has) return false;
    }
    if (f.search) {
      const q = f.search.trim().toLowerCase();
      if (q) {
        const hay = [
          ev.title,
          ev.summary,
          ev.yearLabel,
          ...ev.people,
          ...ev.works,
          ...ev.tags,
          ...ev.sources,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
    }
    return true;
  }

  function advancedFilterCount() {
    return state.filters.tags.size + (state.filters.archaeology ? 1 : 0);
  }

  function syncFilterBadge() {
    const btn = $("#filter-popover-btn");
    const badge = $("#filter-badge");
    if (!btn || !badge) return;
    const count = advancedFilterCount();
    btn.classList.toggle("has-active", count > 0);
    if (count > 0) {
      badge.hidden = false;
      badge.textContent = String(count);
      badge.setAttribute("aria-hidden", "false");
    } else {
      badge.hidden = true;
      badge.setAttribute("aria-hidden", "true");
    }
  }

  function collectTags(events) {
    const set = new Set();
    events.forEach((e) => e.tags.forEach((t) => set.add(t)));
    return [...set].sort((a, b) => a.localeCompare(b, "zh-Hans"));
  }

  function syncDraftChips() {
    $$(".tag-chip", $("#tag-filters")).forEach((chip) => {
      const tag = chip.getAttribute("data-tag");
      chip.classList.toggle("active", state.draft.tags.has(tag));
    });
    const arch = $("#draft-archaeology");
    if (arch) arch.checked = state.draft.archaeology;
  }

  function buildTagFilters(tags) {
    const wrap = $("#tag-filters");
    if (!wrap) return;
    state.allTags = tags;
    if (!tags.length) {
      wrap.innerHTML = '<span class="tag-filters-label">暂无标签</span>';
      return;
    }
    wrap.innerHTML = tags
      .map(
        (t) =>
          `<button type="button" class="tag-chip${state.draft.tags.has(t) ? " active" : ""}" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`
      )
      .join("");
  }

  function setPopoverOpen(open) {
    const btn = $("#filter-popover-btn");
    const panel = $("#filter-popover");
    if (!btn || !panel) return;
    state.popoverOpen = !!open;
    if (open) {
      // sync draft from applied filters when opening
      state.draft.archaeology = state.filters.archaeology;
      state.draft.tags = new Set(state.filters.tags);
      syncDraftChips();
      panel.removeAttribute("hidden");
    } else {
      panel.setAttribute("hidden", "");
    }
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.classList.toggle("open", !!open);
  }

  function applyDraftAndClose() {
    state.filters.archaeology = state.draft.archaeology;
    state.filters.tags = new Set(state.draft.tags);
    setPopoverOpen(false);
    syncFilterBadge();
    render();
  }

  function clearDraft() {
    state.draft.archaeology = false;
    state.draft.tags = new Set();
    syncDraftChips();
  }

  function cardHtml(ev) {
    const peopleChips = ev.people
      .slice(0, 2)
      .map((p) => `<span class="chip person">${escapeHtml(p)}</span>`)
      .join("");
    const workChips = ev.works
      .slice(0, 1)
      .map((w) => `<span class="chip work">${escapeHtml(w)}</span>`)
      .join("");
    const arch = ev.archaeology
      ? `<span class="badge-arch" title="有考古证据">考古</span>`
      : "";
    const conf =
      ev.confidence === "low" || ev.confidence === "medium"
        ? `<p class="confidence-hint">可信度：${ev.confidence === "low" ? "较低" : "中等"}</p>`
        : "";
    return `
      <article class="event-card ${ev.side}" data-id="${escapeAttr(ev.id)}" data-year="${ev.year}" tabindex="0" role="button" aria-label="${escapeAttr(ev.title)}">
        <span class="event-dot" aria-hidden="true"></span>
        <p class="card-year">${escapeHtml(ev.yearLabel)}${arch}</p>
        <h2 class="card-title">${escapeHtml(ev.title)}</h2>
        <p class="card-summary">${escapeHtml(ev.summary)}</p>
        ${peopleChips || workChips ? `<div class="card-chips">${peopleChips}${workChips}</div>` : ""}
        ${conf}
      </article>`;
  }

  /**
   * Year-first discrete calibration:
   * 1. Collect sorted unique years from visible events
   * 2. Mark each year as a slot on the axis
   * 3. Attach west (left) / east (right) cards stacked within that year's slot
   * Slot height = content-aware: max(west stack, east stack) + YEAR_GAP
   * No continuous piecewise year→px; no collision push that breaks year order.
   */
  function layoutCards(visible) {
    const track = $("#timeline-track");
    const layer = $("#events-layer");
    const ruler = $("#year-ruler");

    // Group by year
    const byYear = new Map();
    visible.forEach((ev) => {
      if (!byYear.has(ev.year)) byYear.set(ev.year, { west: [], east: [] });
      byYear.get(ev.year)[ev.side].push(ev);
    });

    const years = [...byYear.keys()].sort((a, b) => a - b);

    // Sort cards within each side for stable order
    years.forEach((y) => {
      const g = byYear.get(y);
      g.west.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans"));
      g.east.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans"));
    });

    // Flat list in year order for DOM
    const flat = [];
    years.forEach((y) => {
      const g = byYear.get(y);
      g.west.forEach((ev) => flat.push(ev));
      g.east.forEach((ev) => flat.push(ev));
    });

    layer.innerHTML = flat.map((ev) => cardHtml(ev)).join("");
    const cards = $$(".event-card", layer);
    const cardMap = new Map();
    flat.forEach((ev, i) => {
      cardMap.set(ev.id, { ev, el: cards[i], h: cards[i].offsetHeight || 72 });
    });

    // Assign slots: content-aware height per year
    const slots = [];
    let cursor = PAD_TOP;

    years.forEach((y) => {
      const g = byYear.get(y);
      const westItems = g.west.map((ev) => cardMap.get(ev.id));
      const eastItems = g.east.map((ev) => cardMap.get(ev.id));

      const stackH = (items) => {
        if (!items.length) return 0;
        return items.reduce((s, it) => s + it.h, 0) + CARD_GAP * (items.length - 1);
      };

      const westH = stackH(westItems);
      const eastH = stackH(eastItems);
      const contentH = Math.max(westH, eastH, MIN_SLOT);
      const slotTop = cursor;
      const tickY = slotTop + 14; // near top of slot, aligns with first card year line

      // Place west cards stacked from slotTop
      let wy = slotTop;
      westItems.forEach((it) => {
        it.el.style.top = wy + "px";
        wy += it.h + CARD_GAP;
      });

      // Place east cards stacked from slotTop
      let ey = slotTop;
      eastItems.forEach((it) => {
        it.el.style.top = ey + "px";
        ey += it.h + CARD_GAP;
      });

      slots.push({ year: y, top: slotTop, height: contentH, tickY });
      cursor = slotTop + contentH + YEAR_GAP;
    });

    state.yearSlots = slots;
    const trackHeight = Math.max(200, cursor - YEAR_GAP + PAD_BOTTOM);
    track.style.height = trackHeight + "px";

    // Axis ticks: all years get a tick; label every year when sparse enough,
    // or subsample labels when slots are very tight (always keep major labels)
    buildYearRuler(slots);
  }

  function buildYearRuler(slots) {
    const ruler = $("#year-ruler");
    if (!slots.length) {
      ruler.innerHTML = "";
      return;
    }

    // Label strategy: always show label; if consecutive ticks are < 22px apart,
    // only keep every Nth label as major, others as tiny ticks without text.
    const MIN_LABEL_GAP = 22;
    const labeled = [];
    let lastLabelY = -Infinity;

    slots.forEach((s, i) => {
      const showLabel = s.tickY - lastLabelY >= MIN_LABEL_GAP || i === 0 || i === slots.length - 1;
      if (showLabel) lastLabelY = s.tickY;
      labeled.push({ ...s, showLabel });
    });

    // Ensure first/last always labeled
    if (labeled.length) {
      labeled[0].showLabel = true;
      labeled[labeled.length - 1].showLabel = true;
    }

    ruler.innerHTML = labeled
      .map((s) => {
        const cls = s.showLabel ? "ruler-tick major" : "ruler-tick";
        const text = s.showLabel ? formatYearTick(s.year) : "";
        const title = formatYearTick(s.year);
        return `<div class="${cls}" style="top:${s.tickY}px" title="${escapeAttr(title)}">${text}</div>`;
      })
      .join("");
  }

  function render() {
    const visible = state.events.filter(matchesFilters);
    const empty = $("#empty-state");
    empty.hidden = visible.length > 0;
    if (visible.length === 0) {
      $("#events-layer").innerHTML = "";
      $("#year-ruler").innerHTML = "";
      $("#timeline-track").style.height = "120px";
      state.yearSlots = [];
      syncFilterBadge();
      return;
    }
    layoutCards(visible);
    syncFilterBadge();
  }

  function openDetail(id) {
    const ev = state.events.find((e) => e.id === id);
    if (!ev) return;
    state.activeId = id;
    const panel = $("#detail-panel");
    const sideEl = $("#detail-side");
    sideEl.textContent = ev.side === "west" ? "西方医学" : "中国传统医学";
    sideEl.className = "detail-side-badge " + ev.side;
    $("#detail-year").textContent = ev.yearLabel;
    $("#detail-title").textContent = ev.title;
    $("#detail-summary").textContent = ev.summary;

    fillList("detail-people", "detail-people-sec", ev.people);
    fillList("detail-works", "detail-works-sec", ev.works);
    fillList("detail-sources", "detail-sources-sec", ev.sources);

    const tagsSec = $("#detail-tags-sec");
    const tagsEl = $("#detail-tags");
    if (ev.tags.length) {
      tagsSec.hidden = false;
      tagsEl.innerHTML = ev.tags
        .map((t) => `<span class="chip">${escapeHtml(t)}</span>`)
        .join("");
    } else {
      tagsSec.hidden = true;
    }

    const confMap = { high: "高", medium: "中等", low: "较低" };
    const bits = [
      ev.archaeology ? "含考古证据" : null,
      "可信度：" + (confMap[ev.confidence] || ev.confidence),
    ].filter(Boolean);
    $("#detail-meta").textContent = bits.join(" · ");

    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    $("#detail-close").focus();
  }

  function fillList(ulId, secId, items) {
    const sec = $("#" + secId);
    const ul = $("#" + ulId);
    if (!items.length) {
      sec.hidden = true;
      ul.innerHTML = "";
      return;
    }
    sec.hidden = false;
    ul.innerHTML = items.map((x) => `<li>${escapeHtml(x)}</li>`).join("");
  }

  function closeDetail() {
    const panel = $("#detail-panel");
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    state.activeId = null;
  }

  function bindFilters() {
    $$(".filter-btn[data-side]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".filter-btn[data-side]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.filters.side = btn.getAttribute("data-side");
        render();
      });
    });

    let searchTimer;
    $("#filter-search").addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.filters.search = e.target.value;
        render();
      }, 160);
    });
  }

  function bindPopover() {
    const btn = $("#filter-popover-btn");
    const panel = $("#filter-popover");
    const wrap = $("#filter-popover-wrap");
    if (!btn || !panel || !wrap) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setPopoverOpen(!state.popoverOpen);
    });

    // Tag chips: toggle draft only
    panel.addEventListener("click", (e) => {
      e.stopPropagation();
      const chip = e.target.closest(".tag-chip");
      if (chip) {
        const tag = chip.getAttribute("data-tag");
        if (state.draft.tags.has(tag)) state.draft.tags.delete(tag);
        else state.draft.tags.add(tag);
        chip.classList.toggle("active", state.draft.tags.has(tag));
        return;
      }
    });

    $("#draft-archaeology").addEventListener("change", (e) => {
      state.draft.archaeology = e.target.checked;
    });
    $("#draft-archaeology").addEventListener("click", (e) => e.stopPropagation());

    $("#filter-confirm").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      applyDraftAndClose();
    });

    $("#filter-clear").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearDraft();
    });

    document.addEventListener("click", (e) => {
      if (!state.popoverOpen) return;
      if (wrap.contains(e.target)) return;
      setPopoverOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const detail = $("#detail-panel");
      if (detail && detail.classList.contains("open")) return;
      if (state.popoverOpen) setPopoverOpen(false);
    });
  }

  function bindCards() {
    $("#events-layer").addEventListener("click", (e) => {
      const card = e.target.closest(".event-card");
      if (card) openDetail(card.getAttribute("data-id"));
    });
    $("#events-layer").addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".event-card");
      if (!card) return;
      e.preventDefault();
      openDetail(card.getAttribute("data-id"));
    });
  }

  function bindDetail() {
    $("#detail-close").addEventListener("click", closeDetail);
    $("#detail-backdrop").addEventListener("click", closeDetail);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const panel = $("#detail-panel");
        if (panel && panel.classList.contains("open")) closeDetail();
      }
    });
  }

  function applyMeta(meta) {
    if (!meta) return;
    if (meta.title) {
      $("#site-title").textContent = meta.title;
      document.title = meta.title;
    }
    const parts = [];
    if (meta.from != null && meta.to != null) {
      parts.push(`范围：${meta.from} — ${meta.to}`);
    }
    if (meta.updated) parts.push(`更新：${meta.updated}`);
    $("#site-subtitle").textContent = parts.join(" · ");
    $("#footer-meta").textContent = meta.updated
      ? `数据更新于 ${meta.updated} · 本地静态部署`
      : "本地静态部署";
  }

  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  async function init() {
    bindFilters();
    bindPopover();
    bindCards();
    bindDetail();
    // Default: popover closed
    setPopoverOpen(false);
    syncFilterBadge();

    try {
      const res = await fetch(DATA_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      state.raw = data;
      state.events = (data.events || [])
        .map(normalizeEvent)
        .sort((a, b) => a.year - b.year || a.title.localeCompare(b.title, "zh-Hans"));
      applyMeta(data.meta);
      buildTagFilters(collectTags(state.events));
      render();
      window.addEventListener("resize", debounce(render, 200));
    } catch (err) {
      console.error(err);
      $("#load-error").hidden = false;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
