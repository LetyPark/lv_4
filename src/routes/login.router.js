import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 로그인 API
router.post('/sign-in', async (req, res, next) => {
    const { nickname, password } = req.body;

    // 400 body 또는 params를 입력받지 못한 경우
    if (!nickname || !password)
        return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

    const user = await prisma.users.findFirst({ where: { nickname, password } });
    // 401 존재하지 않는 닉네임으로 시도한 경우
    if (!user) return res.status(401).json({ message: '존재하지 않는 닉네임입니다.' });

    // 401 비정상적인 비밀번호로 시도한 경우
    if (password !== user.password)
        return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

    // 페이로드에 저장할 데이터
    const payload = { nickname: user.nickname, role: user.userType };

    // JWT 토큰 생성
    const token = jwt.sign(payload, 'secret-key');
    console.log('토큰 : ' + token);

    res.cookie('loginSetToken', `Bearer ${token}`);

    return res.status(200).json({ message: '로그인에 성공하였습니다.' });
});

export default router;
