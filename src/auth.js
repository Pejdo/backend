import mongo from "mongodb";
import connect from "./db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
(async () => {
  let db = await connect();
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
})();
export default {
  async registerUser(userData) {
    let db = await connect();
    let doc = {
      username: userData.username,
      password: await bcrypt.hash(userData.password, 8),
      grad: userData.grad,
    };
    try {
      let result = await db.collection("users").insertOne(doc);
      if (result && result.insertedId) return result.insertedId;
    } catch (e) {
      if (e.name == "MongoError" && e.code == 11000)
        throw new Error("korisnik vec postoji");
    }
  },
  async authenticateUser(username, password) {
    let db = await connect();
    let user = await db.collection("users").findOne({ username: username });

    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      delete user.password;
      let token = jwt.sign(user, process.env.JWT_SECRET, {
        algorithm: "HS512",
        expiresIn: "1 week",
      });
      return { token, username: user.username };
    } else {
      throw new Error("Cannot authenticate");
    }
  },
  verify(req, res, next) {
    try {
      let authorization = req.headers.authorization.split(" ");
      let type = authorization[0];
      let token = authorization[1];
      if (type !== "Bearer") {
        return res.status(401).send();
      } else {
        req.jwt = jwt.verify(token, process.env.JWT_SECRET);
        return next();
      }
    } catch (e) {
      return res.send(401).send();
    }
  },
};
