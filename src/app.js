import express from 'express';
import categoryRouter from './routes/categories.router.js';
import menuRouter from './routes/menus.router.js';
import usersRouter from './routes/users.router.js';
import cookieParser from 'cookie-parser';
import errorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

app.use('/api', [categoryRouter, menuRouter, usersRouter]);

app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});
