import { useEffect, useState, useMemo } from "react";
import { fetchOwnedGames } from "../api/steam";

export default function SteamGames({ steamId }) {
    const [games, setGames] = useState(null);

    useEffect(() => {
        fetchOwnedGames(steamId).then(setGames);
    }, [steamId]);

    const gameList = useMemo(() => (
        games ? games.map((game) => (
            <li key={game.appid} className="flex gap-5 md:w-[40vw] 2xl:w-100">
                <img className="h-[8vw] aspect-square md:h-10" src={`http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`} />
                <strong><a href={`/steam/achievements/${steamId}/${game.appid}`}>{game.name}</a></strong>
            </li>
        )) : []
    ), [games, steamId]);

    if (!games) return <div className="text-center w-screen">Loading...</div>;

    return (
        <div>
            <ul className="flex flex-col gap-5 w-screen p-5 md:flex-row md:flex-wrap md:justify-around">
                {gameList}
            </ul>
        </div>
    );
}