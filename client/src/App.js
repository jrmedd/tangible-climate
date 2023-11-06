import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import {Box, Button, Card, CardActions, CardContent, Switch, Typography, debounce } from '@mui/material';
import styled, { css } from 'styled-components';
const equivalences = ['bulbs', 'time', 'population']

const StyledMain = styled.main(props => css`
  width: 100%;
  display: flex;
  flex-flow: column;
  gap: 2rem;
  align-items: center;
  margin: 1rem 0;
`)

const ReadableParagraph = styled.p(props => css`
  width: 65ch;
  max-width: 90%;
`)

const BoldText = styled.span(props => css`
  font-weight: 700;
  background-color: #ededed;
`)

const StyledSection = styled.section(props => css`
  flex-flow: column;
  gap: 1rem;
  padding: 1rem;
  opacity: ${props.isVisible ? '1' : '0'};
  height: ${props.isVisible ? '10rem' : '0rem'};
  transition-property: all;
  transition-duration: 0.4s;
  transition-timing-function: ease;
  transition-delay: 0.5s;
  width: 60ch;
  max-width: 100%;
`)


const StyledForm = styled.form(props => css`
  width: 70ch;
  max-width: 95%;
  display: flex;
  flex-flow: column;
  justify-content: flex-start;
  gap: 1rem;
  opacity: ${props.isVisible ? '1' : '0'};
  transition: opacity 0.4s ease;
  pointer-events: ${props.isVisible ? 'unset': 'none'};
`)

const StyledButton = styled(LoadingButton)(props => css`
  width: 6rem;
  @media screen and (max-width: 480px) {
  & {
    width: 100%;
  }
}
`)

const Statement = props => <CardContent>Your {props.isRoundTrip ? 'round trip' : 'trip'} from {props.tripOrigin} to {props.tripDestination} generates an <a href={props.link}>estimated {props.estimatedFootPrint}kg</a> of CO₂.</CardContent>

const Equivalence = props => {
  let equivalentText;
  switch (props.variant) {
    case 'population':
    default:
      equivalentText = `That's roughly equivalent to ${Math.round(props.city.coveragePercentage)}% of the population of ${props.city.city} charging their phones to full at at the same time.`
      break
    case 'time':
      equivalentText = `That's roughly equivalent to charging fully charing your phone once a day for ${Math.round(props.smartphones / 365)} years.`
      break
    case 'bulbs':
      equivalentText = `That's roughly equivalent to leaving a lightbulb on all day for ${Math.round((props.estimatedFootPrint / 152 + Number.EPSILON) * 100) / 100} days`
      break
    case 'miles':
      equivalentText = `That's roughly equivalent to having a leaving a lightbulb on all day everyday for ${Math.round((props.estimatedFootPrint / 152 + Number.EPSILON) * 100) / 100} days`
      break
  }
  return (<CardContent>{ equivalentText }</CardContent>)
}

