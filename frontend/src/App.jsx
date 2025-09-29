import { useState } from "react";
import SteamGames from "./components/SteamGames";

export default function App() {

  const [steamId, setSteamId] = useState([]);

  return (
    <>
      <SteamGames steamId={steamId}/>
    </>
  );
}