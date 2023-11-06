require('dotenv').config();
const express = require('express');
const app = express();
const router = require('./routes/routes')
const path = require('path');
;

app.use(express.static(path.join(__dirname, 'client/build')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'client/build/index.html')))

// Middleware
app.use(express.json());
app.use('/api', router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
