import { useState, useEffect } from "react";
import SteamGames from "./components/SteamGames";
import Header from "./components/Header";

const defaultSteamId = import.meta.env.VITE_STEAM_ID;
const getInitialSteamId = () => {
  const storedId = localStorage.getItem("steamid");
  return storedId ? storedId : defaultSteamId;
};

export default function App() {
  const [steamId, setSteamId] = useState(getInitialSteamId());
  const [inputId, setInputId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputId.trim()) {
      setSteamId(inputId.trim());
      localStorage.setItem("steamid", inputId.trim());
      setInputId("");
    }
  };

  return (
    <>
      <Header />
      <form className="flex justify-center gap-2 p-5 sticky top-17 bg-[#242424] 2xl:top-29" onSubmit={handleSubmit}>
        <input type="text" value={inputId} onChange={e => setInputId(e.target.value)} placeholder="Enter SteamID" className="border px-2 py-1 rounded md:w-1/2 2xl:w-1/3"/>
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Set SteamID</button>
      </form>
      <SteamGames steamId={steamId}/>
    </>
  );
}