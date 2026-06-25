const siteContent = window.SITE_CONTENT;
const siteLanguage = window.SITE_LANGUAGE;

if (!siteContent) {
  throw new Error("SITE_CONTENT is missing. Check content/site-content.js.");
}

if (!siteLanguage) {
  throw new Error("SITE_LANGUAGE is missing. Check content/site-content.js.");
}

const pageType = document.body.dataset.page || "home";
let materialsCache = null;
let siteDataCache = null;
let materialsSearchQuery = "";
const openAdvisorGroups = new Set();

const RESOURCE_LABELS = {
  "预告推送": { zh: "预告推送", en: "Preview Post" },
  "分享会回放": { zh: "分享会回放", en: "Recording" },
  "资料存档": { zh: "资料存档", en: "Archive" },
  "共享文档": { zh: "共享文档", en: "Shared Document" },
  "回顾推送": { zh: "回顾推送", en: "Recap Post" },
  "总结推送": { zh: "总结推送", en: "Summary Post" },
  "推送链接": { zh: "推送链接", en: "Post Link" },
};

const TITLE_FALLBACKS = {
  "夏季学期高阶课workshop": {
    zh: "夏季学期高阶课工作坊",
    en: "Summer Advanced Courses Workshop",
  },
};

const DAY_TRANSLATIONS = {
  Monday: { zh: "周一", en: "Monday" },
  Tuesday: { zh: "周二", en: "Tuesday" },
  Wednesday: { zh: "周三", en: "Wednesday" },
  Thursday: { zh: "周四", en: "Thursday" },
  "周一": { zh: "周一", en: "Monday" },
  "周二": { zh: "周二", en: "Tuesday" },
  "周三": { zh: "周三", en: "Wednesday" },
  "周四": { zh: "周四", en: "Thursday" },
};

const isLocalizedValue = (value) => siteLanguage.isLocalizedValue(value);

const resolveText = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (isLocalizedValue(value)) {
    const lang = siteLanguage.getCurrentLanguage();
    return value[lang] ?? value.zh ?? value.en ?? "";
  }

  return value;
};

const normalizeSearchText = (value) => resolveText(value).trim().toLowerCase();

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined && text !== null) {
    element.textContent = resolveText(text);
  }
  return element;
};

const getById = (id) => document.getElementById(id);

const fillText = (element, value) => {
  if (!element) {
    return;
  }

  const text = resolveText(value);
  element.textContent = text;

  if (text) {
    element.hidden = false;
    return;
  }

  element.hidden = true;
};

const createContentElement = (tag, className, value) => {
  const element = createElement(tag, className);
  fillText(element, value);
  return element;
};

const setText = (id, value) => {
  fillText(getById(id), value);
};

const toggleParentHidden = (id, ...values) => {
  const element = getById(id);
  if (!element || !element.parentElement) {
    return;
  }

  const hasContent = values.some((value) => Boolean(resolveText(value)));
  element.parentElement.hidden = !hasContent;
};

const getResourceLabel = (label) => RESOURCE_LABELS[label] || { zh: label, en: label };

const parseTitlePair = (rawTitle) => {
  const cleanTitle = rawTitle.replace(/<[^>]+>/g, " ").trim();
  const matched = cleanTitle.match(/^(.*?)\s*(?:\|\s*|\-\s*)\*([^*]+)\*\s*$/);
  if (matched) {
    return {
      zh: matched[1].trim(),
      en: matched[2].trim(),
    };
  }

  return TITLE_FALLBACKS[cleanTitle] || {
    zh: cleanTitle,
    en: cleanTitle,
  };
};

const parseNoteSuffix = (suffix) => {
  const trimmed = suffix.trim();
  if (!trimmed) {
    return null;
  }

  return {
    zh: trimmed,
    en: trimmed.replace("提取码", "Code"),
  };
};

const isMarkdownDividerRow = (line) => /^(\|\s*:?-+:?\s*)+\|?$/.test(line);

const parseMarkdownTableRow = (line) => line
  .split("|")
  .slice(1, -1)
  .map((cell) => cell.trim());

const parseMarkdownCellList = (cell) => cell
  .split(/<br\s*\/?>/i)
  .map((entry) => entry.trim())
  .filter(Boolean);

