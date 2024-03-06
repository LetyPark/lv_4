import express from 'express';
import categoryRouter from './routes/categories.router.js';
import menuRouter from './routes/menus.router.js';
import signupRouter from './routes/signup.router.js';
import loginRouter from './routes/login.router.js';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

app.use('/api', [categoryRouter, menuRouter, signupRouter, loginRouter]);

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});