function App() {
  const [origin, setOrigin] = useState(null);
  const [originFullName, setOriginFullName] = useState(null);
  const [destination, setDestination] = useState(null);
  const [destinationFullName, setDestinationFullName] = useState(null);
  const [results, setResults] = useState([]);
  const [roundTrip, setRoundTrip] = useState(false);
  const [statement, setStatement] = useState(null);
  const [equivalence, setEquivalence] = useState(null);
  const [loadingEmissions, setLoadingEmissions] = useState(false)
  const [formVisible, setFormVisible] = useState(true)
  const [resultsVisible, setResultsVisible] = useState(false)


  function resetForm () {
    setLoadingEmissions(false)
    setFormVisible(true)
    setResultsVisible(false)
    setEquivalence(null)
    setStatement(null)
  } 

  const handleSearch = async (searchTerm, comboBox) => {
    try {
      if (searchTerm !== '') {
        if (comboBox === 'origin') setOrigin(null)
        if (comboBox === 'destination') setDestination(null)
        const response = await axios.get(`/api/search?q=${searchTerm}`);
        setResults(response.data.results.map((result, index) => ({...result, id: index})));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch airports when the component mounts
  useEffect(() => {
    handleSearch('', 'origin'); // Fetch airports for origin ComboBox
  }, []);

  useEffect(() => {
    if (equivalence !== null) {
      setFormVisible(false)
      setResultsVisible(true)
    }
  }, [equivalence])
  const getCountryName = (iso) => {
    const regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionDisplayNames.of(iso);
  };

  const handleOriginChange = (event, value) => {
    setOrigin(value.iata ?? null);
    setOriginFullName(value.name ?? null)
  };
  
  const handleDestinationChange = (event, value) => {
    setDestination(value.iata ?? null);
    setDestinationFullName(value.name ?? null)
  };

  const renderAirport = ((props, option, {inputValue}) => <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
    <img
      loading="lazy"
      width="20"
      srcSet={`https://flagcdn.com/w40/${option.iso.toLowerCase()}.png 2x`}
      src={`https://flagcdn.com/w20/${option.iso.toLowerCase()}.png`}
      alt=""
    />
    <HighlightedSubstring text={`${option.name} (${option.iata}) – ${getCountryName(option.iso)}`} query={inputValue} />
  </Box>)

  const HighlightedSubstring = props => {
    const reg = new RegExp(`(${props.query})`, 'gi');
    const textParts = props.text.split(reg);
    return (
      <>
        {textParts.map(part => (part.match(reg) ? <BoldText>{part}</BoldText> : part))}
      </>
    );
  };

    // Inside your handleSubmit function
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (origin && destination) {
      setLoadingEmissions(true)
      try {
        const response = await axios.post('/api/estimate', {
          origin: origin,
          destination: destination,
          isRoundTrip: roundTrip,
        });

        const smartphonesCharged = response.data.smartphonesCharged;
        const footprint = response.data.footprint;
        const populations = await axios.get(`/api/cities/${smartphonesCharged}`)
        const population = populations.data[Math.floor(Math.random() * populations.data.length)]
        setStatement(
            <Statement
              link="https://www.goclimate.com/blog/wp-content/uploads/2019/04/Calculations-in-GoClimateNeutral-Flight-Footprint-API.pdf"
              estimatedFootPrint={footprint}
              isRoundTrip={roundTrip}
              tripOrigin={originFullName}
              tripDestination={destinationFullName}
               />
          )
        setEquivalence(<Equivalence variant={equivalences[Math.floor(Math.random() * equivalences.length)] } smartphones={smartphonesCharged} estimatedFootPrint={footprint} city={population} />)
      } catch (error) {
        console.error(error);
      }
    }
  };


  return (
    <StyledMain>
      <Typography variant="h4" component='h1'>
        Environmental impact research
      </Typography>
      <StyledSection isVisible={resultsVisible}>
      <Card>
        {statement}
        {equivalence}
        <CardActions>
          <Button onClick={resetForm} size="small">Search again</Button>
        </CardActions>
      </Card>
      </StyledSection>
      <StyledForm isVisible={formVisible} onSubmit={handleSubmit}>
        <Autocomplete
          sx={{ width: '100%' }}
          options={results}
          noOptionsText="Start typing to find an aiport"
          getOptionLabel={(option) =>
            `${option.name} (${option.iata}) - ${getCountryName(option.iso)}`
          }
          value={results.find((option) => option.iata === origin) || null}
          onChange={handleOriginChange}
          onInputChange={(_, newInputValue) => debounce(handleSearch(newInputValue, 'origin'), 500)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Origin airport"
              variant="outlined"
              fullWidth
              sx={{ width: '100%' }}
            />
          )}
          renderOption={renderAirport}
          autoHighlight
          autoSelect
          clearOnBlur={false}
          blurOnSelect
          selectOnFocus
        />
        <Autocomplete
          sx={{ width: '100%' }}
          options={results}
          noOptionsText="Start typing to find an aiport"
          getOptionLabel={(option) =>
            `${option.name} (${option.iata}) - ${getCountryName(option.iso)}`
          }
          value={results.find((option) => option.iata === destination) || null}
          onChange={handleDestinationChange}
          onInputChange={(_, newInputValue) => debounce(handleSearch(newInputValue, 'destination'), 500)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Destination airport"
              variant="outlined"
              fullWidth
            />
          )}
          renderOption={renderAirport}
          autoHighlight
          autoSelect
          clearOnBlur={false}
          blurOnSelect
          selectOnFocus
        />
        <FormControlLabel
          control={<Switch checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} />}
          label="Round Trip"
        />
        <StyledButton variant="outlined" loading={loadingEmissions} type="submit">Search</StyledButton>
      </StyledForm>
    </StyledMain>
  );
}

export default App;
