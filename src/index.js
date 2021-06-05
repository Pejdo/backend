import express from "express";
import { recepto } from "./memory.js";
import cors from "cors";
import connect from "./db";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.get("/", async (req, res) => {
  let db = await connect();
  let cursor = await db.collection("Recepti").find();
  let results = await cursor.toArray();
  console.log(results);
  res.json(results);
});
/* app.get("/", (req, res) => {
  let title = req.query.title;
  let recepti = recepto;
  console.log("ovo je title", title);
  if (title) {
    recepti = recepti.filter((elem) => elem.naziv.indexOf(title) >= 0);
  }
  res.json(recepti); // i dalje vraćamo sve za sada...
}); */

app.post("/", (req, res) => {
  let poruke = req.body;
  console.log(poruke);
  recepto.push(poruke);
  res.json("ok");
});

app.listen(port, () => {
  console.log(`slusam na portu ${port}`);
});
/* app.post("/recepti", (req, res) => {
  res.json(data.recepti);
});
//update
app.put("/recepti/:id", (req, res) => {});

//
app.delete("/recepti/:id", (req, res) => {});

// jedan recept
app.get("/recepti/:id", (req, res) => {});

app.get("/", (req, res) => {});
app.get("/kategorije", (req, res) => {
  json(data.kategorije);
});
app.get("/kategorija/:id", (req, res) => {});
app.use("/recepti", (req, res) => {});
app.get("/korisnik", (req, res) => {
  res.json(data.korisnik);
}); */
