import express from "express";
import axios from "axios";
import pool from "../db/pool.js";
import { scrapeAchievementsStatic } from "../scrapers/cheerioScraper.js";

const router = express.Router();
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Look for steam games for the given steamID
router.get("/steam/games/:steamID", async (req, res) => {
  const { steamID } = req.params;

  try {
    // Check if user exists in database
    const userResult = await pool.query(
      "SELECT id FROM steam_users WHERE steam_id = $1",
      [steamID]
    );

    let userId;
    
    // If user missing then insert data into database
    if (userResult.rows.length === 0) {
      const newUser = await pool.query(
        "INSERT INTO steam_users (steam_id) VALUES ($1) RETURNING id",
        [steamID]
      );
      userId = newUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    let ownedGames;

    // Fetch owned games from Steam API
    const response = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`,
      {
        params: {
          key: STEAM_API_KEY,
          steamid: steamID,
          include_appinfo: true,
          include_played_free_games: true
        },
      }
    );

    ownedGames = response.data.response?.games

    // Check if owned games are already stored in the database
    for (const ownedGame of ownedGames) {
      const gameResult = await pool.query(
        "SELECT id FROM steam_games WHERE appid = $1",
        [ownedGame.appid]
      );

      let gameId;

      // If games missing then fetch from Steam API
      if (gameResult.rows.length === 0) {
        try {
          const newGame = await pool.query(
            `INSERT INTO steam_games 
            (appid, name, img_icon_url) 
            VALUES ($1, $2, $3)
            ON CONFLICT (appid)
            DO UPDATE SET name = EXCLUDED.name, img_icon_url = EXCLUDED.img_icon_url 
            RETURNING id`,
            [ownedGame.appid, ownedGame.name, ownedGame.img_icon_url]
          );
          gameId = newGame.rows[0].id;

          const response = await axios.get(
            `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/`,
            { params: { gameid: ownedGame.appid } }
          );
          const gameAch = response.data?.achievementpercentages?.achievements || [];
          const storeGameAch = (await scrapeAchievementsStatic(ownedGame.appid)) || [];
          const combinedAchievements = gameAch.map((ach, index) => {
            const storeAch = storeGameAch[index] || {};
            return {
              position: index,
              apiname: ach.name,
              percent: ach.percent,
              title: storeAch.name ?? storeAch.title ?? null,
              description: storeAch.description ?? null,
              icon: storeAch.iconUrl ?? storeAch.icon ?? null
            };
          });
          for (const combAch of combinedAchievements) {
            await pool.query(
              `INSERT INTO steam_games_achievements
              (steam_game_id, apiname, percent, title, description, icon_url, position)
              VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [gameId, combAch.apiname, combAch.percent, combAch.title, combAch.description, combAch.icon, combAch.position]
            );
          }
          console.log(`Fetched achievements for ${ownedGame.name}`);
        } catch (error) {
          const newGame = await pool.query(
            `INSERT INTO steam_games (appid, name, img_icon_url) 
            VALUES ($1, $2, $3)
            ON CONFLICT (appid)
            DO UPDATE SET name = EXCLUDED.name, img_icon_url = EXCLUDED.img_icon_url  
            RETURNING id`,
            [ownedGame.appid, ownedGame.name, ownedGame.img_icon_url]
          );
          gameId = newGame.rows[0].id;
          console.error(`No achievements found for ${ownedGame.name}`);
        }
      } else {
        gameId = gameResult.rows[0].id;
      }

      // Link user to game
      await pool.query(
        `INSERT INTO steam_user_games (steam_user_id, steam_game_id, playtime_forever)
        VALUES ($1, $2, $3)
        ON CONFLICT (steam_user_id, steam_game_id)
        DO UPDATE SET playtime_forever = EXCLUDED.playtime_forever`,
        [userId, gameId, ownedGame.playtime_forever]
      );
    }

    const joinedData = await pool.query(
      `SELECT g.appid, g.name, g.img_icon_url, ug.playtime_forever, ug.last_played
       FROM steam_user_games ug
       JOIN steam_games g ON ug.steam_game_id = g.id
       WHERE ug.steam_user_id = $1
       ORDER BY g.name ASC`,
      [userId]
    );

    res.json(joinedData.rows);
    
  } catch (error) {
    console.error(error.message); 
  }
});