const parseWorkshopMarkdown = (markdown) => {
  const items = [];
  const lines = markdown.split(/\r?\n/);
  let currentItem = null;

  const pushCurrentItem = () => {
    if (!currentItem) {
      return;
    }

    const availableLinks = currentItem.links.filter((entry) => entry.href);

    items.push({
      week: currentItem.date,
      title: currentItem.title,
      links: availableLinks.map((entry) => ({
        label: entry.note
          ? {
              zh: `${entry.label.zh}（${entry.note.zh}）`,
              en: `${entry.label.en} (${entry.note.en})`,
            }
          : entry.label,
        href: entry.href,
        external: true,
      })),
    });

    currentItem = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const headingMatch = trimmed.match(/^###\s+(\d{4}\/\d{1,2}\/\d{1,2})\s*<br>(.+)$/i);
    if (headingMatch) {
      pushCurrentItem();
      currentItem = {
        date: headingMatch[1],
        title: parseTitlePair(headingMatch[2]),
        links: [],
      };
      return;
    }

    if (!currentItem) {
      return;
    }

    const linkedResource = trimmed.match(/^\+\s+\[(.+?)\]\((.*?)\)\s*(.*)$/);
    if (linkedResource) {
      currentItem.links.push({
        label: getResourceLabel(linkedResource[1].trim()),
        href: linkedResource[2].trim(),
        note: parseNoteSuffix(linkedResource[3] || ""),
      });
      return;
    }

    const plainResource = trimmed.match(/^\+\s+(.+)$/);
    if (plainResource) {
      currentItem.links.push({
        label: getResourceLabel(plainResource[1].trim()),
        href: "",
        note: null,
      });
    }
  });

  pushCurrentItem();
  return items;
};

const parseAdvisorMarkdown = (markdown) => {
  const advisorsSection = getMarkdownSection(markdown, "Advisors");
  if (!advisorsSection) {
    return [];
  }

  const groups = [];
  const lines = advisorsSection.split(/\r?\n/);
  let currentGroup = null;

  const pushCurrentGroup = () => {
    if (!currentGroup || currentGroup.items.length === 0) {
      currentGroup = null;
      return;
    }

    groups.push(currentGroup);
    currentGroup = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const headingMatch = trimmed.match(/^###\s+(.+)$/);
    if (headingMatch) {
      pushCurrentGroup();
      currentGroup = {
        id: `advisor-group-${groups.length + 1}`,
        title: parseTitlePair(headingMatch[1]),
        items: [],
      };
      return;
    }

    if (!currentGroup || !trimmed.startsWith("|") || isMarkdownDividerRow(trimmed)) {
      return;
    }

    const row = parseMarkdownTableRow(trimmed);
    const headerLabel = row[0]?.toLowerCase();
    if (row.length < 8 || headerLabel === "姓名" || headerLabel === "name") {
      return;
    }

    const [name, roleZh, roleEn, email, expertiseZh, expertiseEn, bioZh, bioEn] = row;
    const expertiseZhList = parseMarkdownCellList(expertiseZh);
    const expertiseEnList = parseMarkdownCellList(expertiseEn);
    const expertise = Array.from(
      { length: Math.max(expertiseZhList.length, expertiseEnList.length) },
      (_, index) => ({
        zh: expertiseZhList[index] || expertiseEnList[index] || "",
        en: expertiseEnList[index] || expertiseZhList[index] || "",
      }),
    ).filter((entry) => entry.zh || entry.en);

    currentGroup.items.push({
      name,
      role: {
        zh: roleZh || roleEn,
        en: roleEn || roleZh,
      },
      email,
      expertise,
      bio: {
        zh: bioZh || bioEn,
        en: bioEn || bioZh,
      },
    });
  });

  pushCurrentGroup();
  return groups;
};

const getMarkdownSection = (markdown, sectionTitle) => {
  const lines = markdown.split(/\r?\n/);
  const heading = `## ${sectionTitle}`;
  const startIndex = lines.findIndex((line) => line.trim() === heading);

  if (startIndex === -1) {
    return "";
  }

  const sectionLines = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("## ")) {
      break;
    }
    sectionLines.push(line);
  }

  return sectionLines.join("\n").trim();
};

const parseScheduleMarkdown = (markdown) => {
  const scheduleSection = getMarkdownSection(markdown, "Schedule");
  if (!scheduleSection) {
    return [];
  }

  const lines = scheduleSection
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .filter((line) => line.startsWith("|") && !isMarkdownDividerRow(line))
    .slice(1)
    .map(parseMarkdownTableRow)
    .filter((row) => row.length >= 5)
    .map((row) => [
      DAY_TRANSLATIONS[row[0]] || { zh: row[0], en: row[0] },
      row[1],
      row[2],
      row[3],
      {
        zh: row[4] === "LB 312" ? "龙宾楼 312" : row[4],
        en: row[4] === "龙宾楼 312" ? "LB 312" : row[4],
      },
    ]);
};

