import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { recepto } from "./memory.js";
import cors from "cors";
import connect from "./db";
import mongo from "mongodb";
import auth from "./auth";
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  let db = await connect();
  let query = req.query;
  let querySearch = {};
  if (query.naziv) querySearch.naziv = new RegExp(query.naziv);

  let cursor = await db.collection("Recepti").find(querySearch);
  let results = await cursor.toArray();
  console.log(results);
  console.log(querySearch);
  res.json(results);
});
app.get("/recepti/:id", async (req, res) => {
  let id = req.params.id;
  let db = await connect();

  let doc = await db.collection("Recepti").findOne({ _id: mongo.ObjectId(id) });
  console.log(doc);
  res.json(doc);
});

app.get("/profil/:id", async (req, res) => {
  let id = req.params.id;
  let db = await connect();

  let doc = await db.collection("Recepti").findOne({ _id: mongo.ObjectId(id) });
  console.log(doc);
  res.json(doc);
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
app.post("/user", async (req, res) => {
  let user = req.body;
  let id;
  try {
    id = await auth.registerUser(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
  res.json({ id: id });
});
app.post("/auth", async (req, res) => {
  let user = req.body;
  try {
    let result = await auth.authenticateUser(user.username, user.password);
    res.json(result);
  } catch (e) {
    res.status(403).json({ error: e.message });
  }
});
app.post("/", [auth.verify], async (req, res) => {
  let db = await connect();
  let data = req.body;
  data.date = new Date().getTime();
  delete data._id;
  let result = await db.collection("Recepti").insertOne(data);
  if (result.insertedCount == 1) {
    res.json({
      status: "success",
      id: result.insertedId,
    });
  } else {
    res.json({
      status: "fail",
    });
  }
});
app.get("/tajna", [auth.verify], (req, res) => {
  res.json({ message: "ovo je tajna" + req.jwt.username });
});
app.patch("/profil/:id", async (req, res) => {
  console.log("pocetak");
  let id = req.params.id;
  let data = req.body;
  data.time = new Date().getTime();
  delete data._id;
  let db = await connect();
  let result = await db
    .collection("Recepti")
    .replaceOne({ _id: mongo.ObjectId(id) }, data);
  res.json("uspio");
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
