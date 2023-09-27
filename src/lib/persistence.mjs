import { MongoClient, ServerApiVersion } from 'mongodb';
import bcrypt from 'bcrypt';
import credentials from '../../config.mjs';

const uri = credentials.mongo.uri;

const client = new MongoClient(uri,  {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    }
);

client.connect();

const db = client.db("massmailer");
const lists = db.collection("lists");
const messages = db.collection("messages");
const users = db.collection("users");

export function addList(listName) {
    lists.insertOne({ name: listName, addresses: [] })
        .then(result => result.insertedId)
        .catch(err => console.err(err));
}

export async function getLists() {
    const cursor = lists.find({}, { 
        projection: { _id: 0, name: 1, addresses: 1 }
    });
    const result = await cursor.toArray();
    return result;
}

export function addAddress(listName, newAddress) {
    lists.updateOne(
        { name: listName },
        { $push: {
            addresses: newAddress
        }}
    )
    .then(result => result.upsertedId)
    .catch(err => console.err(err));
}

export function addMessage(message) {
    messages.insertOne(message)
        .then(result => result.insertedId)
        .catch(err => console.err(err));
}

export async function getMessages() {
    const cursor = messages.find({}, { 
        projection: { _id: 0, name: 1, content: 1 }
    });
    const result = await cursor.toArray();
    return result;
}

export function addMessageContent(messageName, content) {
    messages.updateOne(
        { name: messageName },
        { $set: {
            content: content
        }}
    )
    .then(result => result.upsertedId)
    .catch(err => console.err(err));
}

export async function run() {
  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}

export async function checkLogin(email, password) {
    const cursor = users.find({
        email: email
    }, { 
        projection: { _id: 0, password: 1 }
    });
    const result = await cursor.toArray();

    if (result.length > 0 && await bcrypt.compare(password, result[0].password)) {
        return true;
    }

    return false;
}

export async function seedLogin() {
    const usersCount = await users.countDocuments({})
    if (usersCount === 0) {
        const hash = await bcrypt.hash('admin123', 10);
        users.insertOne({ email: 'admin@coders.ninja', password: hash })
        .then(result => result.insertedId)
        .catch(err => console.err(err));
    }
}

export default {
    run,
    addList,
    getLists,
    addAddress,
    addMessage,
    getMessages,
    addMessageContent,
    seedLogin,
    checkLogin
}
