import { fetchAchievements } from "../api/steam";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

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
            <li key={index} className="w-[80vw] flex flex-col overflow-hidden mb-5 bg-gray-700 rounded-xl items-center p-5 gap-5">
                <div className="flex w-full items-center justify-around gap-5">
                    <div className="w-[60vw] flex flex-col gap-1">
                        <h3><strong>{achievement.title}</strong></h3>
                        <p>{achievement.description}</p>
                    </div>
                    <img className="aspect-square w-15 rounded-2xl" src={achievement.icon_url}></img>
                </div>
                {achievement.unlocked_at
                    ? <p>Unlocked at: {formatDate(achievement.unlocked_at)}</p>
                    : <p className="hidden"></p>
                }
                
            </li>
        ))
    ), [achievements]);

    if (!game) return <div className="text-center w-screen">Loading...</div>;

    if (achievements.length === 0)
        return <div className="h-screen flex flex-col justify-center">
            <h2 className="w-screen text-center mt-5 mb-5"><strong>{game.name}</strong></h2>
            <p className="w-screen text-center">No achievements found for this game...</p>
        </div>;

    return (
        <div>
            <div className="flex w-screen items-center justify-center gap-5"> 
                <img className="h-[8vw] aspect-square rounded-md" src={`http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`}></img>
                <h2 className="text-center mt-5 mb-5"><strong>{game.name}</strong></h2>
            </div>
            <ul className="w-screen flex flex-col items-center">
                {achievementsList}
            </ul>
        </div>
    );
}