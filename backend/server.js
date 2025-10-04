import express from "express";
import dotenv from "dotenv";
import steamRoutes from "./routes/steam.js";
import cors from "cors";
import helmet from "helmet";

dotenv.config();
const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: "https://famous-croquembouche-3d209d.netlify.app" }));
app.use("/api", steamRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});