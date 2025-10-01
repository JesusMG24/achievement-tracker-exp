import express from "express";
import axios from "axios";
import pool from "../db/pool.js";

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
          const response = await axios.get(
          `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/`,
          { params: { gameid: ownedGame.appid } }
          );
          const gameAch = response.data.achievementpercentages.achievements || [];
          const newGame = await pool.query(
            "INSERT INTO steam_games (appid, name, img_icon_url, achievements) VALUES ($1, $2, $3, $4) RETURNING id",
            [ownedGame.appid, ownedGame.name, ownedGame.img_icon_url, JSON.stringify(gameAch)]
          );
          gameId = newGame.rows[0].id;
          console.log(`Fetched achievements for ${ownedGame.name}`);
        } catch (error) {
          const newGame = await pool.query(
            "INSERT INTO steam_games (appid, name, img_icon_url) VALUES ($1, $2, $3) RETURNING id",
            [ownedGame.appid, ownedGame.name, ownedGame.img_icon_url]
          );
          gameId = newGame.rows[0].id;
          console.error(`No achievements found for ${ownedGame.name}`);
        }
      } else {
        gameId = gameResult.rows[0].id;
      }

      // Link user to game
      const newUserGame = await pool.query(
        `INSERT INTO steam_user_games (steam_user_id, steam_game_id, playtime_forever)
        VALUES ($1, $2, $3)
        ON CONFLICT (steam_user_id, steam_game_id)
        DO UPDATE SET playtime_forever = EXCLUDED.playtime_forever`,
        [userId, gameId, ownedGame.playtime_forever]
      );

      // Sync user game Achievements
    }

    const joinedData = await pool.query(
      `SELECT g.appid, g.name, g.img_icon_url, ug.playtime_forever, ug.last_played
       FROM steam_user_games ug
       JOIN steam_games g ON ug.steam_game_id = g.id
       WHERE ug.steam_user_id = $1`,
      [userId]
    );

    res.json(joinedData.rows);
    
  } catch (error) {
    console.error(error.message); 
  }
});

export default router;
