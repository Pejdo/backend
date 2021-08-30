import mongo from 'mongodb'
import connect from './db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from './db'
;(async () => {
  let db = await connect()
  await db
    .collection('users')
    .createIndex({ username: 1, email: 1 }, { unique: true })
})()

export default {
  async registerUser(userData) {
    let db = await connect()
    let doc = {
      username: userData.username,
      email: userData.email,
      password: await bcrypt.hash(userData.password, 8),
      date: userData.date,
    }
    try {
      let result = await db.collection('users').insertOne(doc)
      if (result && result.insertedId) {
        //return result.insertedId;
        await db
          .collection('Favoriti')
          .insertOne({ userId: userData.username, favoriteRecipes: [] })
        await db
          .collection('Rated')
          .insertOne({ userId: userData.username, ratedRecipes: [] })
        return result
      }
    } catch (e) {
      if (e.name == 'MongoError' && e.code == 11000)
        throw new Error('korisnik vec postoji')
    }
  },

  async authenticateUser(username, password) {
    let db = await connect()
    let user = await db.collection('users').findOne({ username: username })
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      delete user.password
      let token = jwt.sign(user, process.env.JWT_SECRET, {
        algorithm: 'HS512',
        expiresIn: '1 week',
      })
      return { token, username: user.username }
    } else {
      throw new Error('Cannot authenticate')
    }
  },

  async validateEmailAccessibility(email) {
    let db = await connect()
    return await db
      .collection('users')
      .findOne({ email: email })
      .then(function (result) {
        return result
      })
  },

  async changeUserPassword(changeObj, userID) {
    let db = await connect()
    let user = await db
      .collection('users')
      .findOne({ _id: mongo.ObjectID(userID) })
    console.log('user ', user._id)
    let state = await this.validateEmailAccessibility(changeObj.email).then(
      (validate) => {
        if (validate._id.equals(user._id)) return true
      }
    )
    if (
      user &&
      user.password &&
      (await bcrypt.compare(changeObj.old_password, user.password))
    ) {
      let new_password_hashed = await bcrypt.hash(changeObj.new_password, 8)
      let quest = await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            username: changeObj.username,
            email: changeObj.email,
            password: new_password_hashed,
          },
        }
      )
      console.log(quest)
      return quest.modifiedCount > 0
    }
  },

  verify(req, res, next) {
    try {
      let authorization = req.headers.authorization.split(' ')
      let type = authorization[0]
      let token = authorization[1]
      if (type !== 'Bearer') {
        return res.status(401).send()
      } else {
        req.jwt = jwt.verify(token, process.env.JWT_SECRET)
        return next()
      }
    } catch (e) {
      return res.send(401).send()
    }
  },
}
