import mongo from "mongodb";

let connection_string =
  "mongodb+srv://admin:admin@cluster0.svpzo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
let client = new mongo.MongoClient(connection_string, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
let db = null;
export default () => {
  return new Promise((resolve, reject) => {
    if (db && client.isConnected()) resolve(db);

    client.connect((err) => {
      if (err) {
        console.log("greska", err);
        return;
      } else {
        console.log("connected");
        db = client.db("Food4You");
        resolve(db);
      }
      // perform actions on the collection object
    });
  });
};
