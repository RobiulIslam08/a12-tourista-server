const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

// midleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rqcbidk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const usersCollection = client.db('tourista').collection('users')
    const guideInfoCollection = client.db('tourista').collection('guideInfo')
    const packagesCollection = client.db('tourista').collection('packages')
    const bookingCollection = client.db('tourista').collection('booking')


    // jwt relted api
  app.post('/jwt', async(req, res)=>{ 
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn:'7d'
    })
    res.send({token})
  })
  // midleware
  const verifyToken = (req, res, next) =>{
    console.log('inside verify token', req.headers.authorization)
    if(!req.headers.authorization){
      return res.status(401).send({message:'unauthorize access'})
    }
    const token = req.headers.authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message:'unauthorize access'})
    }
    req.decoded = decoded;
    next()
    } )
   
  }
  //  verify admin midleware
  const verifyAdmin = async (req, res, next) =>{
    const email = req.decoded.email;
    const query = {email: email}
    const user = await usersCollection.findOne(query)
    const isAdmin = user?.role === 'Admin'
    if(!isAdmin){
      return res.status(403).send({message: 'unauthorize access'})
    }
  next()
  }

       // save a user in db
      //  app.put('/user', async(req,res)=>{
      //   const user = req.body
      //   const query = {email: user?.email}
      //   // if user already exists in db 
      //   const isExists = await usersCollection.findOne(query)
      //   if(isExists){
      //     if(user.status === 'Requested'){
      //       const result = await usersCollection.updateOne(query,{
      //         $set:{status:user?.status},
      //       })
      //       res.send(result)
      //     }
      //     else{
      //       return res.send(isExists)
      //     }
      //   }
      
      //     // save user for the first time
      //   const options = {upsert: true}
      //   const updateDoc = {
      //     $set:{
      //       ...user,
      //       Timestamp: Date.now()
      //     }
      //   }
      //   const result = await usersCollection.updateOne(query, updateDoc, options)
      //   res.send(result)
      // })


      // Save or update a user in the database
app.put('/user', async (req, res) => {
  const user = req.body;
  const query = { email: user?.email };
  
  const isExists = await usersCollection.findOne(query);
  if (isExists) {
      if (user.status === 'Requested') {
          const result = await usersCollection.updateOne(query, {
              $set: { status: user?.status },
          });
          return res.send(result);
      } else {
          return res.send(isExists);
      }
  }

  const options = { upsert: true };
  const updateDoc = {
      $set: {
        ...user,
          Timestamp: Date.now(),
      },
  };
  console.log(updateDoc)
  const result = await usersCollection.updateOne(query, updateDoc, options);
  res.send(result);
});

         // get user info by email in  db
    app.get('/user/:email', async(req, res)=>{
      const email = req.params.email
      // console.log(email)
      const result = await usersCollection.findOne({email})
      // console.log('result', result)
      res.send(result)
    })
     // get all users from db
     app.get('/users', async (req, res)=>{
      const result = await usersCollection.find().toArray()
      res.send(result)
    })
    // guide info insert in guideinfo db
    app.post('/guideInfo', async(req, res) =>{
      const guideInfo = req.body;
      const result = await guideInfoCollection.insertOne(guideInfo)
      res.send(result)
    })
    // get guideinfo data from db
    app.get('/guideInfo', async(req,res) =>{
      const result = await guideInfoCollection.find().toArray()
      res.send(result)
    })
    // get single guideinfor for show guide details page
    app.get('/guide-details/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await guideInfoCollection.findOne(query)
      res.send(result)
    })


     //packeage collection a data insert from add package page
  app.post('/add-package',verifyToken,verifyAdmin, async(req, res)=>{
    const packageItem = req.body;
    const result = await packagesCollection.insertOne(packageItem)
    res.send(result)
  })
  // get package item db and show our package tab a
  app.get('/add-package', async(req, res) =>{
    const result = await packagesCollection.find().toArray();
    res.send(result)
  })
  // get single package for show view package / package details page
  app.get('/package-detaisl/:id', async(req, res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await packagesCollection.findOne(query)
    res.send(result)
  })

  // update user role
  app.patch('/users/update/:email', async(req, res)=>{
    const email = req.params.email;
    const query = {email};
    const user = req.body;
    const updateDoc = {
      $set: {
        ...user, 
        Timestamp: Date.now()
      }
    }
    const result = await usersCollection.updateOne(query,updateDoc)
    res.send(result)
  })


  // save booking data in db from packageDetails page and change status review, rejected and accepted
  app.post('/add-booking', async (req, res) => {
    const bookingPackage = req.body;
    const result = await bookingCollection.insertOne(bookingPackage);
    res.send(result);
  });
  //  get booking data by email and show this my booking page
  app.get('/add-booking/:email', async(req, res) =>{
    const email = req.params.email;
    const query = {touristEmail : email}
    const result = await bookingCollection.find(query).toArray();
    res.send(result)
  })

  // delete booking item db from action 'my booking page'
  app.delete('/booking-delete/:id' , async(req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await bookingCollection.deleteOne(query)
    res.send(result)
  })
   













    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req, res)=>{
	res.send('tourista server is running')
})
app.listen(port, ()=>{
	console.log('tourista runnig is port', port)
})