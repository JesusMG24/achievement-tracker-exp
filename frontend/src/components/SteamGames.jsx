import { useEffect, useState } from "react";
import { fetchOwnedGames } from "../api/steam";

export default function SteamGames({ steamId }) {
    const [games, setGames] = useState(null);

    useEffect(() => {
        fetchOwnedGames(steamId).then(setGames);
    }, [steamId]);

    if (!games) return <div className="text-center w-screen">Loading...</div>;

    return (
        <div>
            <h2 className="text-center font-bold mt-3">Owned Games</h2>
            <ul className="flex flex-col gap-5 w-screen mt-5">
                {games.map((game) => (
                    <li key={game.appid} className="flex gap-5">
                        <img className="h-[8vw] aspect-square" src={`http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`}></img>
                        <strong><a href={`/steam/achievements/${steamId}/${game.appid}`}>{game.name}</a></strong>
                    </li>
                ))}
            </ul>
        </div>
    );
}