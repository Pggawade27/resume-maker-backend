import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import './src/config/database.js';
import routes from './src/routes/index.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// all routes
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});