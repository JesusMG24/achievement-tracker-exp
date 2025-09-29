import { useEffect, useState } from "react";
import { fetchOwnedGames } from "../api/steam";

export default function SteamGames({ steamId }) {
    const [games, setGames] = useState([]);

    useEffect(() => {
        fetchOwnedGames(steamId).then(setGames);
    }, [steamId]);

    return (
        <div>
            <h2>Owned Games</h2>
            <ul className="flex flex-col gap-5">
                {games.map((game) => (
                    <li key={game.appid} className="flex gap-5">
                        <img src={`http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`}></img>
                        <strong>{game.name}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
}