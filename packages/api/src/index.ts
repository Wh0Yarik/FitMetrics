import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import apiRouter from './api';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

