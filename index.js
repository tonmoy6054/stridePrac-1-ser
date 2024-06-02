const express = require("express");
const app = express();
const port = 3000;
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://tonmoymec:KUS2CAJla85a8lTz@cluster0.fvwj4jc.mongodb.net/productDB?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const productDB = client.db("productDB");
    const products = productDB.collection("products");

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
