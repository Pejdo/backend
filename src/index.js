import express from "express";
const app = express();
const port = 3000;
app.post("/recepti", (req, res) => {
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
});
app.listen(port, () => {
  console.log(`slusam na portu ${port}`);
});
