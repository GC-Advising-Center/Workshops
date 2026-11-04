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
      { id: "piazza", label: "Piazza", href: "./piazza.html" },
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
      piazza: {
        kicker: "",
        title: t({ zh: "AC Piazza 使用指南", en: "Join AC on Piazza" }),
        description: t({
          zh: "在 Piazza 公开或匿名提问，向 AC 成员咨询，也可以查看学长学姐留下的历史问答。",
          en: "Ask questions publicly or anonymously, get answers from AC members, and explore advice shared by previous students."
        }),
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
  get piazza() {
    return {
      quickTitle: t({ zh: "快捷加入", en: "Quick enrollment" }),
      quickIntro: t({ zh: "使用 Google Chrome 打开快捷注册链接，无需 Access Code。", en: "Open the direct enrollment link in Google Chrome. No access code is required." }),
      joinLabel: t({ zh: "首次加入 AC Piazza", en: "Join AC Piazza" }),
      classLabel: t({ zh: "已加入？进入讨论区", en: "Already enrolled? Open Piazza" }),
      quickSteps: [
        t({ zh: "打开上方快捷注册链接", en: "Open the enrollment link above" }),
        t({ zh: "点击 Join Classes", en: "Click Join Classes" }),
        t({ zh: "选择 Join as Student，填写交大邮箱", en: "Select Join as Student and enter your SJTU email" }),
        t({ zh: "查收验证邮件，完成注册与加入", en: "Verify your email to finish registration and enrollment" }),
      ],
      manualTitle: t({ zh: "无法快捷加入？按步骤手动加入", en: "Manual enrollment" }),
      manualIntro: t({ zh: "打开下方注册页面，按以下步骤选择学校和课程；已有 Piazza 账号可先登录。点击示意图可查看大图。", en: "Open the signup page below and select your school and class. Sign in first if you already have a Piazza account. Click an example image to enlarge it." }),
      imageCaption: t({ zh: "界面示意", en: "Example screen" }),
      manualSteps: [
        {
          title: t({ zh: "选择上海交通大学", en: "Select Shanghai Jiao Tong University" }),
          body: t({ zh: "在学校选择栏搜索 Shanghai Jiao Tong University 并选中；如当前显示其他学校或 class，点击 change school / change to school 切换。", en: "Search for and select Shanghai Jiao Tong University. If another school or class is shown, use change school / change to school to switch." }),
          image: "./assets/piazza/school.png",
          width: 1080,
          height: 560,
          alt: t({ zh: "在 Piazza 学校搜索栏选择 Shanghai Jiao Tong University", en: "Selecting Shanghai Jiao Tong University in the school search" }),
        },
        {
          title: t({ zh: "将学期设为 Other", en: "Choose Other as the term" }),
          body: t({ zh: "在 Selected Term 下拉菜单中选择 Other。", en: "Choose Other from the Selected Term dropdown." }),
          image: "./assets/piazza/term.png",
          width: 1080,
          height: 574,
          alt: t({ zh: "在 Selected Term 菜单中选择 Other", en: "Choosing Other in the Selected Term dropdown" }),
        },
        {
          title: t({ zh: "搜索并选择 AC 课程", en: "Find the AC class" }),
          body: t({ zh: "在 Class 1（或任意一个 Class 输入框）中输入 AC，选择 UMJI-AC: Advising Center，再点击 Join Classes。", en: "Enter AC in Class 1 or any other class field, select UMJI-AC: Advising Center, then click Join Classes." }),
          image: "./assets/piazza/class.png",
          width: 1072,
          height: 299,
          alt: t({ zh: "输入 AC 并选择 UMJI-AC: Advising Center", en: "Searching for AC and selecting UMJI-AC: Advising Center" }),
        },
        {
          title: t({ zh: "选择学生身份，验证交大邮箱", en: "Join as a student and verify your SJTU email" }),
          body: t({ zh: "选择 Join as Student，填写交大邮箱，并按验证邮件提示完成确认。加入后，即可在 Piazza 课程列表中找到 AC。", en: "Select Join as Student, enter your SJTU email, and follow the verification email to confirm enrollment. AC will then appear in your Piazza class list." }),
          image: "./assets/piazza/join.png",
          width: 1080,
          height: 643,
          alt: t({ zh: "AC 课程的 Student 身份选项与 Join Classes 按钮", en: "The Student option and Join Classes button for the AC class" }),
        },
      ],
      bookmarkTitle: t({ zh: "加入后，收藏讨论区链接", en: "Bookmark the discussion board" }),
      bookmarkIntro: t({ zh: "以后可直接从下面的课程链接进入，查看历史问答或发布新问题，AC 成员会及时回复。", en: "Use the class link below to return, search past questions, or post a new question. AC members will respond." }),
    };
  },
  get dutySchedule() {
    return {
      intro: t({
        zh: "每周一至周五 19:00–21:00 值班，地点为龙宾楼 403。各日值班顾问如下。",
        en: "Advisors are on duty Monday to Friday, 7:00–9:00 PM, at Longbin Building 403. See the daily roster below."
      }),
      columns: [
        t({ zh: "日期", en: "Day" }),
        t({ zh: "时间", en: "Time" }),
        t({ zh: "值班顾问", en: "Advisors" }),
        t({ zh: "地点", en: "Location" }),
      ],
      loadError: t({
        zh: "当前无法读取值班表数据，请检查 content/site-data.md 中的 Schedule 部分。",
        en: "Unable to load the duty schedule. Please check the Schedule section in content/site-data.md.",
      }),
    };
  },
};
