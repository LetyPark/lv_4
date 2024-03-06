import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import Joi from 'joi';

const router = express.Router();

const signupSchema = Joi.object({
    nickname: Joi.string()
        .min(3)
        .max(15)
        .pattern(/^[a-zA-Z0-9]+$/)
        .required(),
    // .message('닉네임 형식에 일치하지 않습니다.'),
    // .message({ 'string.pattern.base': '닉네임 형식에 일치하지 않습니다. ' }),
    password: Joi.string().min(8).max(20).invalid(Joi.ref('nickname')).required(),
    // .message({ 'any.invalid': '비밀번호 형식에 일치하지 않습니다.' }),
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

        // 새 유저 등록
        const user = await prisma.users.create({
            data: { nickname, password, userType: userType },
        });

        return res.status(201).json({ data: user, message: '회원가입이 완료되었습니다.' });
    } catch (error) {
        if (error.details) {
            const errorMessage = error.details[0].message.replace(/"/g, '');
            // 400 닉네임 형식에 일치하지 않은 경우
            if (errorMessage.includes('nickname')) {
                return res.status(400).json({ message: '닉네임 형식에 일치하지 않습니다.' });
            }
            // 400 비밀번호 형식에 일치하지 않은 경우
            if (errorMessage.includes('password')) {
                return res.status(400).json({ message: '비밀번호 형식에 일치하지 않습니다.' });
            }
            return res.status(400).json({ message: errorMessage });
        }

        console.error(error.message);
        return next(error);
    }
});

export default router;
