import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [results, setResults] = useState([]);
  const [roundTrip, setRoundTrip] = useState(false);

  const handleSearch = async (searchTerm, comboBox) => {
    try {
      if (searchTerm !== '') {
        const response = await axios.get(`/api/search?q=${searchTerm}`);
        setResults(response.data.results);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch airports when the component mounts
  useEffect(() => {
    handleSearch('', 'origin'); // Fetch airports for origin ComboBox
  }, []);

  const getCountryName = (iso) => {
    const regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionDisplayNames.of(iso);
  };

  const handleOriginChange = (event, value) => {
    setOrigin(value?.iata || null);
  };

  const handleDestinationChange = (event, value) => {
    setDestination(value?.iata || null);
  };

    // Inside your handleSubmit function
  const handleSubmit = async () => {
    if (origin && destination) {
      try {
        const response = await axios.post('/api/estimate', {
          origin: origin,
          destination: destination,
          isRoundTrip: roundTrip,
        });

        const smartphonesCharged = response.data.smartphonesCharged;
        const populations = await axios.get(`/api/cities/${smartphonesCharged}`)
        
        console.log(populations.data[Math.floor(Math.random() * populations.data.length)])

        // Do something with the calculated smartphonesCharged value
        console.log('Smartphones Charged:', smartphonesCharged);
      } catch (error) {
        console.error(error);
      }
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <h1>Airport Search</h1>
      <Autocomplete
        sx={{ maxWidth: '60ch', width: '100%' }}
        options={results}
        getOptionLabel={(option) =>
          `${option.name} (${option.iata}) - ${getCountryName(option.iso)}`
        }
        value={results.find((option) => option.iata === origin) || null}
        onChange={handleOriginChange}
        onInputChange={(_, newInputValue) => handleSearch(newInputValue, 'origin')}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Origin airport"
            variant="outlined"
            fullWidth
            sx={{ maxWidth: '60ch', width: '100%' }}
          />
        )}
        clearOnBlur={false}
        selectOnFocus
        disableClearable
      />
      <Autocomplete
        sx={{ maxWidth: '60ch', width: '100%' }}
        options={results}
        getOptionLabel={(option) =>
          `${option.name} (${option.iata}) - ${getCountryName(option.iso)}`
        }
        value={results.find((option) => option.iata === destination) || null}
        onChange={handleDestinationChange}
        onInputChange={(_, newInputValue) => handleSearch(newInputValue, 'destination')}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Destination airport"
            variant="outlined"
            fullWidth
          />
        )}
        clearOnBlur={false}
        selectOnFocus
        disableClearable
      />
      <FormControlLabel
        control={<Checkbox checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} />}
        label="Round Trip"
      />
      <button onClick={handleSubmit}>Search</button>
    </div>
  );
}

export default App;
