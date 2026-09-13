const SITE_LANG_KEY = "SITE_LANG";
const DEFAULT_SITE_LANG = "zh";
const SUPPORTED_SITE_LANGUAGES = new Set(["zh", "en"]);
const PIAZZA_URL = "https://piazza.com/class/l1hzqox6gb3293";
const SITE_DATA_SOURCE = "./content/site-data.md";

const readStoredLanguage = () => {
  try {
    return localStorage.getItem(SITE_LANG_KEY);
  } catch {
    return null;
  }
};

const writeStoredLanguage = (lang) => {
  try {
    localStorage.setItem(SITE_LANG_KEY, lang);
  } catch {
    // Ignore storage failures and keep working with the in-memory value.
  }
};

const normalizeLanguage = (lang) => (
  SUPPORTED_SITE_LANGUAGES.has(lang) ? lang : DEFAULT_SITE_LANG
);

const getCurrentSiteLanguage = () => normalizeLanguage(readStoredLanguage());

const applyDocumentLanguage = () => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = getCurrentSiteLanguage() === "zh" ? "zh-CN" : "en";
};

if (!readStoredLanguage()) {
  writeStoredLanguage(DEFAULT_SITE_LANG);
}

applyDocumentLanguage();

function t(localizedObj) {
  if (!localizedObj) {
    return "";
  }

  if (typeof localizedObj !== "object") {
    return localizedObj;
  }

  const lang = getCurrentSiteLanguage();
  return localizedObj[lang] !== undefined ? localizedObj[lang] : localizedObj.zh;
}

window.SITE_LANGUAGE = {
  key: SITE_LANG_KEY,
  defaultLanguage: DEFAULT_SITE_LANG,
  getCurrentLanguage: getCurrentSiteLanguage,
  setCurrentLanguage(lang) {
    const previousLang = getCurrentSiteLanguage();
    const nextLang = normalizeLanguage(lang);
    writeStoredLanguage(nextLang);
    applyDocumentLanguage();
    if (typeof window !== "undefined" && previousLang !== nextLang) {
      window.dispatchEvent(new CustomEvent("site-language-change", {
        detail: { language: nextLang },
      }));
    }
    return nextLang;
  },
  toggleLanguage() {
    return this.setCurrentLanguage(getCurrentSiteLanguage() === "zh" ? "en" : "zh");
  },
  translate: t,
  isLocalizedValue(value) {
    return Boolean(value && typeof value === "object" && "zh" in value && "en" in value);
  },
};

window.toggleSiteLanguage = function toggleSiteLanguage() {
  return window.SITE_LANGUAGE.toggleLanguage();
};

