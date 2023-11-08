const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
const { config } = require('dotenv');

// Function to calculate smartphones charged
function poundsToSmartphones(poundsCO2) {
  const emissionsPerSmartphone = 8.22 * Math.pow(10, -6);
  const smartphonesCharged = poundsCO2 / (emissionsPerSmartphone * 2204.62);
  return Math.round(smartphonesCharged);
}

function kilogramsToSmartphones(kgCO2) {
  const poundsPerKilogram = 2.20462262185
  const pounds = kgCO2 * poundsPerKilogram
  return poundsToSmartphones(pounds)
}

// Route to estimate CO2 emissions and calculate smartphones charged
router.post('/estimate', async (req, res) => {
  try {
    const { origin, destination, isRoundTrip } = req.body;
    // Create an array of segments
    const segments = [
      { origin, destination },
    ];
    // If it's a round trip, add the return segment
    if (isRoundTrip) {
      segments.push({ origin: destination, destination: origin });
    }

    // Prepare the x-www-form-urlencoded parameters
    const params = {
      'cabin_class': 'economy',
      'currencies[]': ['USD']
    };

    // If there are multiple segments, add them to the params
    for (let i = 0; i < segments.length; i++) {
      params[`segments[${i}][origin]`] = segments[i].origin;
      params[`segments[${i}][destination]`] = segments[i].destination;
    }

    const config = {
      params,
      auth: {
        username: process.env.GO_CLIMATE_KEY,
        password: ''
      }
    }
    // Make the GET request to the GoClimate API
    const response = await axios.get('https://api.goclimate.com/v1/flight_footprint', config);
    // Return the result to the frontend
    const footprint = response.data.footprint

    const smartphonesCharged = kilogramsToSmartphones(footprint);
    res.json({ smartphonesCharged, footprint});

  } catch (error) {
    //console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q; // Get the search term from the query string

    if (!searchTerm) {
      return res.status(400).json({ error: 'Missing search term' });
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
    });
    const db = client.db('climate');
    const airportsCollection = db.collection('airports');

    // Create a regex pattern that matches the search term as a whole word or term
    const regexPattern = new RegExp(`\\b${searchTerm}.+`, 'i');

    const results = await airportsCollection
      .find({
        $or: [
          { name: { $regex: regexPattern } },
          { iata: searchTerm.toUpperCase() }, // Prioritize matches in the 'iata' field
        ],
      })
      .toArray();
      
    client.close();
    // Custom sorting logic
    results.sort((a, b) => {
      // First, check if there is a direct IATA code match
      if (a.iata === searchTerm.toUpperCase() && b.iata !== searchTerm.toUpperCase()) {
        return -1; // a comes before b
      } else if (b.iata === searchTerm.toUpperCase() && a.iata !== searchTerm.toUpperCase()) {
        return 1; // b comes before a
      }

      // If there's no IATA code match, sort by name relevance (case-insensitive)
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (nameA.indexOf(searchTerm.toLowerCase()) < nameB.indexOf(searchTerm.toLowerCase())) {
        return -1; // a comes before b
      } else if (nameB.indexOf(searchTerm.toLowerCase()) < nameA.indexOf(searchTerm.toLowerCase())) {
        return 1; // b comes before a
      } else {
        return 0; // no change in order
      }
    });

    res.json({ results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

router.get('/cities/:population', async (req, res) => {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true });
    const db = client.db('climate');
    const collection = db.collection('cities');

    const targetPopulation = parseInt(req.params.population, 10);

    const closestCities = await collection
      .aggregate([
        {
          $project: {
            city: 1,
            population: 1,
            distance: {
              $abs: { $subtract: ['$population', targetPopulation] },
            },
          },
        },
        { $sort: { distance: 1 } },
        { $limit: 5 },
        {
          $project: {
            city: 1,
            population: 1,
            coveragePercentage: {
              $multiply: [{ $divide: [targetPopulation, '$population'] }, 100],
            },
          },
        },
      ])
      .toArray();

    client.close();
    closestCities.map(city => city.coveragePercentage = Math.round(city.coveragePercentage))
    res.json(closestCities);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

module.exports = router;