// Force game data refresh
router.get("/steam/games/refresh/:appid", async (req, res) => {
  
  const { appid } = req.params;
  const gameResult = await pool.query(
    "SELECT id, name FROM steam_games WHERE appid = $1",
    [appid]
  );
  const gameId = gameResult.rows[0].id;
  const gameName = gameResult.rows[0].name;

  try {
    const response = await axios.get(
      `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/`,
      { params: { gameid: appid } }
    );
    const gameAch = response.data?.achievementpercentages?.achievements || [];
    const storeGameAch = (await scrapeAchievementsStatic(appid)) || [];
    const combinedAchievements = gameAch.map((ach, index) => {
      const storeAch = storeGameAch[index] || {};
      return {
        position: index,
        apiname: ach.name,
        percent: ach.percent,
        title: storeAch.name ?? storeAch.title ?? null,
        description: storeAch.description ?? null,
        icon: storeAch.iconUrl ?? storeAch.icon ?? null
      };
    });
    for (const combAch of combinedAchievements) {
      await pool.query(
        `INSERT INTO steam_games_achievements
        (steam_game_id, apiname, percent, title, description, icon_url, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (steam_game_id, apiname)
        DO UPDATE SET percent = EXCLUDED.percent, title = EXCLUDED.title, description = EXCLUDED.description, icon_url = EXCLUDED.icon_url, position = EXCLUDED.position`,
        [gameId, combAch.apiname, combAch.percent, combAch.title, combAch.description, combAch.icon, combAch.position]
      );
    }
    console.log(`Fetched achievements for ${gameName}`);
    res.json("Game refreshed!")
  } catch (error) {
    console.error(error.message);
    res.json("Game could not be refreshed!")
  }

});

// Look for game data for the given user
router.get("/steam/achievements/:steamID/:appid", async (req, res) => {  
  const { steamID, appid } = req.params;
  try {
    const userResult = await pool.query(
      `SELECT id FROM steam_users WHERE steam_id = $1`,
      [steamID]
    );
    const gameResult = await pool.query(
      `SELECT id, name, img_icon_url FROM steam_games WHERE appid = $1`,
      [appid]
    );
    // Sync user game achievements
    try {
      const response = await axios.get(
        `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/`,
        { params: { appid: appid, key: STEAM_API_KEY, steamid: steamID } }
      );
      const userAch = response.data.playerstats.achievements;
      for (const achievement of userAch) {
        let unlockedAt = null;
        if (achievement.unlocktime && achievement.unlocktime > 0) {
          unlockedAt = new Date(achievement.unlocktime * 1000).toISOString().slice(0, 19).replace('T', ' ');
        }

        // Find achievement_id by apiname and game_id
        const achIdResult = await pool.query(
          `SELECT id FROM steam_games_achievements WHERE steam_game_id = $1 AND apiname = $2`,
          [gameResult.rows[0].id, achievement.apiname]
        );
        const achievementId = achIdResult.rows[0]?.id;
        if (!achievementId) continue; // skip if not found

        await pool.query(
          `INSERT INTO steam_user_achievements (steam_user_id, steam_game_id, achievement_id, unlocked_at, achieved)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (steam_user_id, steam_game_id, achievement_id)
          DO UPDATE SET unlocked_at = EXCLUDED.unlocked_at, achieved = EXCLUDED.achieved`,
          [userResult.rows[0].id, gameResult.rows[0].id, achievementId, unlockedAt, achievement.achieved]
        );
      }
      const userGameResult = await pool.query(
        `SELECT ga.position, ga.apiname, ga.percent, ga.title, ga.description, ga.icon_url,
                ua.unlocked_at, ua.achieved
         FROM steam_games_achievements ga
         LEFT JOIN steam_user_achievements ua
           ON ua.achievement_id = ga.id
          AND ua.steam_user_id = $1
          AND ua.steam_game_id = $2
         WHERE ga.steam_game_id = $2
         ORDER BY 
          CASE WHEN ua.unlocked_at IS NULL THEN 1 ELSE 0 END, 
          ua.unlocked_at DESC,                               
          ga.percent DESC`,
        [userResult.rows[0].id, gameResult.rows[0].id]
      );
      res.json({
        game: {
          name: gameResult.rows[0].name,
          img_icon_url: gameResult.rows[0].img_icon_url,
          appid: appid
        },
        achievements: userGameResult.rows
      });
    } catch (error) {
      console.error(`Failed to fetch achievements for ${gameResult.rows[0].name}: ${(error.message)}`);
      res.json({
        game: {
          name: gameResult.rows[0].name,
          img_icon_url: gameResult.rows[0].img_icon_url,
          appid: appid
        }
      });
    }
  } catch (error) {
    console.error(error.message);
  }
});

export default router;
