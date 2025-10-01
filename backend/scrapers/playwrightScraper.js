import { chromium } from "playwright";

export async function scrapeAchievementsBrowser(appid) {
  const url = `https://steamcommunity.com/stats/${appid}/achievements`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Node.js)");
  await page.goto(url, { waitUntil: "networkidle" });

  await page.waitForSelector(".achieveRow, .achievement_row, .achievements_row", { timeout: 5000 }).catch(() => {});

  const achievements = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll(".achieveRow, .achievement_row, .achievements_row, .achievement"));
    if (rows.length === 0) {
      const fallback = Array.from(document.querySelectorAll(".achieveTxt, .achievement_info"));
      return fallback.map(el => {
        const name = el.querySelector(".name, .achieveName, h3")?.textContent?.trim() || null;
        const description = el.querySelector(".desc, .achieveDesc")?.textContent?.trim() || null;
        const icon = el.closest(".achievement")?.querySelector("img")?.src || null;
        return { name, description, unlockedPercent: null, iconUrl: icon };
      });
    }
    return rows.map(row => {
      const name = row.querySelector(".achieveTxt, .achieveName, .name, h3")?.textContent?.trim() || null;
      const description = row.querySelector(".desc, .achieveDesc")?.textContent?.trim() || null;
      const percentText = row.querySelector(".percentage, .achievePercent, .percentage_text, .percent")?.textContent?.trim() || null;
      const unlockedPercent = percentText ? parseFloat(percentText.replace("%","")) : null;
      const icon = row.querySelector("img")?.src || null;
      return { name, description, unlockedPercent, iconUrl: icon };
    });
  });

  await browser.close();
  return achievements;
}