window.SITE_CONTENT = {
  get languageToggle() {
    const currentLang = getCurrentSiteLanguage();
    return {
      label: currentLang === "zh" ? "English" : "中文",
      ariaLabel: currentLang === "zh" ? "Switch to English" : "切换到中文",
    };
  },
  get brand() {
    return {
      text: t({ zh: "学业分享中心", en: "GC Advising Center" }),
    };
  },
  get site() {
    return {
      tagline: "",
      title: t({ zh: "学业分享中心", en: "Academic Sharing Center" }),
      description: t({
        zh: "学业分享中心为同学提供学业交流与信息支持。",
        en: "The Academic Sharing Center provides academic support resources for students."
      })
    };
  },
  get navigation() {
    return [
      { id: "home", label: t({ zh: "首页", en: "Home" }), href: "./index.html" },
      { id: "materials", label: t({ zh: "资料", en: "Materials" }), href: "./materials.html" },
      { id: "advisors", label: t({ zh: "顾问", en: "Advisors" }), href: "./advisors.html" },
      { id: "schedule", label: t({ zh: "值班安排", en: "Duty Schedule" }), href: "./schedule.html" },
    ];
  },
  heroActions: [],
  get homeCards() {
    return [
      {
        kicker: "",
        title: t({ zh: "Workshop 存档", en: "Workshop Archive" }),
        body: "",
        cta: t({ zh: "打开资料页", en: "Open Materials" }),
        href: "./materials.html",
      },
      {
        kicker: "",
        title: t({ zh: "本周值班信息", en: "Weekly Duty Info" }),
        body: "",
        cta: t({ zh: "打开值班页", en: "Open Schedule" }),
        href: "./schedule.html",
      },
      {
        kicker: "",
        title: t({ zh: "Piazza 入口", en: "Piazza Access" }),
        body: "",
        cta: t({ zh: "打开 Piazza", en: "Open Piazza" }),
        href: PIAZZA_URL,
        external: true,
      },
    ];
  },
  get pages() {
    return {
      materials: {
        kicker: "",
        title: t({ zh: "往期工作坊资料", en: "Past Workshop Materials" }),
        description: "",
        sectionKicker: "",
        sectionTitle: "",
        searchLabel: t({ zh: "搜索资料", en: "Search Materials" }),
        searchPlaceholder: t({ zh: "按标题、日期或资料标签搜索", en: "Search by title, date, or visible resource labels" }),
        searchSummary: {
          idle: t({ zh: "共 {count} 条资料", en: "{count} materials total" }),
          active: t({ zh: "搜索“{query}”结果 {count} 条", en: "{count} results for \"{query}\"" }),
          empty: t({ zh: "没有找到“{query}”相关结果", en: "No results for \"{query}\"" }),
        },
      },
      advisors: {
        kicker: "",
        title: t({ zh: "Advisor 介绍", en: "Advisor Profiles" }),
        description: "",
        sectionKicker: "",
        sectionTitle: "",
      },
      schedule: {
        kicker: "",
        title: t({ zh: "工作日晚间值班", en: "Weekday Evening Coverage" }),
        description: "",
        sectionKicker: "",
        sectionTitle: "",
      },
    };
  },
  get pastMaterials() {
    return {
      source: SITE_DATA_SOURCE,
      intro: "",
      pageLabel: "",
      pageHref: "./materials.html",
      loadError: {
        title: t({ zh: "资料加载失败", en: "Unable to Load Materials" }),
        body: t({
          zh: "当前无法读取网站数据 Markdown。请检查 content/site-data.md 是否存在，以及是否通过本地服务器或 GitHub Pages 访问页面。",
          en: "The site data Markdown could not be read. Please make sure content/site-data.md exists and the site is being accessed through a local server or GitHub Pages."
        }),
      },
    };
  },
  get advisors() {
    return {
      expertiseLabel: t({ zh: "适合咨询", en: "Best for" }),
      loadError: {
        title: t({ zh: "顾问信息加载失败", en: "Unable to Load Advisor Profiles" }),
        body: t({
          zh: "当前无法读取顾问信息，请检查 content/site-data.md 中的 Advisors 部分。",
          en: "Unable to load advisor profiles. Please check the Advisors section in content/site-data.md.",
        }),
      },
    };
  },
  get dutySchedule() {
    return {
      intro: t({
        zh: "每周一到周四晚间值班，地点龙宾楼312。单双周人员不同，同一天同时有三位顾问在场。",
        en: "Duty runs Monday to Thursday evenings at LB312. Odd and even weeks have different advisors; three advisors are on duty each day."
      }),
      columns: [
        t({ zh: "日期", en: "Day" }),
        t({ zh: "时间", en: "Time" }),
        t({ zh: "单周顾问", en: "Odd-week Advisors" }),
        t({ zh: "双周顾问", en: "Even-week Advisors" }),
        t({ zh: "地点", en: "Location" }),
      ],
      loadError: t({
        zh: "当前无法读取值班表数据，请检查 content/site-data.md 中的 Schedule 部分。",
        en: "Unable to load the duty schedule. Please check the Schedule section in content/site-data.md.",
      }),
    };
  },
};
