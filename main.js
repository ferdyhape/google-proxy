import express from "express";
import cors from "cors";
import router from "./router/index.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// route Google proxy
app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
