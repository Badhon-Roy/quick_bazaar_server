const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'https://ciseco-3a2e8.web.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));
app.use(express.json());

// MongoDB connection (persistent)
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wj0pjif.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    await client.connect();
    cachedClient = client;
    cachedDb = client.db('QuickBazaarDB');
    console.log("Connected to MongoDB successfully!");
    return { client, db: cachedDb };
}

async function run() {
    try {
        // Connect the client to the server
        const { db } = await connectToDatabase();

        // Collections
        const categoryCollection = db.collection("categories");
        const productsCollection = db.collection("products");
        const sortCollection = db.collection("sorts");
        const commentCollection = db.collection("comment");
        const addProductsCollection = db.collection("addProducts");

        // Category related API
        app.get('/category', async (req, res) => {
            try {
                const result = await categoryCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching categories:', error);
                res.status(500).send('Internal server error');
            }
        });

        // Products related API
        app.post('/products', async (req, res) => {
            try {
                const productInfo = req.body;
                const result = await productsCollection.insertOne(productInfo);
                res.send(result);
            } catch (error) {
                console.error('Error inserting product:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        app.get('/products', async (req, res) => {
            try {
                let query = {};
                if (req.query.category_name) {
                    query = { category_name: req.query.category_name };
                }
                const result = await productsCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).send('Internal server error');
            }
        });

        app.get('/products/discount', async (req, res) => {
            try {
                const result = await productsCollection.find({ discount: { $gt: 25 } }).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching products with discount:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        app.get('/products/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await productsCollection.findOne(query);
                if (result) {
                    res.send(result);
                } else {
                    res.status(404).send('Product not found');
                }
            } catch (error) {
                console.error('Error fetching product by ID:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Comment related API
        app.get('/comment', async (req, res) => {
            try {
                let query = {};
                if (req.query.product_id) {
                    query = { product_id: req.query.product_id };
                }
                const result = await commentCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching comments:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        app.post('/comment', async (req, res) => {
            try {
                const comment = req.body;
                const result = await commentCollection.insertOne(comment);
                res.send(result);
            } catch (error) {
                console.error('Error adding comment:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Add products related API
        app.get('/addProducts', async (req, res) => {
            try {
                let query = {};
                if (req.query.email) {
                    query = { email: req.query.email };
                }
                const result = await addProductsCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching added products:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        app.post('/addProducts', async (req, res) => {
            try {
                const product = req.body;
                const result = await addProductsCollection.insertOne(product);
                res.send(result);
            } catch (error) {
                console.error('Error adding product:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        app.delete('/addProducts/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await addProductsCollection.deleteOne(query);
                if (result.deletedCount === 1) {
                    res.send(result);
                } else {
                    res.status(404).send('Product not found');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Sort related API
        app.get('/sorts', async (req, res) => {
            try {
                const result = await sortCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching sorts:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Ping to confirm the connection
        await cachedClient.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. Successfully connected to MongoDB!");
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    } finally {
        // Optionally close the client connection when finished
        // await cachedClient.close();
    }
}

run().catch(console.dir);

// Root route
app.get('/', (req, res) => {
    res.send('Quick Bazaar Server');
});

// Start the server
app.listen(port, () => {
    console.log(`Quick Bazaar Server is running on port ${port}`);
});
