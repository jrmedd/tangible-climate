import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import {Box, Button, Card, CardActions, CardContent, CardHeader, Collapse, IconButton, Link, List, ListItem, Switch, Typography, debounce } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import styled, { css } from 'styled-components';
import { Stack } from '@mui/system';
import sources from './sources.json'

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
max-width: 100%;
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
transition-delay: 0s;
width: 60ch;
max-width: 95%;
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

const Statement = props => <ReadableParagraph>Your {props.isRoundTrip ? 'round trip' : 'trip'} from {props.tripOrigin} to {props.tripDestination} generates an <Link href={props.link}>estimated {props.estimatedFootPrint}kg</Link> of CO₂.</ReadableParagraph>


const equivalences = ['lightbulbs', 'timeSmartphones', 'populationSmartphones', 'commutes']

const Equivalence = props => {
  let equivalentText;
  switch (props.variant) {
    case 'populationSmartphones':
      default:
        equivalentText = `That's roughly equivalent to ${Math.round(props.city ? props.city.coveragePercentage : 0)}% of the population of ${props.city.city} charging their phones to full at at the same time.`
        break
        case 'timeSmartphones':
          equivalentText = `That's roughly equivalent to charging fully charing your phone once a day for ${Math.round(props.smartphones / 365)} years.`
          break
    case 'lightbulbs':
      equivalentText = `That's roughly equivalent to leaving a lightbulb on all day for ${Math.round((props.estimatedFootPrint / 0.076)/365)} years.`
      break
    case 'commutes':
      equivalentText = `That's roughly equivalent of ${Math.round(props.estimatedFootPrint / 1.4)} people driving to work in the UK.`
      break
  }
  return (<ReadableParagraph>{ equivalentText }</ReadableParagraph>)
}

const Sources = props => {
  const data = props.sources[equivalences[props.equivalence]]
  const calculation = data.calculation.split('\n\r')
  return(
    <CardContent>
      <Typography variant="h6" component="h2">How did we work this out?</Typography>
      <ReadableParagraph>{ data.summary }</ReadableParagraph>
      <Typography variant="subtitle1" component="h3">Calculation</Typography>
      <ReadableParagraph>
        {calculation.map(line => <Typography variant="body2">{line}</Typography>) }
      </ReadableParagraph>
      <Typography variant="subtitle1" component="h3">Sources</Typography>
      <List>
        { data.sources.map(source=>(
          <ListItem>
            <Link target="_blank" href={source.url}>{source.text} (opens in a new window)</Link>
          </ListItem>
        ))}
      </List>
    </CardContent>
  )
}

