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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    await client.connect();
    const db = client.db('vttc15');
    const collection = db.collection('tournament_logs');

    // Get all logs, sorted by creation date (newest first)
    const logs = await collection.find({}).sort({ createdAt: -1 }).toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        logs: logs.map(log => ({
          id: log._id,
          timestamp: log.timestamp,
          playerCount: log.playerCount,
          matchCount: log.matchCount,
          selectedPlayer: log.selectedPlayer,
          logData: log.logData,
          createdAt: log.createdAt
        }))
      }),
    };
  } catch (error) {
    console.error('Error fetching logs:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch logs',
        details: error.message 
      }),
    };
  } finally {
    await client.close();
  }
};