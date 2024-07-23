import express from "express";
import cors from "cors";
import {todosRouter} from "./todosRouter";
import * as path from "node:path";

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use("/api/todos", todosRouter);
app.use(express.static(path.join(__dirname, 'public')));


app.get("/", (_, res) => {
    console.log("Hello World!");
    res.send("Hello World!");
});

app.get('/config', (_, res) => {
    res.json(process.env.API_URL);
});

app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});