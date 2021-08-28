dotenv.config()
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import connect from './db'
import mongo, { CommandCursor } from 'mongodb'
import auth from './auth'
import db from './db'
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())
//sve recepti i search
app.get('/', async (req, res) => {
  let db = await connect()
  let query = req.query
  let querySearch = {}
  if (query.naziv) querySearch.naziv = new RegExp(query.naziv)

  let cursor = await db.collection('Recepti').find(querySearch)
  let results = await cursor.toArray()
  results.forEach((value) => {
    console.log(value.rating)
    if (value.rating.length)
      value.rating =
        value.rating.reduce((sum, index) => {
          return (sum += index)
        }) / value.rating.length
  })
  console.log(querySearch)
  res.json(results)
})
//jedan recept
app.get('/recepti/:id', async (req, res) => {
  let id = req.params.id
  let db = await connect()

  let doc = await db.collection('Recepti').findOne({ _id: mongo.ObjectId(id) })
  if (doc.rating.length)
    doc.rating =
      doc.rating.reduce((sum, index) => (sum += index)) / doc.rating.length
  res.json(doc)
})
app.get('/userdata/:username', async (req, res) => {
  let username = req.params.username
  let db = await connect()

  let doc = await db.collection('users').findOne({ username: username })

  console.log(doc)
  res.json(doc)
})
//recepti za profil koji je napravio te recepte
app.get('/useracc/:id', async (req, res) => {
  let id = req.params.id
  let db = await connect()
  let cursor = await db.collection('Recepti').find({ username: id })
  let results = await cursor.toArray()
  results.forEach((value) => {
    console.log(value.rating)
    if (value.rating.length)
      value.rating =
        value.rating.reduce((sum, index) => {
          return (sum += index)
        }) / value.rating.length
  })
  console.log(results)
  res.json(results)
})
/* app.get("/", (req, res) => {
  let title = req.query.title;
  let recepti = recepto;
  console.log("ovo je title", title);
  if (title) {
    recepti = recepti.filter((elem) => elem.naziv.indexOf(title) >= 0);
  }
  res.json(recepti); // i dalje vraćamo sve za sada...
}); */
app.post('/user', async (req, res) => {
  let user = req.body
  let id
  try {
    id = await auth.registerUser(user)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
  res.json({ id: id })
})
app.post('/auth', async (req, res) => {
  let user = req.body
  console.log(user)
  try {
    let result = await auth.authenticateUser(user.username, user.password)
    res.json(result)
  } catch (e) {
    res.status(403).json({ error: e.message })
  }
})
app.post('/', [auth.verify], async (req, res) => {
  let db = await connect()
  let data = req.body
  let id = req.jwt._id
  data.date = new Date().getTime()
  delete data._id
  let result = await db.collection('Recepti').insertOne(data)
  console.log('ovo je id ', data._id)
  let kom = await db
    .collection('Komentari')
    .insertOne({ recipeID: data._id, komentari: [] })
  console.log('ovo je rezsutl', result)
  console.log(kom)
  if (result.insertedCount == 1) {
    await db.collection('users').findOne()
    res.json({
      status: 'success',
      id: result.insertedId,
    })
  } else {
    res.json({
      status: 'fail',
    })
  }
})

//provmjena profila lozinka..etc
app.patch('/useracc', [auth.verify], async (req, res) => {
  let changes = req.body
  let username = req.jwt._id
  console.log('ovo je userid ', username)
  if (changes.new_password && changes.old_password) {
    let result = await auth.changeUserPassword(changes, username)
    if (result) {
      res.status(200).send('uspijesno')
    } else {
      res.status(500).send('došlo je do greške na serveru')
    }
  } else {
    res.status(400).json({ error: 'krivi upit' })
  }
})
//jwt
app.get('/useracc', [auth.verify], (req, res) => {
  let userDetails = req.jwt
  res.send(userDetails)
}),
  app.get('/tajna', [auth.verify], (req, res) => {
    res.json({ message: 'ovo je tajna' + req.jwt.username })
  })
//update recepta
app.patch('/profil/:id', async (req, res) => {
  let db = await connect()
  console.log('pocetak')
  let id = req.params.id
  let data = req.body
  console.log(data)
  let result = await db.collection('Recepti').updateOne(
    { _id: mongo.ObjectId(id) },
    {
      $set: {
        naziv: data.naziv,
        kategorije: data.kategorije,
        src: data.src,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        sastojci: data.sastojci,
        steps: data.steps,
      },
    }
  )
  res.json(result)
})
app.listen(port, () => {
  console.log(`slusam na portu ${port}`)
})
//brisanje recepta op id
app.delete('/recept/:id', async (req, res) => {
  let id = req.params.id
  let db = await connect()
  let result = await db
    .collection('Recepti')
    .deleteOne({ _id: mongo.ObjectId(id) })
  res.json('uspio')
})
//sortiranje po receptu
app.get('/kategorije', async (req, res) => {
  let db = await connect()
  let query = req.query
  let selekcije = {}
  if (query._any) {
    // za upit: /posts?_all=pojam1 pojam2
    let pretraga = query._any
    let terms = pretraga.split(' ')

    let atributi = ['sastojci', 'cookTime']

    selekcije = {
      $and: [],
    }

    terms.forEach((term) => {
      let or = {
        $or: [],
      }

      atributi.forEach((atribut) => {
        or.$or.push({ [atribut]: new RegExp(term) })
      })

      selekcije.$and.push(or)
    })
  }
  console.log(selekcije)
  let doc = await db.collection('Recepti').find(selekcije)
  let rez = await doc.toArray()
  res.json(rez)
})
//ref za favorite recepte i korisnika
app.patch('/favoriti/:id', async (req, res) => {
  console.log(req.params.id)
  let data = req.body
  console.log(data)
  console.log(mongo.ObjectId(data.id))

  let userID = data.id
  let db = await connect()
  let user = await db.collection('users')
  let answere = await db
    .collection('Favoriti')
    .findOneAndUpdate(
      { userId: mongo.ObjectId(data.id) },
      { $push: { favoriteRecipes: req.params.id } },
      { returnNewDocument: true }
    )
  console.log('ovo je vali2 ' + answere.value._id)
  user.findOneAndUpdate(
    { _id: mongo.ObjectId(userID) },
    {
      $push: {
        Favorites: answere.value._id,
      },
    },
    { returnNewDocument: true }
  )
  res.json(answere)
})

//dodavanje komentara
app.patch('/local/:id', async (req, res) => {
  let db = await connect()
  let id = req.params.id
  let data = req.body
  console.log(data)
  let rez = await db
    .collection('Komentari')
    .findOneAndUpdate(
      { recipeID: mongo.ObjectId(id) },
      { $push: { komentari: data } },
      { returnNewDocument: true }
    )
  res.json(rez)
})
//komentari za recept
app.get('/komentari/:id', async (req, res) => {
  let db = await connect()
  let id = req.params.id
  let rez = await db
    .collection('Komentari')
    .findOne({ recipeID: mongo.ObjectId(id) })
  if (rez === null) {
    res.json({ err: 'no comment ' })
  }
  res.json(rez)
})

//favoriti
app.get('/savedRecipe/:id', async (req, res) => {
  let db = await connect()
  let data = await db
    .collection('users')
    .findOne({ _id: mongo.ObjectId(req.params.id) })
  if (data.Favorites.length) {
    console.log('favorit', data.Favorites)
    let rez = await db
      .collection('Favoriti')
      .findOne({ _id: mongo.ObjectId(data.Favorites[0]) })
    let saved = [...rez.favoriteRecipes]

    console.log(saved)
    const savedRecipes = await Promise.all(
      saved.map(async (recipe) => {
        let k = await db
          .collection('Recepti')
          .find({ _id: mongo.ObjectId(recipe) })
          .toArray()
        if (k[0].rating.length)
          k[0].rating =
            k[0].rating.reduce((sum, value) => {
              return (sum += value)
            }) / k[0].rating.length
        return k
      })
    )
    res.send(savedRecipes)
  } else res.json({ nema: 'nema favorita' })
})
app.patch('/recepti/removeFavorit/:id', async (req, res) => {
  let db = await connect()
  console.log(req.body, req.params.id)
  const favoriti = await db
    .collection('Favoriti')
    .updateOne(
      { userId: mongo.ObjectId(req.body.id) },
      { $pull: { favoriteRecipes: req.params.id } }
    )

  res.status(204).json({
    status: 'success',
    data: null,
  })
})
//ocjena recepta
app.patch('/recepti/:id', async (req, res) => {
  let db = await connect()
  let id = req.params.id
  let data = req.body
  console.log(data.rating)
  let result = await db
    .collection('Recepti')
    .findOneAndUpdate(
      { _id: mongo.ObjectId(id) },
      { $push: { rating: data.rating } },
      { returnNewDocument: true }
    )
  res.json(result)
})
