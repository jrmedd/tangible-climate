const fs = require('fs')
const response = require('./examplePaths.json')

const city = response.elements[0]

const paths = Array(city.members.length).fill('')

const { minlat, minlon, maxlat, maxlon } = city.bounds;

// Define the viewBox dimensions
const viewBoxWidth = 1000;
const viewBoxHeight = 1000;

// Function to convert latitude to Mercator y-coordinate
// function latToY(lat) {
//   const y = ((maxlat - lat) / (maxlat - minlat)) * viewBoxHeight;
// }
function latToY(lat) {
  // Ensure that lat is within the minlat and maxlat range
  lat = Math.max(minlat, Math.min(maxlat, lat));
  // Calculate the Mercator projection of the lat and scale to a value between 0 and 1
  const mercatorY = Math.log(Math.tan((90 + (lat)) * (Math.PI / 360)) / Math.PI);
  const y = (mercatorY - Math.log(Math.tan((90 + maxlat) * (Math.PI / 360)) / Math.PI)) / (Math.log(Math.tan((90 + minlat) * (Math.PI / 360)) / Math.PI) - Math.log(Math.tan((90 + maxlat) * (Math.PI / 360)) / Math.PI)) * viewBoxHeight;
  return y;
}

// Function to convert longitude to Mercator x-coordinate
function lonToX(lon) {
  const x = ((lon - minlon) / (maxlon - minlon)) * viewBoxWidth;
  return x
}

city.members.forEach((member, index) => {
  if (member.geometry) {
    paths[index] += 'M';
    member.geometry.forEach((coordinate) => {
      const lat = coordinate.lat;
      const lon = coordinate.lon;
      // Convert latitude and longitude to Mercator x and y coordinates
      const x = lonToX(lon);
      const y = latToY(lat);

      paths[index] += `${x},${y} `;
    });
    paths[index] += ' ';
  }
});

const fullPath = `<path fill="none" stroke="black" d="${paths.join(' ')}Z" />`;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">
  ${fullPath}
</svg>
`;

fs.writeFileSync('test.svg', svg)
