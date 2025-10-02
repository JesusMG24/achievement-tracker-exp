import { useState } from "react";
import SteamGames from "./components/SteamGames";

const defaultSteamId = import.meta.env.VITE_STEAM_ID;

export default function App() {
  const [steamId, setSteamId] = useState([defaultSteamId]);

  return (
    <>
      <h2 className="text-center font-bold mt-3">Owned Games</h2>
      <SteamGames steamId={steamId}/>
    </>
  );
}