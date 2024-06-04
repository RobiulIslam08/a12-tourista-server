const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
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


       // save a user in db
       app.put('/user', async(req,res)=>{
        const user = req.body
        const query = {email: user?.email}
        // if user already exists in db 
        const isExists = await usersCollection.findOne(query)
        if(isExists){
          if(user.status === 'Requested'){
            const result = await usersCollection.updateOne(query,{
              $set:{status:user?.status},
            })
            res.send(result)
          }
          else{
            return res.send(isExists)
          }
        }
      
          // save user for the first time
        const options = {upsert: true}
        const updateDoc = {
          $set:{
            ...user,
            Timestamp: Date.now()
          }
        }
        const result = await usersCollection.updateOne(query, updateDoc, options)
        res.send(result)
      })
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
    app.post('/guideInfo', async(req, res) =>{
      const guideInfo = req.body;
      const result = await guideInfoCollection.insertOne(guideInfo)
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