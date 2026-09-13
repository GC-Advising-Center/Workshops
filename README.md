# GitHub Pages Course Information Site

This repo uses a multi-page layout with a top navigation bar, and the frequently updated site data is driven by a Markdown source file.

## Main Pages

- `index.html`: home page with the latest 3 workshop items and links to the other sections
- `materials.html`: full workshop archive
- `advisors.html`: advisor directory
- `schedule.html`: Monday-Friday evening duty table

## Files You Will Usually Edit

- `content/site-data.md`: the main editable data file for the advisor directory, duty schedule, and workshop archive
- `content/site-content.js`: site text for navigation, hero content, and page-level labels
- `assets/styles.css`: shared styling
- `assets/app.js`: shared rendering and Markdown parsing logic

## Main Editing Workflow

For most routine updates, only edit `content/site-data.md`.

It currently powers:

- the advisor directory
- the full workshop archive
- the home page workshop preview
- the duty schedule table

## How To Update Advisor Profiles

The site reads advisor data from the `## Advisors` section in `content/site-data.md`.

Each advisor group uses:

- one `### 中文分组名 | *English Group Name*` heading
- one Markdown table directly under that heading

Use this format:

```md
### 大三 | *Juniors*

| 姓名 | 中文角色 | English Role | 邮箱 | 中文咨询方向 | English Expertise | 中文简介 | English Bio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 张三 | 大三 ECE 专业 | Junior, ECE | zhangsan@example.com | 学业规划<br>科研入门 | Academic planning<br>Getting started with research | 欢迎来聊天 | Feel free to reach out. |
```

Notes:

- Keep the 8-column table header as-is.
- Use `<br>` inside the expertise cells when one advisor has multiple topics.
- The Chinese and English fields are rendered directly on the bilingual site, so update both sides together when possible.
- You can add, remove, or reorder groups and advisors in Markdown without changing code.

## How To Update The Duty Schedule

Open `content/site-data.md` and edit the table under `## Schedule`.

Use this format:

```md
| 日期 | 时间 | 单周顾问 | 双周顾问 | 地点 |
| --- | --- | --- | --- | --- |
| 周一 | 7:00-9:00 PM | 顾问A / 顾问B | 顾问C / 顾问D | 龙宾楼 312 |
```

Notes:

- Keep the header row and separator row as-is.
- Each line becomes one row in the schedule table.
- You can write `周一` 到 `周四` directly.

## How To Add A New Workshop Entry

The site reads workshop data from the `## Workshops` section in `content/site-data.md`.

When you add a new item:

1. Open `content/site-data.md`.
2. Add the newest entry near the top, above the older workshop items.
3. Follow the same structure as the existing archive.

Use this format:

```md
### 2026/04/12 <br>中文标题 | *English Title*
+ [预告推送](https://example.com/announcement)
+ [分享会回放](https://example.com/recording)
+ [资料存档](https://example.com/archive)
```

You can also use other existing resource labels that already appear in the archive, such as:

- `共享文档`
- `回顾推送`
- `总结推送`
- `推送链接`

Notes:

- Keep the date at the start of the `###` heading.
- Keep the Chinese title before the separator and the English title after it.
- The parser supports both `| *English Title*` and `- *English Title*` patterns.
- If a resource is temporarily unavailable, you can leave it as plain text, but only linked items will appear as clickable links on the site.
- Some older JBox links may require SJTU VPN. That reminder is already reflected in the Materials section copy.

## How The Materials Section Works

- The home page shows the first 3 workshop entries from `content/site-data.md`.
- The Materials page shows the full parsed archive.
- To keep the newest items on the home page, always insert new entries near the top of the `## Workshops` section.

## GitHub Pages Deployment

1. Push this repository to GitHub.
2. Open the repository `Settings`.
3. Go to `Pages`.
4. Under `Build and deployment`, choose:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
5. Save and wait for the site to publish.
