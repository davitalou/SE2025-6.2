import dotenv from 'dotenv';
dotenv.config();

import params from './params.js';

export default {
  id: 'app-backend-api',
  basePath: process.cwd(), // tương đương dirname(__DIR__)
  port: process.env.PORT || 3001,
  controllerNamespace: 'controllers', // nơi đặt controller
  session: {
    name: 'advanced-backend',
    secret: process.env.JWT_SECRET || 'defaultsecret',
    cookie: { httpOnly: true },
  },
  log: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    path: './logs/app.log',
  },
  errorHandler: {
    handler: (err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Internal Server Error' });
    },
  },
  params,
};
