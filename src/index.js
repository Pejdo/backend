dotenv.config()
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import connect from './db'
import mongo from 'mongodb'
import auth from './auth'
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
  let db = await connect()
  let query = req.query
  let querySearch = {}
  if (query.naziv) querySearch.naziv = new RegExp(query.naziv)

  let cursor = await db.collection('Recepti').find(querySearch)
  let results = await cursor.toArray()
  console.log(results)
  console.log(querySearch)
  res.json(results)
})
app.get('/recepti/:id', async (req, res) => {
  let id = req.params.id
  let db = await connect()

  let doc = await db.collection('Recepti').findOne({ _id: mongo.ObjectId(id) })
  console.log(doc)
  res.json(doc)
})

app.get('/profil/:id', async (req, res) => {
  let id = req.params.id
  let db = await connect()

  let doc = await db.collection('Recepti').findOne({ _id: mongo.ObjectId(id) })
  console.log(doc)
  res.json(doc)
})

app.get('/useracc/:id', async (req, res) => {
  let id = req.params.id
  console.log('Request IP: ' + req.ip)
  console.log('Request Method: ' + req.method)
  console.log('Request date: ' + new Date())
  console.log('id ' + id)

  let db = await connect()

  let cursor = await db.collection('Recepti').find({ username: id })
  let results = await cursor.toArray()
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
  console.log('ovo je rezsutl', result)
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

app.get('/useracc', [auth.verify], (req, res) => {
  let userDetails = req.jwt
  res.send(userDetails)
}),
  app.get('/tajna', [auth.verify], (req, res) => {
    res.json({ message: 'ovo je tajna' + req.jwt.username })
  })

app.patch('/profil/:id', async (req, res) => {
  console.log('pocetak')
  let id = req.params.id
  let data = req.body
  data.time = new Date().getTime()
  delete data._id
  let db = await connect()
  let result = await db
    .collection('Recepti')
    .replaceOne({ _id: mongo.ObjectId(id) }, data)
  res.json('uspio')
})
app.listen(port, () => {
  console.log(`slusam na portu ${port}`)
})
app.delete('/recept/:id', async (req, res) => {
  let id = req.params.id
  let db = await connect()
  let result = await db
    .collection('Recepti')
    .deleteOne({ _id: mongo.ObjectId(id) })
  res.json('uspio')
})
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
