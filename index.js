const express = require("express");
const app = express();
const port = 3000;
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());


function createToken(user){
const token = jwt.sign({
email:user.email
},
'secret', {expiresIn: '7d'}
)
return token;
}

function verifyToken(req,res,next){
  const authToken = req.headers.authorization.split(' ')[1];
  
  const verify = jwt.verify(token, 'secret');
  console.log(verify);
  req.user = verify.email;
  if(!verify.token){
    return res.send('YNot authorized');
  }
  next();
}

const uri = "mongodb+srv://tonmoymec:KUS2CAJla85a8lTz@cluster0.fvwj4jc.mongodb.net/productDB?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function run() {
  try {
     client.connect();
    console.log("Connected to MongoDB");

    const productDB = client.db("productDB");
    const products = productDB.collection("products");
    const userDB = client.db("userDB");
    const users = userDB.collection("users");
    const categoryDB = client.db('categoryDB');
    const category = categoryDB.collection("category");



    app.get('/users/:email', async (req, res) => {
      const { email } = req.params;
      try {
        const user = await users.findOne({ email });
        if (user) {
          const token = createToken(user);
          res.json({ ...user, token });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
      }
    });

    app.get('/users/get/:id', async (req, res) => {
      const id = req.params.id;  
      try {
        const result = await users.findOne({ _id: new ObjectId(id) });
        if (!result) {
          return res.status(404).send('User not found');
        }
        res.send(result);
      } catch (error) {
        res.status(500).send('Failed to fetch user');
      }
    });
    

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const result = await users.findOne({ email });
        if (!result) {
          return res.status(404).send('User not found');
        }
        res.send(result);
      } catch (error) {
        res.status(500).send('Failed to fetch user');
      }
    });


    app.get('/products', async (req, res) => {
      try {
        const productsData = await products.find().toArray();
        res.send(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/products/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const product = await products.findOne({ _id: new ObjectId(id) });
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
      } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    
    app.post('/users', verifyToken, async (req, res) => {
      const userData = req.body;
      const token = createToken(userData);
  
      try {
        const isUserExists = await users.findOne({ email: userData.email });
  
        if (isUserExists) {
          return res.status(409).json({ error: "User already exists", token });
        }
  
        const result = await users.insertOne(userData);
        res.status(201).json({ user: result.ops[0], token });
      } catch (error) {
        console.error('Error inserting user data:', error);
        res.status(500).json({ error: 'Failed to register user' });
      }
    });
  
    
    

    

    app.patch('/users/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      try {
        const usersData = req.body;
        const result = await users.updateOne(
          { email }, 
          { $set: usersData }, 
          { upsert: true } 
        );
        if (result.matchedCount === 0) {
          return res.status(404).send('User not found');
        }
        res.send('User updated successfully');
      } catch (error) {
        res.status(500).send('Failed to update user');
      }
    });
  
    app.post('/products', async (req, res) => {
      try {
        const productsData = req.body;
        const result = await products.insertOne(productsData);
        res.send(result);
      } catch (error) {
        console.error('Error inserting product:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    

    

    app.delete('/products/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await products.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.put('/products/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        const result = await products.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.send(result);
      } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged MongoDB");

    app.get('/', (req, res) => {
      res.send("Hello World");
    });

    app.listen(port, () => {
      console.log(`App is running on port ${port}`);
    });

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.error);
