'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const scoresRouter = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    // Site is served over plain HTTP — upgrade-insecure-requests and HSTS
    // would force browsers to fetch assets via HTTPS and break everything
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        objectSrc: ["'none'"]
      }
    },
    hsts: false
  })
);

app.use(cors({ origin: false }));
app.use(express.json());

// Matter.js served locally from node_modules — never a CDN
app.get('/lib/matter.min.js', (req, res) => {
  res.sendFile(
    path.join(__dirname, '..', 'node_modules', 'matter-js', 'build', 'matter.min.js')
  );
});

app.use(express.static(path.join(__dirname, '..', 'client')));

app.use('/api', scoresRouter);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bee Defender listening on port ${PORT}`);
});
