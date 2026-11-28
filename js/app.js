/**
 * 中西医发展对照时间轴
 *
 * 纵轴规则：
 * 1. 只为「当前筛选下有事件」的年份建一行，没有资料的年份不出现。
 * 2. 行按历史 year 排序，可切换升序 / 降序；同一年西、东事件在同一行左右对照。
 * 3. 同一年同一侧的多条事件在该行内按数据原顺序叠放。
 * 4. 轴上的年是历史 year，不是考古 foundDate。
 */
(function () {
  "use strict";

  const DATA_URL = "./data/timeline.json";
  const LANG_KEY = "med-timeline-lang";

  const SORT_KEY = "med-timeline-sort";

  const FIND_FIELDS = [
    ["foundDate", "colFound"],
    ["foundSite", "colSite"],
    ["material", "colMaterial"],
    ["repository", "colRepo"],
    ["openAccess", "colOpen"],
    ["address", "colAddr"],
  ];

  const UI = {
    zh: {
      title: "中西医发展对照时间轴",
      subtitle: "只列出有资料的年份 · 可切换时间先后 · 考古资料见表与详情",
      sortAsc: "时间：由远及近",
      sortDesc: "时间：由近及远",
      sortTitle: "切换时间排序",
      refsTitle: "参考文献",
      refsNote: "著录格式依据 GB/T 7714—2025《信息与文献 参考文献著录规则》",
      refsLabel: "参考文献",
      imgCredit: "图片",
      imgSource: "来源：Wikimedia Commons",
      all: "全部",
      west: "西方医学",
      east: "中国传统医学",
      search: "搜索标题、摘要、人物…",
      filter: "筛选",
      filterDialog: "高级筛选",
      archOnly: "仅考古证据",
      tagsLabel: "标签",
      noTags: "暂无标签",
      clear: "清除",
      confirm: "确定",
      legendWest: "西方医学",
      legendAxis: "时间轴",
      legendEast: "中国传统医学",
      empty: "没有符合条件的事件。",
      loadError: "无法加载时间轴数据，请检查 data/timeline.json。",
      findsTitle: "考古发现",
      findsNote: "仅考古条目 · 历史年 ≠ 发现时间 · 空格表示暂无依据",
      scrollHint: "表格可左右滑动查看全部列。",
      findsEmpty: "没有符合条件的考古条目。",
      colSide: "侧别",
      colYear: "历史年",
      colFound: "发现时间",
      colSite: "发现地",
      colMaterial: "内容",
      colRepo: "收藏地",
      colOpen: "开放",
      colAddr: "地址",
      archSection: "考古资料",
      people: "相关人物",
      works: "相关著作",
      tags: "标签",
      sources: "来源",
      close: "关闭",
      archBadge: "考古",
      archBadgeTitle: "有考古证据",
      missingEn: "暂无英文",
      sideGroup: "侧别",
      searchRole: "筛选",
      langGroup: "语言",
      open_open: "开放",
      open_closed: "不开放",
      open_appointment: "预约",
      confHigh: "高",
      confMed: "中等",
      confLow: "较低",
      confLabel: "可信度：",
      hasArch: "含考古证据",
      tickZero: "公元前后",
      footer: function (meta) {
        const bits = [];
        if (meta && meta.updated) bits.push("数据更新于 " + meta.updated);
        if (meta && meta.from != null && meta.to != null) {
          const from = meta.from === "prehistoric" ? "史前" : meta.from;
          bits.push("范围：" + from + " — " + meta.to);
        }
        bits.push("本地静态部署");
        return bits.join(" · ");
      },
    },
    en: {
      title: "A Comparative Timeline of Chinese and Western Medicine",
      subtitle: "Only years with records are shown · Toggle chronological order · Archaeology lives in the table and detail pane",
      sortAsc: "Oldest first",
      sortDesc: "Newest first",
      sortTitle: "Toggle chronological order",
      refsTitle: "References",
      refsNote: "Formatted according to GB/T 7714—2025, Information and documentation — Rules for bibliographic references",
      refsLabel: "References",
      imgCredit: "Image",
      imgSource: "Source: Wikimedia Commons",
      all: "All",
      west: "Western medicine",
      east: "Traditional Chinese Medicine",
      search: "Search titles, summaries, people…",
      filter: "Filters",
      filterDialog: "Filters",
      archOnly: "Archaeology only",
      tagsLabel: "Tags",
      noTags: "No tags",
      clear: "Clear",
      confirm: "Apply",
      legendWest: "Western medicine",
      legendAxis: "Timeline",
      legendEast: "Traditional Chinese Medicine",
      empty: "No events match.",
      loadError: "Could not load timeline data. Check data/timeline.json.",
      findsTitle: "Archaeological finds",
      findsNote: "Archaeology rows only · Axis year ≠ find date · Blank = no sourced value",
      scrollHint: "Swipe sideways to see every column.",
      findsEmpty: "No archaeological entries match.",
      colSide: "Side",
      colYear: "Axis year",
      colFound: "Found",
      colSite: "Site",
      colMaterial: "Material",
      colRepo: "Repository",
      colOpen: "Open",
      colAddr: "Address",
      archSection: "Archaeological record",
      people: "People",
      works: "Works",
      tags: "Tags",
      sources: "Sources",
      close: "Close",
      archBadge: "Archaeology",
      archBadgeTitle: "Archaeological evidence",
      missingEn: "暂无英文",
      sideGroup: "Side",
      searchRole: "Search",
      langGroup: "Language",
      open_open: "Open",
      open_closed: "Closed",
      open_appointment: "By appointment",
      confHigh: "high",
      confMed: "medium",
      confLow: "low",
      confLabel: "Confidence: ",
      hasArch: "Includes archaeological evidence",
      tickZero: "1 BCE/CE",
      footer: function (meta) {
        const bits = [];
        if (meta && meta.updated) bits.push("Updated " + meta.updated);
        if (meta && meta.from != null && meta.to != null) {
          bits.push("Range: " + meta.from + " – " + meta.to);
        }
        bits.push("Local static site");
        return bits.join(" · ");
      },
    },
  };

  const state = {
    raw: null,
    events: [],
    allTags: [],
    tagEn: new Map(),
    filters: { side: "all", archaeology: false, search: "", tags: new Set() },
    draft: { archaeology: false, tags: new Set() },
    popoverOpen: false,
    activeId: null,
    lang: "zh",
    sort: "asc",
    refs: [],
    refIndex: new Map(),
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function t(key) {
    const pack = UI[state.lang] || UI.zh;
    const val = pack[key] != null ? pack[key] : UI.zh[key];
    return val == null ? key : val;
  }

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

  function initialLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "zh" || saved === "en") return saved;
    } catch (err) {
      /* private mode */
    }
    const htmlLang = (document.documentElement.lang || "").toLowerCase();
    if (htmlLang.startsWith("en")) return "en";
    return "zh";
  }

  function formatTick(year) {
    if (year === 0) return t("tickZero");
    if (year < 0) {
      return state.lang === "en" ? Math.abs(year) + " BCE" : "前" + Math.abs(year);
    }
    return String(year);
  }

  /**
   * Sort by historical year ascending. Warn if the file was not already ordered
   * so a later data edit cannot silently unsort the display. Same-year events
   * keep their original order (not a title sort, which would reshuffle when
   * the language changes).
   */
  function ensureChronological(events) {
    let inOrder = true;
    for (let i = 1; i < events.length; i++) {
      if (events[i].year < events[i - 1].year) {
        inOrder = false;
        break;
      }
    }
    if (!inOrder) {
      console.warn(
        "[med-timeline] data/timeline.json is not sorted by year ascending. Sorting before layout. Keep the file in chronological order."
      );
    }
    return events
      .map(function (ev, i) {
        ev._i = i;
        return ev;
      })
      .sort(function (a, b) {
        return a.year - b.year || a._i - b._i;
      });
  }

  function normalizeEvent(ev) {
    return {
      id: ev.id || String(ev.year) + "-" + (ev.side || "x"),
      side: ev.side === "east" ? "east" : "west",
      year: typeof ev.year === "number" ? ev.year : 0,
      yearEnd: ev.yearEnd == null ? null : ev.yearEnd,
      yearLabel: ev.yearLabel || String(ev.year),
      yearLabel_en: ev.yearLabel_en || "",
      title: ev.title || "",
      title_en: ev.title_en || "",
      summary: ev.summary || "",
      summary_en: ev.summary_en || "",
      people: Array.isArray(ev.people) ? ev.people : [],
      people_en: Array.isArray(ev.people_en) ? ev.people_en : [],
      works: Array.isArray(ev.works) ? ev.works : [],
      works_en: Array.isArray(ev.works_en) ? ev.works_en : [],
      archaeology: !!ev.archaeology,
      tags: Array.isArray(ev.tags) ? ev.tags : [],
      tags_en: Array.isArray(ev.tags_en) ? ev.tags_en : [],
      confidence: ev.confidence || "high",
      sources: Array.isArray(ev.sources) ? ev.sources : [],
      sources_en: Array.isArray(ev.sources_en) ? ev.sources_en : [],
      foundDate: ev.foundDate || "",
      foundDate_en: ev.foundDate_en || "",
      foundSite: ev.foundSite || "",
      foundSite_en: ev.foundSite_en || "",
      material: ev.material || "",
      material_en: ev.material_en || "",
      repository: ev.repository || "",
      repository_en: ev.repository_en || "",
      openAccess: ev.openAccess || "",
      address: ev.address || "",
      address_en: ev.address_en || "",
      refs: Array.isArray(ev.refs) ? ev.refs : [],
      image: ev.image && ev.image.src ? ev.image : null,
    };
  }

  function hasEnglishBody(ev) {
    return !!(String(ev.title_en || "").trim() && String(ev.summary_en || "").trim());
  }

  function fieldText(ev, key) {
    if (state.lang === "en") {
      const en = ev[key + "_en"];
      if (en != null && String(en).trim() !== "") return String(en);
    }
    return ev[key] != null ? String(ev[key]) : "";
  }

  function listText(ev, key) {
    const zh = Array.isArray(ev[key]) ? ev[key] : [];
    if (state.lang !== "en") return zh;
    const en = ev[key + "_en"];
    if (Array.isArray(en) && en.length === zh.length && en.every(function (x) { return String(x).trim(); })) {
      return en;
    }
    return zh;
  }

  function tagLabel(tag) {
    if (state.lang !== "en") return tag;
    return state.tagEn.get(tag) || tag;
  }

  function openAccessLabel(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    const label = t("open_" + value);
    return label === "open_" + value ? value : label;
  }

  function findFieldValue(ev, key) {
    if (key === "openAccess") return openAccessLabel(ev.openAccess);
    return fieldText(ev, key).trim();
  }

  function findRows(ev) {
    return FIND_FIELDS.map(function (pair) {
      return { key: pair[0], labelKey: pair[1], value: findFieldValue(ev, pair[0]) };
    }).filter(function (row) {
      return row.value !== "";
    });
  }

  function matchesFilters(ev) {
    const f = state.filters;
    if (f.side !== "all" && ev.side !== f.side) return false;
    if (f.archaeology && !ev.archaeology) return false;
    if (f.tags.size > 0) {
      const has = Array.from(f.tags).every(function (tag) { return ev.tags.includes(tag); });
      if (!has) return false;
    }
    if (f.search) {
      const q = f.search.trim().toLowerCase();
      if (q) {
        const hay = [
          ev.title, ev.title_en, ev.summary, ev.summary_en,
          ev.yearLabel, ev.yearLabel_en,
          ev.foundDate, ev.foundDate_en, ev.foundSite, ev.foundSite_en,
          ev.material, ev.material_en, ev.repository, ev.repository_en,
          ev.address, ev.address_en, ev.openAccess,
        ]
          .concat(ev.people, ev.people_en, ev.works, ev.works_en, ev.tags, ev.tags_en, ev.sources, ev.sources_en)
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
    events.forEach(function (e) { e.tags.forEach(function (tag) { set.add(tag); }); });
    return Array.from(set).sort(function (a, b) {
      return tagLabel(a).localeCompare(tagLabel(b), state.lang === "en" ? "en" : "zh-Hans");
    });
  }

  function indexTagTranslations(events) {
    const map = new Map();
    events.forEach(function (ev) {
      if (!Array.isArray(ev.tags_en) || ev.tags_en.length !== ev.tags.length) return;
      ev.tags.forEach(function (tag, i) {
        if (ev.tags_en[i] && !map.has(tag)) map.set(tag, ev.tags_en[i]);
      });
    });
    state.tagEn = map;
  }

  function syncDraftChips() {
    $$(".tag-chip", $("#tag-filters")).forEach(function (chip) {
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
      wrap.innerHTML = '<span class="tag-filters-label">' + escapeHtml(t("noTags")) + "</span>";
      return;
    }
    wrap.innerHTML = tags
      .map(function (tag) {
        const active = state.draft.tags.has(tag) ? " active" : "";
        return (
          '<button type="button" class="tag-chip' + active + '" data-tag="' + escapeAttr(tag) + '">' +
          escapeHtml(tagLabel(tag)) + "</button>"
        );
      })
      .join("");
  }

  function setPopoverOpen(open) {
    const btn = $("#filter-popover-btn");
    const panel = $("#filter-popover");
    if (!btn || !panel) return;
    state.popoverOpen = !!open;
    if (open) {
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
    const people = listText(ev, "people").slice(0, 2)
      .map(function (p) { return '<span class="chip person">' + escapeHtml(p) + "</span>"; })
      .join("");
    const works = listText(ev, "works").slice(0, 1)
      .map(function (w) { return '<span class="chip work">' + escapeHtml(w) + "</span>"; })
      .join("");
    const arch = ev.archaeology
      ? '<span class="badge-arch" title="' + escapeAttr(t("archBadgeTitle")) + '">' + escapeHtml(t("archBadge")) + "</span>"
      : "";
    const conf =
      ev.confidence === "low" || ev.confidence === "medium"
        ? '<p class="confidence-hint">' + escapeHtml(t("confLabel") + (ev.confidence === "low" ? t("confLow") : t("confMed"))) + "</p>"
        : "";
    const missing = state.lang === "en" && !hasEnglishBody(ev)
      ? '<p class="missing-en">' + escapeHtml(t("missingEn")) + "</p>"
      : "";
    const title = fieldText(ev, "title");
    return (
      '<article class="event-card ' + ev.side + '" data-id="' + escapeAttr(ev.id) + '" tabindex="0" role="button" aria-label="' + escapeAttr(title) + '">' +
        '<p class="card-year">' + escapeHtml(fieldText(ev, "yearLabel")) + arch + "</p>" +
        '<h2 class="card-title">' + escapeHtml(title) + "</h2>" +
        missing +
        (ev.image ? '<img class="card-thumb" loading="lazy" alt="" src="' + escapeAttr(ev.image.thumb || ev.image.src) + '" onerror="this.remove()" />' : "") +
        '<p class="card-summary">' + escapeHtml(fieldText(ev, "summary")) + "</p>" +
        (people || works ? '<div class="card-chips">' + people + works + "</div>" : "") +
        conf +
      "</article>"
    );
  }

  /**
   * One row per year that has at least one visible event. Years without
   * records are never drawn, so there are no empty ticks or blank stretches.
   */
  function groupByYear(visible) {
    const rows = [];
    const byYear = new Map();
    visible.forEach(function (ev) {
      let row = byYear.get(ev.year);
      if (!row) {
        row = { year: ev.year, west: [], east: [] };
        byYear.set(ev.year, row);
        rows.push(row);
      }
      row[ev.side].push(ev);
    });
    rows.sort(function (a, b) { return a.year - b.year; });
    if (state.sort === "desc") rows.reverse();
    return rows;
  }

  function renderTimeline(visible) {
    const rows = groupByYear(visible);
    $("#timeline-rows").innerHTML = rows
      .map(function (row) {
        const label = formatTick(row.year);
        const cell = function (side) {
          const list = row[side];
          return '<div class="tl-cell ' + side + (list.length ? " has" : "") + '">' + list.map(cardHtml).join("") + "</div>";
        };
        return (
          '<div class="tl-row" data-year="' + row.year + '">' +
            cell("west") +
            '<div class="tl-year"><span class="tl-dot" aria-hidden="true"></span><span class="tl-year-label">' + escapeHtml(label) + "</span></div>" +
            cell("east") +
          "</div>"
        );
      })
      .join("");
  }

  function syncSortButton() {
    const btn = $("#sort-btn");
    if (!btn) return;
    btn.setAttribute("data-sort", state.sort);
    btn.setAttribute("title", t("sortTitle"));
    btn.setAttribute("aria-label", t("sortTitle"));
    $("#sort-label").textContent = t(state.sort === "desc" ? "sortDesc" : "sortAsc");
    $("#sort-icon").textContent = state.sort === "desc" ? "↑" : "↓";
  }

  function setSort(sort) {
    state.sort = sort === "desc" ? "desc" : "asc";
    try { localStorage.setItem(SORT_KEY, state.sort); } catch (err) { /* ignore */ }
    syncSortButton();
    render();
    const viewport = $("#timeline-viewport");
    if (viewport) viewport.scrollTop = 0;
  }

  function initialSort() {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      if (saved === "asc" || saved === "desc") return saved;
    } catch (err) { /* private mode */ }
    return "asc";
  }

  function renderRefs() {
    const sec = $("#refs-section");
    const list = $("#refs-list");
    if (!sec || !list) return;
    sec.hidden = state.refs.length === 0;
    list.innerHTML = state.refs
      .map(function (r, i) {
        const text = state.lang === "en" && r.text_en ? r.text_en : r.text;
        return '<li id="ref-' + escapeAttr(r.id) + '"><span class="ref-num">[' + (i + 1) + "]</span> " + escapeHtml(text) + "</li>";
      })
      .join("");
  }

  function renderFinds(visible) {
    const section = $("#finds-section");
    const body = $("#finds-body");
    const empty = $("#finds-empty");
    const wrap = $("#finds-wrap");
    const hasAny = state.events.some(function (ev) { return ev.archaeology; });
    if (!section || !body) return;
    section.hidden = !hasAny;
    if (!hasAny) return;

    const rows = visible.filter(function (ev) { return ev.archaeology; });
    empty.hidden = rows.length > 0;
    wrap.hidden = rows.length === 0;
    body.innerHTML = rows
      .map(function (ev) {
        const sideClass = ev.side === "west" ? "side-west" : "side-east";
        const cells = FIND_FIELDS.map(function (pair) {
          return "<td>" + escapeHtml(findFieldValue(ev, pair[0])) + "</td>";
        }).join("");
        const label = fieldText(ev, "title");
        return (
          '<tr tabindex="0" data-id="' + escapeAttr(ev.id) + '" role="button" aria-label="' + escapeAttr(label) + '">' +
            '<td class="' + sideClass + '">' + escapeHtml(t(ev.side === "west" ? "west" : "east")) + "</td>" +
            '<td class="year-cell">' + escapeHtml(fieldText(ev, "yearLabel")) + "</td>" +
            cells +
          "</tr>"
        );
      })
      .join("");
  }

  function render() {
    const visible = state.events.filter(matchesFilters);
    $("#empty-state").hidden = visible.length > 0;
    $("#timeline-viewport").hidden = visible.length === 0;
    renderTimeline(visible);
    renderFinds(visible);
    syncFilterBadge();
  }

  function openDetail(id) {
    const ev = state.events.find(function (e) { return e.id === id; });
    if (!ev) return;
    state.activeId = id;
    const panel = $("#detail-panel");
    const sideEl = $("#detail-side");
    sideEl.textContent = t(ev.side === "west" ? "west" : "east");
    sideEl.className = "detail-side-badge " + ev.side;
    $("#detail-year").textContent = fieldText(ev, "yearLabel");
    $("#detail-title").textContent = fieldText(ev, "title");
    $("#detail-summary").textContent = fieldText(ev, "summary");
    const fig = $("#detail-figure");
    if (fig) {
      if (ev.image) {
        const im = ev.image;
        const cap = state.lang === "en" ? (im.caption_en || im.caption) : (im.caption || im.caption_en);
        const credit = [im.author, im.license].filter(Boolean).join(" · ");
        fig.hidden = false;
        fig.innerHTML =
          '<a href="' + escapeAttr(im.page) + '" target="_blank" rel="noopener noreferrer">' +
          '<img loading="lazy" onerror="this.parentNode.style.display=\'none\'" src="' + escapeAttr(im.src) + '" alt="' + escapeAttr(cap || fieldText(ev, "title")) + '" /></a>' +
          '<figcaption>' + (cap ? escapeHtml(cap) + "<br>" : "") +
          '<span class="img-credit">' + escapeHtml(t("imgCredit") + "：" + credit) + ' · <a href="' + escapeAttr(im.page) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t("imgSource")) + "</a></span></figcaption>";
      } else {
        fig.hidden = true;
        fig.innerHTML = "";
      }
    }
    const missing = $("#detail-missing");
    const showMissing = state.lang === "en" && !hasEnglishBody(ev);
    missing.hidden = !showMissing;
    if (showMissing) missing.textContent = t("missingEn");

    const findSec = $("#detail-find-sec");
    const findEl = $("#detail-find");
    const rows = findRows(ev);
    if (rows.length) {
      findSec.hidden = false;
      findEl.innerHTML = rows
        .map(function (row) {
          return "<dt>" + escapeHtml(t(row.labelKey)) + "</dt><dd>" + escapeHtml(row.value) + "</dd>";
        })
        .join("");
    } else {
      findSec.hidden = true;
      findEl.innerHTML = "";
    }

    fillList("detail-people", "detail-people-sec", listText(ev, "people"));
    fillList("detail-works", "detail-works-sec", listText(ev, "works"));
    fillList("detail-sources", "detail-sources-sec", listText(ev, "sources"));

    const refSec = $("#detail-refs-sec");
    const refEl = $("#detail-refs");
    const nums = ev.refs
      .map(function (id) { return state.refIndex.has(id) ? state.refIndex.get(id) : null; })
      .filter(function (n) { return n != null; })
      .sort(function (a, b) { return a - b; });
    if (refSec && refEl) {
      refSec.hidden = nums.length === 0;
      refEl.innerHTML = nums.map(function (n) {
        const r = state.refs[n - 1];
        return '<a class="ref-link" href="#ref-' + escapeAttr(r.id) + '" title="' + escapeAttr(r.text) + '">[' + n + "]</a>";
      }).join(" ");
    }

    const tagsSec = $("#detail-tags-sec");
    const tagsEl = $("#detail-tags");
    const tags = listText(ev, "tags");
    if (tags.length) {
      tagsSec.hidden = false;
      tagsEl.innerHTML = tags.map(function (tag) {
        return '<span class="chip">' + escapeHtml(tag) + "</span>";
      }).join("");
    } else {
      tagsSec.hidden = true;
    }

    const confMap = { high: t("confHigh"), medium: t("confMed"), low: t("confLow") };
    const bits = [
      ev.archaeology ? t("hasArch") : null,
      t("confLabel") + (confMap[ev.confidence] || ev.confidence),
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
    ul.innerHTML = items.map(function (x) { return "<li>" + escapeHtml(x) + "</li>"; }).join("");
  }

  function closeDetail() {
    const panel = $("#detail-panel");
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    state.activeId = null;
  }

  function applyChrome() {
    document.documentElement.lang = state.lang === "en" ? "en" : "zh-Hans";
    document.title = t("title");
    $$("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      const val = t(key);
      if (typeof val === "string") el.textContent = val;
    });
    $$("[data-i18n-placeholder]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-placeholder");
      const val = t(key);
      if (typeof val === "string") el.setAttribute("placeholder", val);
    });
    const closeBtn = $("#detail-close");
    if (closeBtn) closeBtn.setAttribute("aria-label", t("close"));
    const langSwitch = $("#lang-switch");
    if (langSwitch) langSwitch.setAttribute("aria-label", t("langGroup"));
    const filters = $(".filters");
    if (filters) filters.setAttribute("aria-label", t("searchRole"));
    const sideGroup = $(".side-filters");
    if (sideGroup) sideGroup.setAttribute("aria-label", t("sideGroup"));
    const dialog = $("#filter-popover");
    if (dialog) dialog.setAttribute("aria-label", t("filterDialog"));
    $$(".lang-btn").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === state.lang ? "true" : "false");
    });
    const footer = t("footer");
    $("#footer-meta").textContent = typeof footer === "function" ? footer(state.raw && state.raw.meta) : "";
  }

  function setLang(lang) {
    if (lang !== "zh" && lang !== "en") return;
    state.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (err) {
      /* ignore */
    }
    const viewport = $("#timeline-viewport");
    const top = viewport ? viewport.scrollTop : 0;
    applyChrome();
    syncSortButton();
    buildTagFilters(collectTags(state.events));
    render();
    renderRefs();
    if (viewport) viewport.scrollTop = top;
    if (state.activeId) openDetail(state.activeId);
  }

  function bindFilters() {
    $$(".filter-btn[data-side]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".filter-btn[data-side]").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        state.filters.side = btn.getAttribute("data-side");
        render();
      });
    });

    const sortBtn = $("#sort-btn");
    if (sortBtn) {
      sortBtn.addEventListener("click", function () {
        setSort(state.sort === "asc" ? "desc" : "asc");
      });
    }

    let searchTimer;
    $("#filter-search").addEventListener("input", function (e) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
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

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      setPopoverOpen(!state.popoverOpen);
    });

    panel.addEventListener("click", function (e) {
      e.stopPropagation();
      const chip = e.target.closest(".tag-chip");
      if (!chip) return;
      const tag = chip.getAttribute("data-tag");
      if (state.draft.tags.has(tag)) state.draft.tags.delete(tag);
      else state.draft.tags.add(tag);
      chip.classList.toggle("active", state.draft.tags.has(tag));
    });

    $("#draft-archaeology").addEventListener("change", function (e) {
      state.draft.archaeology = e.target.checked;
    });
    $("#draft-archaeology").addEventListener("click", function (e) { e.stopPropagation(); });

    $("#filter-confirm").addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      applyDraftAndClose();
    });

    $("#filter-clear").addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      clearDraft();
    });

    document.addEventListener("click", function (e) {
      if (!state.popoverOpen) return;
      if (wrap.contains(e.target)) return;
      setPopoverOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      const detail = $("#detail-panel");
      if (detail && detail.classList.contains("open")) return;
      if (state.popoverOpen) setPopoverOpen(false);
    });
  }

  function bindLang() {
    $$(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });
  }

  function bindCards() {
    const rows = $("#timeline-rows");
    rows.addEventListener("click", function (e) {
      const card = e.target.closest(".event-card");
      if (card) openDetail(card.getAttribute("data-id"));
    });
    rows.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".event-card");
      if (!card) return;
      e.preventDefault();
      openDetail(card.getAttribute("data-id"));
    });
  }

  function bindRefLinks() {
    const box = $("#detail-refs");
    if (!box) return;
    box.addEventListener("click", function (e) {
      const link = e.target.closest(".ref-link");
      if (!link) return;
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      closeDetail();
      if (target) {
        target.classList.add("flash");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(function () { target.classList.remove("flash"); }, 1600);
      }
    });
  }

  function bindFinds() {
    const body = $("#finds-body");
    if (!body) return;
    body.addEventListener("click", function (e) {
      const row = e.target.closest("tr[data-id]");
      if (row) openDetail(row.getAttribute("data-id"));
    });
    body.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const row = e.target.closest("tr[data-id]");
      if (!row) return;
      e.preventDefault();
      openDetail(row.getAttribute("data-id"));
    });
  }

  function bindDetail() {
    $("#detail-close").addEventListener("click", closeDetail);
    $("#detail-backdrop").addEventListener("click", closeDetail);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        const panel = $("#detail-panel");
        if (panel && panel.classList.contains("open")) closeDetail();
      }
    });
  }

  async function init() {
    state.lang = initialLang();
    state.sort = initialSort();
    applyChrome();
    syncSortButton();
    bindFilters();
    bindPopover();
    bindLang();
    bindCards();
    bindFinds();
    bindDetail();
    bindRefLinks();
    setPopoverOpen(false);
    syncFilterBadge();

    try {
      const res = await fetch(DATA_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      state.raw = data;
      state.events = ensureChronological((data.events || []).map(normalizeEvent));
      state.refs = Array.isArray(data.references) ? data.references.filter(function (r) { return r && r.id && r.text; }) : [];
      state.refIndex = new Map(state.refs.map(function (r, i) { return [r.id, i + 1]; }));
      indexTagTranslations(state.events);
      applyChrome();
      buildTagFilters(collectTags(state.events));
      render();
      renderRefs();
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
