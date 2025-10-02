import api from "./api";

export const fetchOwnedGames = async (steamId) => {
    try {
        const response = await api.get(`/steam/games/${steamId}`);
        return response.data || [];
    } catch (error) {
        console.error("Failed to fetch Steam games:", error);
        return [];
    }
};

export const fetchAchievements = async (steamId, appid) => {
    try {
        const response = await api.get(`/steam/achievements/${steamId}/${appid}`);
        return response.data || [];
    } catch (error) {
        console.error("Failed to fetch User Achievements:", error);
        return [];
    }
};