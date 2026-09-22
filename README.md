# GC Advising Center — Website

Source of the Advising Center website, published at **https://ac.gcers.org** with GitHub Pages
(branch `master`, folder `/ (root)`).

Day-to-day updates only need **`content/site-data.md`**.

## Pages

* `index.html` — home page: three entry cards (workshop materials, duty schedule, Piazza)
* `materials.html` — full workshop archive, with a search box
* `advisors.html` — advisor directory, grouped in collapsible sections
* `schedule.html` — weekday evening duty table

The home page currently shows **no** workshop preview.

## Repository layout

* `content/site-data.md` — the file you edit day to day: duty schedule, advisor directory, workshop archive
* `content/site-content.js` — UI text: navigation labels, page titles and descriptions, home cards, search labels, error messages
* `assets/app.js` — reads `site-data.md` and renders every page
* `assets/styles.css` — styling
* `CNAME` — must stay in the repository root; deleting it breaks the custom domain
* `.nojekyll` — must stay in the repository root; disables Jekyll processing

## How the data is loaded

`assets/app.js` fetches `content/site-data.md` when a page loads and splits it by three exact
section headings:

    ## Schedule   ->  duty schedule table
    ## Advisors   ->  advisor directory (one collapsible group per ### heading)
    ## Workshops  ->  the full archive on the Materials page

Do not rename these headings or add extra spaces; a section whose heading does not match
exactly is silently ignored.

Because the file is fetched at page load, an edit goes live only after GitHub Pages finishes
rebuilding (about a minute) and after a hard refresh (`Ctrl+Shift+R`, or `Cmd+Shift+R` on macOS).

## Editing the duty schedule

Edit the table under `## Schedule`:

    | 日期 | 时间 | 单周顾问 | 双周顾问 | 地点 |
    | --- | --- | --- | --- | --- |
    | 周一 | 7:00-9:00 PM | 顾问A / 顾问B | 顾问C / 顾问D | 龙宾楼 312 |

* Keep the header row and the separator row as they are.
* Keep 5 columns; each line becomes one row.
* Day names: `周一` to `周四`. English names (`Monday` …) also work.
* `龙宾楼 312` is automatically shown as `LB 312` in English mode.

## Editing the advisor directory

Edit the tables under `## Advisors`. Each group is one `###` heading followed by one table:

    ### 大三 | *Juniors*

    | 姓名 | 中文角色 | English Role | 邮箱 | 中文咨询方向 | English Expertise | 中文简介 | English Bio |
    | --- | --- | --- | --- | --- | --- | --- | --- |
    | 张三 | 大三 ECE 专业 | Junior, ECE | zhangsan@example.com | 学业规划<br>科研入门 | Academic planning<br>Getting started with research | 欢迎来聊天 | Feel free to reach out. |

* Keep the 8 columns in this exact order. A row with fewer than 8 cells is ignored.
* Use `<br>` to separate multiple items inside one cell; Chinese and English are paired by position.
* Groups and rows can be added, removed, or reordered freely — no code change needed.
* The first group is expanded by default.

## Adding a workshop entry

Add the entry at the **top** of the `## Workshops` section (the list renders in file order,
newest first):

    ### 2026/07/26 <br>DD硕博申请Workshop | *DD, Graduate Programs Application Workshop*
    + [分享会回放](https://example.com/recording)
    + [资料存档](https://example.com/archive)

* The heading must be `### YYYY/M/D`, then a literal `<br>`, then the title.
  A real line break instead of `<br>` makes the whole entry disappear silently.
* Separate the Chinese and English titles with `|` and wrap the English title in `*...*`.
  If the `*...*` part is omitted, the same text is shown in both languages.
* Resource lines start with `+ `. A line with a link renders as a clickable link;
  a line without one renders as plain text.
* Text after a link becomes a note, e.g. `+ [资料存档](...) 提取码：bkia` shows
  `提取码：bkia`, or `Code: bkia` in English mode.

### Resource labels

These labels are translated automatically:

    预告推送 / 分享会回放 / 资料存档 / 共享文档 / 回顾推送 / 总结推送 / 推送链接

Any other label still renders, but shows the same Chinese text in both languages.
Adding a translation for a new label requires editing `assets/app.js`.

## Making a quick edit without git

Open https://github.com/GC-Advising-Center/Workshops/edit/master/content/site-data.md,
commit the change to `master`, wait a minute, then hard-refresh the site.

## Deployment

1. Commit and push to `master`.
2. GitHub Pages rebuilds automatically
   (Settings → Pages → Source: `Deploy from a branch`, Branch: `master`, Folder: `/ (root)`).
3. `CNAME` in the repository root keeps the site at https://ac.gcers.org.