const loadSiteData = async () => {
  if (siteDataCache) {
    return siteDataCache;
  }

  const response = await fetch(siteContent.pastMaterials.source);
  if (!response.ok) {
    throw new Error(`Failed to load site data: ${response.status}`);
  }

  const markdown = await response.text();
  siteDataCache = {
    materials: parseWorkshopMarkdown(getMarkdownSection(markdown, "Workshops")),
    advisorGroups: parseAdvisorMarkdown(markdown),
    scheduleRows: parseScheduleMarkdown(markdown),
  };
  return siteDataCache;
};

const loadMaterials = async () => {
  if (materialsCache) {
    return materialsCache;
  }

  const siteData = await loadSiteData();
  materialsCache = siteData.materials;
  return materialsCache;
};

const renderBrand = () => {
  setText("brandText", siteContent.brand.text);
};

const renderNav = () => {
  const nav = getById("siteNav");
  if (!nav) {
    return;
  }

  nav.textContent = "";
  siteContent.navigation.forEach((item) => {
    const link = createElement("a", item.id === pageType ? "nav-link nav-link--active" : "nav-link");
    link.href = item.href;
    fillText(link, item.label);
    nav.append(link);
  });
};

const renderLanguageToggle = () => {
  const toggle = getById("langToggle");
  if (!toggle) {
    return;
  }

  const toggleContent = siteContent.languageToggle;
  fillText(toggle, toggleContent.label);
  toggle.setAttribute("aria-label", toggleContent.ariaLabel);
  toggle.onclick = () => {
    siteLanguage.toggleLanguage();
  };
};

const renderDocumentMetadata = () => {
  const brandText = resolveText(siteContent.brand.text);
  const pageContent = siteContent.pages[pageType];
  const title = pageType === "home"
    ? brandText
    : `${resolveText(pageContent?.title || brandText)} | ${brandText}`;
  const description = pageType === "home"
    ? resolveText(siteContent.site.description)
    : resolveText(pageContent?.description || siteContent.site.description);

  document.title = title;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.setAttribute("content", description);
  }
};

const renderMaterialCards = (items, targetId, limit) => {
  const container = getById(targetId);
  if (!container) {
    return;
  }

  container.textContent = "";
  const visibleItems = typeof limit === "number" ? items.slice(0, limit) : items;

  visibleItems.forEach((item) => {
    const card = createElement("article", "card material-card fade-in");
    const titleRow = createElement("div", "card__title-row");
    titleRow.append(
      createContentElement("h3", "card__title", item.title),
      createElement("span", "pill", item.week),
    );

    const links = createElement("div", "material-links");
    item.links.forEach((entry) => {
      const anchor = createElement("a", "text-link");
      anchor.href = entry.href;
      anchor.target = entry.external ? "_blank" : "_self";
      anchor.rel = entry.external ? "noreferrer" : "";
      fillText(anchor, entry.label);
      links.append(anchor);
    });

    card.append(titleRow, links);
    container.append(card);
  });
};

const formatTemplate = (template, values) => {
  const text = resolveText(template);
  return text.replace(/\{(\w+)\}/g, (_, key) => `${values[key] ?? ""}`);
};

const getMaterialSearchText = (item) => {
  const parts = [item.week, item.title];
  item.links.forEach((entry) => {
    parts.push(entry.label);
  });

  return parts
    .map((value) => normalizeSearchText(value))
    .filter(Boolean)
    .join(" ");
};

const filterMaterials = (items, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => getMaterialSearchText(item).includes(normalizedQuery));
};

const renderMaterialsSearchMeta = (query, count) => {
  const meta = getById("materialsSearchMeta");
  if (!meta) {
    return;
  }

  const templates = siteContent.pages.materials.searchSummary;
  if (!query) {
    meta.textContent = formatTemplate(templates.idle, { count });
    return;
  }

  if (count === 0) {
    meta.textContent = formatTemplate(templates.empty, { query, count });
    return;
  }

  meta.textContent = formatTemplate(templates.active, { query, count });
};

const renderMaterialsEmptyState = (query) => {
  const container = getById("materialsArchive");
  if (!container) {
    return;
  }

  container.textContent = "";
  const card = createElement("article", "card material-card material-card--empty");
  card.append(
    createContentElement(
      "p",
      "card__body",
      formatTemplate(siteContent.pages.materials.searchSummary.empty, { query, count: 0 }),
    ),
  );
  container.append(card);
};

