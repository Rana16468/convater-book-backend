import express from 'express';
import cors from 'cors';
import notFound from './middleware/notFound';

import router from './router';
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cron from 'node-cron'
import auto_delete_unverified_user from './utility/cron/auto_delete_unverified_user';
import catchError from './app/error/catchError';
import globalErrorhandler from './middleware/globalErrorHandelar';

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}
const app = express();

app.use(express.json());
//middlewere
//credentials:true
//https://shoes-client.vercel.app
app.use(cookieParser());
// ======= CORS =======
app.use(cors({
     origin: '*',
     credentials: true
}));

app.use(
  bodyParser.json({
    verify: (req: express.Request, _res, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send({ status: true, message: 'Well Come  Book Convater Server' });
});



cron.schedule("*/10 * * * *", async () => {
  try {
     await auto_delete_unverified_user();
    
  } catch (error: unknown) {
       catchError(error,'[Cron] Error in subscription expiry cron job:');
  }
});

app.use('/api/v1', router);

app.use(notFound);
app.use(globalErrorhandler);

export default app;