function App() {
  const [origin, setOrigin] = useState(null);
  const [originFullName, setOriginFullName] = useState(null);
  const [originCountry, setOriginCountry] = useState('gb');
  const [destination, setDestination] = useState(null);
  const [destinationFullName, setDestinationFullName] = useState(null);
  const [destinationCountry, setDestinationCountry] = useState('us');
  const [results, setResults] = useState([]);
  const [roundTrip, setRoundTrip] = useState(false);
  const [loadingEmissions, setLoadingEmissions] = useState(false)
  const [formVisible, setFormVisible] = useState(true)
  const [resultsVisible, setResultsVisible] = useState(false)
  const [displayedEquivalence, setDisplayedEquivalence] = useState(0)
  const [smartphonesCharged, setSmartphonesCharged] = useState(null)
  const [footprint, setFootprint] = useState(null)
  const [population, setPopulation] = useState(null)
  const [calculationsExpanded, setCalculationsExpanded] = useState(false)

  function resetForm () {
    setLoadingEmissions(false)
    setFormVisible(true)
    setResultsVisible(false)
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
    if (population !== null) {
      setFormVisible(false)
      setResultsVisible(true)
      setLoadingEmissions(false)
    }
  }, [population])
  const getCountryName = (iso) => {
    const regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionDisplayNames.of(iso);
  };

  const handleOriginChange = (event, value) => {
    setOrigin(value.iata ?? null);
    setOriginFullName(value.name ?? null)
    setOriginCountry(value.iso ?? null)
  };
  
  const handleDestinationChange = (event, value) => {
    setDestination(value.iata ?? null);
    setDestinationFullName(value.name ?? null)
    setDestinationCountry(value.iso ?? null)
  };

  const Flag = props => (
    <img
      loading="lazy"
      width="20"
      srcSet={`https://flagcdn.com/w40/${props.country.toLowerCase()}.png 2x`}
      src={`https://flagcdn.com/w20/${props.country.toLowerCase()}.png`}
      alt=""
    />
  )

  const renderAirport = ((props, option, {inputValue}) => <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
    <Flag country={ option.iso } />
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
      setCalculationsExpanded(false)
      try {
        const response = await axios.post('/api/estimate', {
          origin: origin,
          destination: destination,
          isRoundTrip: roundTrip,
        });

        setSmartphonesCharged(response.data.smartphonesCharged)
        setFootprint(response.data.footprint)
        const populations = await axios.get(`/api/cities/${response.data.smartphonesCharged}`)
        const selectedPopulation = Math.floor(Math.random() * populations.data.length)
        setPopulation(populations.data[selectedPopulation])
        setDisplayedEquivalence(Math.floor(Math.random() * equivalences.length))
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
          <CardHeader
            title="Estimated emissions"
            subheader={<>{origin} <Flag country={originCountry} /> → <Flag country={destinationCountry} /> {destination}</>} 
          />
        <CardContent>
          <Statement
            link="https://www.goclimate.com/blog/wp-content/uploads/2019/04/Calculations-in-GoClimateNeutral-Flight-Footprint-API.pdf"
            estimatedFootPrint={footprint}
            isRoundTrip={roundTrip}
            tripOrigin={originFullName}
            tripDestination={destinationFullName} />
          <Equivalence variant={equivalences[displayedEquivalence]} smartphones={smartphonesCharged} estimatedFootPrint={footprint} city={population} />
        </CardContent>
        <CardActions sx={{justifyContent: 'space-between'}}>
          <Stack direction="row" spacing={2}>
            <Button onClick={resetForm} size="small">Search again</Button>
            <Button onClick={() => setDisplayedEquivalence((displayedEquivalence + 1) % equivalences.length)} size="small">What else?</Button>
          </Stack>
          <IconButton onClick={() => setCalculationsExpanded(!calculationsExpanded)} aria-label="calculations">
            <HelpOutline />
          </IconButton>
        </CardActions>
        <Collapse in={calculationsExpanded} timeout="auto" unmountOnExit>
          <Sources sources={sources.data} equivalence={displayedEquivalence} />
        </Collapse>
      </Card>
    </StyledSection>
    <StyledForm isVisible={formVisible} onSubmit={handleSubmit}>
        <Autocomplete
          sx={{ width: '100%' }}
          options={results}
          noOptionsText="Start typing to find an aiport"
          getOptionLabel={(option) => `${option.name} (${option.iata}) - ${getCountryName(option.iso)}`}
          value={results.find((option) => option.iata === origin) || null}
          onChange={handleOriginChange}
          onInputChange={(_, newInputValue) => debounce(handleSearch(newInputValue, 'origin'), 500)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Origin airport"
              variant="outlined"
              fullWidth
              sx={{ width: '100%' }} />
          )}
          renderOption={renderAirport}
          autoHighlight
          autoSelect
          clearOnBlur={false}
          blurOnSelect
          selectOnFocus />
        <Autocomplete
          sx={{ width: '100%' }}
          options={results}
          noOptionsText="Start typing to find an aiport"
          getOptionLabel={(option) => `${option.name} (${option.iata}) - ${getCountryName(option.iso)}`}
          value={results.find((option) => option.iata === destination) || null}
          onChange={handleDestinationChange}
          onInputChange={(_, newInputValue) => debounce(handleSearch(newInputValue, 'destination'), 500)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Destination airport"
              variant="outlined"
              fullWidth />
          )}
          renderOption={renderAirport}
          autoHighlight
          autoSelect
          clearOnBlur={false}
          blurOnSelect
          selectOnFocus />
        <FormControlLabel
          control={<Switch checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} />}
          label="Round Trip" />
        <StyledButton variant="outlined" loading={loadingEmissions} type="submit">Search</StyledButton>
      </StyledForm>
    </StyledMain>
  );
}

export default App;
