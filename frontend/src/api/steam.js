import api from "./api";

export const fetchOwnedGames = async (steamId) => {
    try {
        const response = await api.get(`/api/steam/games/${steamId}`);
        return response.data || [];
    } catch (error) {
        console.error("Failed to fetch Steam games:", error);
        return [];
    }
};