const renderMaterialsList = (items) => {
  const filteredItems = filterMaterials(items, materialsSearchQuery);
  if (materialsSearchQuery && filteredItems.length === 0) {
    renderMaterialsEmptyState(materialsSearchQuery);
  } else {
    renderMaterialCards(filteredItems, "materialsArchive");
  }
  renderMaterialsSearchMeta(materialsSearchQuery, filteredItems.length);
};

const setupMaterialsSearch = (items) => {
  const input = getById("materialsSearchInput");
  if (!input) {
    return;
  }

  setText("materialsSearchLabel", siteContent.pages.materials.searchLabel);
  input.placeholder = resolveText(siteContent.pages.materials.searchPlaceholder);
  input.value = materialsSearchQuery;
  renderMaterialsSearchMeta(materialsSearchQuery, filterMaterials(items, materialsSearchQuery).length);

  input.oninput = (event) => {
    materialsSearchQuery = event.currentTarget.value.trim();
    renderMaterialsList(items);
  };
};

const renderMaterialsError = (targetId) => {
  const container = getById(targetId);
  if (!container) {
    return;
  }

  container.textContent = "";
  const card = createElement("article", "card material-card");
  card.append(
    createContentElement("h3", "card__title", siteContent.pastMaterials.loadError.title),
    createContentElement("p", "card__body", siteContent.pastMaterials.loadError.body),
  );
  container.append(card);
};

const renderAdvisorAccordion = (groups) => {
  const container = getById("accordionContainer");
  if (!container) {
    return;
  }

  container.textContent = "";

  groups.forEach((group, index) => {
    const defaultExpanded = openAdvisorGroups.size === 0 && index === 0;
    const isExpanded = openAdvisorGroups.has(group.id) || defaultExpanded;

    if (defaultExpanded) {
      openAdvisorGroups.add(group.id);
    }

    const groupEl = createElement("section", `accordion-group${isExpanded ? " active" : ""}`);
    const headerEl = createElement("button", "accordion-header");
    headerEl.type = "button";
    headerEl.setAttribute("aria-expanded", isExpanded ? "true" : "false");

    const title = createElement("h3", "accordion-title");
    title.append(
      createContentElement("span", "accordion-title__text", group.title),
      createElement("span", "accordion-title__count", group.items.length),
    );

    const icon = createElement("span", "accordion-icon", "▼");
    icon.setAttribute("aria-hidden", "true");
    headerEl.append(title, icon);

    const contentEl = createElement("div", "accordion-content");
    const gridEl = createElement("div", "accordion-grid");

    group.items.forEach((item) => {
      const card = createElement("article", "card advisor-card fade-in");
      const titleRow = createElement("div", "card__title-row");
      titleRow.append(
        createElement("h3", "card__title", item.name),
        createElement("span", "pill", item.role),
      );

      const email = createElement("a", "advisor-card__email text-link", item.email);
      email.href = `mailto:${item.email}`;

      const expertiseTitle = createContentElement("p", "detail-label", siteContent.advisors.expertiseLabel);
      const expertiseList = createElement("ul", "tag-list");
      item.expertise.forEach((entry) => {
        expertiseList.append(createContentElement("li", "", entry));
      });

      card.append(
        titleRow,
        createContentElement("p", "card__body", item.bio),
        expertiseTitle,
        expertiseList,
        email,
      );

      gridEl.append(card);
    });

    contentEl.append(gridEl);
    groupEl.append(headerEl, contentEl);
    container.append(groupEl);

    headerEl.addEventListener("click", () => {
      const nextExpanded = !groupEl.classList.contains("active");
      groupEl.classList.toggle("active", nextExpanded);
      headerEl.setAttribute("aria-expanded", nextExpanded ? "true" : "false");

      if (nextExpanded) {
        openAdvisorGroups.add(group.id);
      } else {
        openAdvisorGroups.delete(group.id);
      }
    });
  });
};

const renderAdvisorsError = () => {
  const container = getById("accordionContainer");
  if (!container) {
    return;
  }

  container.textContent = "";
  const card = createElement("article", "card material-card");
  card.append(
    createContentElement("h3", "card__title", siteContent.advisors.loadError.title),
    createContentElement("p", "card__body", siteContent.advisors.loadError.body),
  );
  container.append(card);
};

