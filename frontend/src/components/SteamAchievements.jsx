import { fetchAchievements } from "../api/steam";
import { useState, useEffect } from "react";
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

    if (!game) return <div className="text-center w-screen">Loading...</div>;

    if (!achievements)
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
                {achievements.map((achievement, index) => (
                    <li key={index} className="w-[80vw] flex flex-col overflow-hidden mb-5">
                        <h3>{achievement.achievement_name}</h3>
                        <p>Achieved: {JSON.stringify(achievement.achieved)}</p>
                        <p>{achievement.unlocked_at}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}