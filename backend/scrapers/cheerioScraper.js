import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeAchievementsStatic(appid) {
    const url = `https://steamcommunity.com/stats/${appid}/achievements`;
    const html = (await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Node.js)"}
    })).data;

    const $ = cheerio.load(html);
    const achievements = [];

    const rows = $(".achieveRow, .achievement_row, .achievements_row, achievement");

    if (rows.length === 0) {
        $(".achieveTxt, .achievement_info").each((i, el) => {
            const name = $(el).find(".name, .achieveName, .achieveTxt h3").text().trim();
            const desc = $(el).find(".desc, .achieveDesc, .achieveTxt h5").text().trim();
            const percentText = $(el).closest(".achieveRow, .achievement").find(".percentage, .achievePercent, .achieveUnlock").text().trim();

            const unlockedPercent = percentText ? parseFloat(percentText.replace("%", "")) : null;
            const icon = $(el).closest(".achieveRow, .achievement").find("img").attr("src") || null;
            if (name) achievements.push({ name, description: desc, unlockedPercent, iconUrl: icon });
        });
        return achievements;
    }

    rows.each((i, el) => {
        const $el = $(el);
        const name = $el.find(".achieveTxt h3, .achieveName, .name, .achieveTitle").text().trim() || $el.find("h3").text().trim();
        const description = $el.find(".achieveTxt h5, .desc, .achieveDesc, .desc").text().trim() || $el.find("h5").text().trim();
        const percentText = $el.find(".percentage, .achievePercent, .percentage_text, .percent").text().trim();
        const unlockedPercent = percentText ? parseFloat(percentText.replace("%", "")) : null;
        const iconUrl = $el.find("img").attr("src") || null;

        if (!name) return;
        achievements.push({ name, description, unlockedPercent, iconUrl });
    });

    return achievements;
}
