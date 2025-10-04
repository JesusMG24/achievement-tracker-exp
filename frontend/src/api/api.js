import axios from "axios";

const api = axios.create({
    baseURL: "https://achievement-tracker-exp-production.up.railway.app/api",
});

export default api