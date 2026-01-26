import express from 'express';
import cors from 'cors';
import notFound from './middleware/notFound';
import globalErrorHandelar from './middleware/globalErrorHandelar';
import router from './router';
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
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
//username:navyboy
//password:5aNjnODj1ecD2sSx
app.use('/api/v1', router);

app.use(notFound);
app.use(globalErrorHandelar);

export default app;
