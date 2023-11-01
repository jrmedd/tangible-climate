import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

function App() {
  const [departureAirport, setDepartureAirport] = useState(null);
  const [arrivalAirport, setArrivalAirport] = useState(null);
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
    handleSearch('', 'departure'); // Fetch airports for departure ComboBox
  }, []);

  const getCountryName = (iso) => {
    const regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionDisplayNames.of(iso);
  };

  const handleDepartureChange = (event, value) => {
    setDepartureAirport(value?.iata || null);
  };

  const handleArrivalChange = (event, value) => {
    setArrivalAirport(value?.iata || null);
  };

    // Inside your handleSubmit function
  const handleSubmit = async () => {
    if (departureAirport && arrivalAirport) {
      try {
        const response = await axios.post('/api/estimate', {
          departureAirport: departureAirport.toLowerCase(),
          destinationAirport: arrivalAirport.toLowerCase(),
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
        value={results.find((option) => option.iata === departureAirport) || null}
        onChange={handleDepartureChange}
        onInputChange={(_, newInputValue) => handleSearch(newInputValue, 'departure')}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Departure Airport"
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
        value={results.find((option) => option.iata === arrivalAirport) || null}
        onChange={handleArrivalChange}
        onInputChange={(_, newInputValue) => handleSearch(newInputValue, 'arrival')}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Arrival Airport"
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
