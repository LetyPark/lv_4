import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

const signupSchema = Joi.object({
    nickname: Joi.string()
        .min(3)
        .max(15)
        .pattern(/^[a-zA-Z0-9]+$/)
        .required(),
    // .message('닉네임 형식에 일치하지 않습니다.'), // 에러
    // .message({ 'string.pattern.base': '닉네임 형식에 일치하지 않습니다. ' }), // 에러
    password: Joi.string().min(8).max(20).invalid(Joi.ref('nickname')).required(),
    // .message({ 'any.invalid': '비밀번호 형식에 일치하지 않습니다.' }), // 에러
    userType: Joi.string().valid('CUSTOMER', 'OWNER'),
});

// 회원가입 API
router.post('/sign-up', async (req, res, next) => {
    try {
        const { nickname, password, userType } = await signupSchema.validateAsync(req.body);

        // 400 body 또는 params를 입력 받지 못한 경우
        if (!nickname || !password)
            return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

        const isExistUser = await prisma.users.findFirst({ where: { nickname } });
        // 409 중복된 닉네임으로 회원가입을 시도한 경우
        if (isExistUser) return res.status(409).json({ message: '중복된 닉네임입니다.' });

        // bcrypt를 이용해서 암호화된 문자열을 저장하기 위한 변수.
        const hashedPassword = await bcrypt.hash(password, 10);

        // 새 유저 등록
        const user = await prisma.users.create({
            data: {
                nickname,
                password: hashedPassword,
                userType,
            },
        });

        console.log(`${nickname} 님이 가입하셨습니다.`);

        return res.status(201).json({ data: user, message: '회원가입이 완료되었습니다.' });
    } catch (error) {
        if (error.details) {
            // 세부적인 유효성 오류 메시지에 따라 응답을 반환

            // 에러 객체의 details 배열에서 첫 번째 오류 메시지를 선택하여 해당 메시지에서 모든 큰 따옴표를 제거하는 역할
            const errorMessage = error.details[0].message;

            // 400 닉네임 형식에 일치하지 않은 경우
            if (errorMessage.includes('nickname')) {
                return res.status(400).json({ message: '닉네임 형식에 일치하지 않습니다.' });
            }
            // 400 비밀번호 형식에 일치하지 않은 경우
            if (errorMessage.includes('password')) {
                return res.status(400).json({ message: '비밀번호 형식에 일치하지 않습니다.' });
            }
            // 기타 오류 메시지에 대한 처리
            return res.status(400).json({ message: errorMessage });
        }

        // 그 외의 모든 에러를 next 함수로 전달
        console.error(error.message);
        return next(error);
    }
});

// 로그인 API
router.post('/sign-in', async (req, res, next) => {
    try {
        const { nickname, password } = req.body;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!nickname || !password)
            return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

        // 401 존재하지 않는 닉네임으로 시도한 경우
        const user = await prisma.users.findFirst({ where: { nickname } });
        if (!user) return res.status(401).json({ message: '존재하지 않는 닉네임입니다.' });

        // 401 비정상적인 비밀번호로 시도한 경우
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 페이로드에 저장할 데이터
        const payload = { nickname: user.nickname, role: user.userType };

        // JWT 토큰 생성
        const accessToken = jwt.sign(payload, 'access-secret-key', { expiresIn: '5m' }); // 유효시간 5분
        const refreshToken = jwt.sign(payload, 'refresh-secret-key', { expiresIn: '7d' }); // 유효시간 7일

        res.cookie('accessToken', `Bearer ${accessToken}`);
        res.cookie('refreshToken', `Bearer ${refreshToken}`);

        return res.status(200).json({ message: '로그인에 성공하였습니다.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ errorMessage: '서버 오류가 발생했습니다.' });
    }
});

export default router;