const renderSchedule = (rows) => {
  const table = getById("dutyScheduleTable");
  if (!table) {
    return;
  }

  setText("scheduleIntro", siteContent.dutySchedule.intro);
  table.textContent = "";

  const thead = createElement("thead");
  const headRow = createElement("tr");
  siteContent.dutySchedule.columns.forEach((column) => {
    headRow.append(createContentElement("th", "", column));
  });
  thead.append(headRow);

  const tbody = createElement("tbody");
  rows.forEach((row) => {
    const tr = createElement("tr");
    row.forEach((value) => {
      tr.append(createContentElement("td", "", value));
    });
    tbody.append(tr);
  });

  table.append(thead, tbody);
};

const renderScheduleError = () => {
  const table = getById("dutyScheduleTable");
  if (!table) {
    return;
  }

  table.textContent = "";
  const tbody = createElement("tbody");
  const tr = createElement("tr");
  const td = createElement("td", "", siteContent.dutySchedule.loadError);
  td.colSpan = siteContent.dutySchedule.columns.length;
  tr.append(td);
  tbody.append(tr);
  table.append(tbody);
};

const renderPageHero = () => {
  const pageContent = siteContent.pages[pageType];
  if (!pageContent) {
    return;
  }

  setText("pageKicker", pageContent.kicker);
  setText("pageTitle", pageContent.title);
  setText("pageDescription", pageContent.description);
};

const renderHomeEntryCards = () => {
  const container = getById("homeEntryCards");
  if (!container) {
    return;
  }

  container.textContent = "";

  siteContent.homeCards.forEach((item) => {
    const card = createElement("a", "overview-card fade-in");
    card.href = item.href;
    card.target = item.external ? "_blank" : "_self";
    card.rel = item.external ? "noreferrer" : "";
    card.append(
      createContentElement("p", "meta-label", item.kicker),
      createContentElement("h2", "card__title", item.title),
      createContentElement("p", "card__body", item.body),
      createContentElement("p", "quick-link__arrow", item.cta),
    );
    container.append(card);
  });
};

const renderHome = () => {
  setText("siteTagline", siteContent.site.tagline);
  setText("siteTitle", siteContent.site.title);
  setText("siteDescription", siteContent.site.description);
  renderHomeEntryCards();
};

const renderMaterialsPage = async () => {
  renderPageHero();
  setText("materialsArchiveKicker", siteContent.pages.materials.sectionKicker);
  setText("materialsArchiveTitle", siteContent.pages.materials.sectionTitle);
  toggleParentHidden(
    "materialsArchiveTitle",
    siteContent.pages.materials.sectionKicker,
    siteContent.pages.materials.sectionTitle,
  );

  try {
    const items = await loadMaterials();
    setupMaterialsSearch(items);
    renderMaterialsList(items);
  } catch (error) {
    renderMaterialsError("materialsArchive");
    console.error(error);
  }
};

const renderAdvisorsPage = async () => {
  renderPageHero();
  setText("advisorDirectoryKicker", siteContent.pages.advisors.sectionKicker);
  setText("advisorDirectoryTitle", siteContent.pages.advisors.sectionTitle);
  toggleParentHidden(
    "advisorDirectoryTitle",
    siteContent.pages.advisors.sectionKicker,
    siteContent.pages.advisors.sectionTitle,
  );

  try {
    const siteData = await loadSiteData();
    if (siteData.advisorGroups.length === 0) {
      throw new Error("No advisor profiles found in site data.");
    }

    renderAdvisorAccordion(siteData.advisorGroups);
  } catch (error) {
    renderAdvisorsError();
    console.error(error);
  }
};

const renderSchedulePage = async () => {
  renderPageHero();
  setText("scheduleTableKicker", siteContent.pages.schedule.sectionKicker);
  setText("scheduleTableTitle", siteContent.pages.schedule.sectionTitle);
  toggleParentHidden(
    "scheduleTableTitle",
    siteContent.pages.schedule.sectionKicker,
    siteContent.pages.schedule.sectionTitle,
  );
  try {
    const siteData = await loadSiteData();
    renderSchedule(siteData.scheduleRows);
  } catch (error) {
    renderScheduleError();
    console.error(error);
  }
};

const renderPage = async () => {
  renderDocumentMetadata();
  renderBrand();
  renderNav();
  renderLanguageToggle();

  if (pageType === "materials") {
    await renderMaterialsPage();
    return;
  }

  if (pageType === "advisors") {
    await renderAdvisorsPage();
    return;
  }

  if (pageType === "schedule") {
    await renderSchedulePage();
    return;
  }

  renderHome();
};

renderPage().catch((error) => {
  console.error(error);
});

window.addEventListener("site-language-change", () => {
  renderPage().catch((error) => {
    console.error(error);
  });
});
