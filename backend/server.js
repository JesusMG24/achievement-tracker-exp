const express = require("express");
const { Pool } = require("pg");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
const port = 3000;

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: 5432,
});

const STEAM_API_KEY = process.env.STEAM_API_KEY;

app.get("/steam/games/:steamID", async (req, res) => {
    const { steamID } = req.params;
    try {
        const response = await axios.get(
            `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`,
            {
                params: {
                    key: STEAM_API_KEY,
                    steamID: steamID,
                    include_appinfo: true,
                    include_played_free_games: true
                }
            }
        );
        res.json(response.data.response.games);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch Steam games" });
    }
});

app.listen(port);