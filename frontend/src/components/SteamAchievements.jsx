import { fetchAchievements } from "../api/steam";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Header from "./Header";

export default function SteamAchievements() {
    const { steamId, appid } = useParams();
    const [game, setGame] = useState(null);
    const [achievements, setAchievements] = useState([]);
    
    useEffect(() => {
        fetchAchievements(steamId, appid).then(data => {
            setGame(data.game);
            setAchievements(data.achievements);
        });
    }, [steamId, appid]);

    function formatDate(isoString) {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }

    const achievementsList = useMemo(() => (
        achievements.map((achievement, index) => (
            <li key={index} className="w-[80vw] flex flex-col overflow-hidden mb-5 bg-gray-700 rounded-xl items-center p-5 gap-5 md:w-[45vw] md:h-50 md:justify-center 2xl:w-110">
                <div className="flex w-full items-center justify-around gap-5">
                    <div className="w-50 flex flex-col gap-1">
                        <h3><strong>{achievement.title}</strong></h3>
                        <p className="text-sm">{(achievement.description || "").replace(/\u00A0/g, " ")}</p>
                    </div>
                    <img className="aspect-square w-15 rounded-2xl md:w-20" src={achievement.icon_url}></img>
                </div>
                {achievement.unlocked_at
                    ? <p className="text-sm text-gray-400">Unlocked at: {formatDate(achievement.unlocked_at)}</p>
                    : <p className="hidden"></p>
                }
                
            </li>
        ))
    ), [achievements, steamId]);

    if (!game) return (
            <>
                <Header />
                <div className="text-center w-screen">Loading...</div>
            </>
        );

    if (achievements.length === 0)
        return (
            <>
                <Header />
                <div className="h-screen flex flex-col justify-center gap-5 p-5">
                    <div className="flex w-full items-center justify-center gap-5 p-5"> 
                        <img className="h-[10vw] aspect-square rounded-md md:h-15" src={`http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`} />
                        <h2 className="text-center"><strong>{game.name}</strong></h2>
                    </div>
                    <p className="w-full text-center">No achievements found for this game...</p>
                </div>
            </>
        );

    return (
        <>
            <Header />
            <div className="flex w-screen items-center justify-center gap-5 p-5"> 
                <img className="h-[10vw] aspect-square rounded-md md:h-15" src={`http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`}></img>
                <h2 className="text-center"><strong>{game.name}</strong></h2>
            </div>
            <ul className="w-screen flex flex-col items-center md:flex-row md:flex-wrap md:justify-around">
                {achievementsList}
            </ul>
        </>
    );
}