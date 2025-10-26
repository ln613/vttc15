const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}
const client = new MongoClient(uri);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { logData, timestamp, playerCount, matchCount, selectedPlayer } = JSON.parse(event.body);

    await client.connect();
    const db = client.db('vttc15');
    const collection = db.collection('tournament_logs');

    const logEntry = {
      timestamp: new Date(timestamp),
      playerCount,
      matchCount,
      selectedPlayer,
      logData,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(logEntry);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        id: result.insertedId,
        message: 'Log saved successfully' 
      }),
    };
  } catch (error) {
    console.error('Error saving log:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to save log',
        details: error.message 
      }),
    };
  } finally {
    await client.close();
  }
};