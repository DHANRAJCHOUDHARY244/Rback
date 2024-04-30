const { MongoClient } = require('mongodb');
const { mongoUrl, dbName } = require('../config');
const logger = require('./pino');

// ----------- constants 
const collectionName = 'user';


const client = new MongoClient(mongoUrl);

const connect = async () => {
    await client.connect();
    logger.info('Mongo Db Connected successfully to server');
}

const db = client.db(dbName);

module.exports = { connect, db }

