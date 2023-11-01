const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

// Function to calculate smartphones charged
function poundsToSmartphones(poundsCO2) {
  const emissionsPerSmartphone = 8.22 * Math.pow(10, -6);
  const smartphonesCharged = poundsCO2 / (emissionsPerSmartphone * 2204.62);
  return Math.round(smartphonesCharged);
}

// Route to estimate CO2 emissions and calculate smartphones charged
router.post('/estimate', async (req, res) => {
  try {
    // Extract departure and destination airports from the request body
    const { departureAirport, destinationAirport, isRoundTrip } = req.body;

    // Create the legs based on the selected airports
    const legs = [{ departure_airport: departureAirport, destination_airport: destinationAirport }];

    if (isRoundTrip) {
      // Add the return leg for round trips
      legs.push({ departure_airport: destinationAirport, destination_airport: departureAirport });
    }

    // Define the payload for Carbon Interface API
    const carbonInterfacePayload = {
      type: 'flight',
      passengers: 1,
      legs: legs,
    };

    // Make a request to Carbon Interface API
    // const carbonInterfaceResponse = await axios.post('https://www.carboninterface.com/api/v1/estimates', carbonInterfacePayload, {
    //   headers: {
    //     Authorization: `Bearer ${process.env.CARBON_INTERFACE_KEY}`, // Replace with your actual bearer token
    //     'Content-Type': 'application/json',
    //   },
    // });
    // // // Extract carbon_lb from the response
    // const distance = carbonInterfaceResponse.data.data.attributes.distance_value;
    // const carbonLb = carbonInterfaceResponse.data.data.attributes.carbon_lb;
    // const carbonKg = carbonInterfaceResponse.data.data.attributes.carbon_kg;

    // // Calculate smartphones charged using the provided function
    
    // // Return the result to the frontend
    const distance = 1073.21
    const carbonLb = 238.82
    const carbonKg = 108.33

    const smartphonesCharged = poundsToSmartphones(carbonLb);
    res.json({ smartphonesCharged, distance, carbonLb, carbonKg, carbonInterfacePayload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

module.exports = router;


router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q; // Get the search term from the query string

    if (!searchTerm) {
      return res.status(400).json({ error: 'Missing search term' });
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
    });
    const db = client.db();
    const airportsCollection = db.collection('airports');

    // Create a regex pattern that matches the search term as a whole word or term
    const regexPattern = new RegExp(`\\b${searchTerm}\\b`, 'i');

    const results = await airportsCollection
      .find({
        $or: [
          { name: { $regex: regexPattern } },
          { iata: searchTerm.toUpperCase() }, // Prioritize matches in the 'iata' field
        ],
      })
      .toArray();

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

    res.json(closestCities);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

module.exports = router;
