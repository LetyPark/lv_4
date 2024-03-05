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
    password: Joi.string().min(8).max(20).invalid(Joi.ref('nickname')).required,
});

// 회원가입 API
router.post('/sign-up', async (req, res, next) => {
    try {
        const { nickname, password } = req.body;
        if ((!nickname, password)) throw new Error('데이터 형식이 올바르지 않습니다.');

        const isExistUser = await prisma.users.findFirst({ where: { nickname } });
        if (isExistUser) throw new Error('중복된 닉네임입니다.');

        const user = await prisma.users.create({
            data: { nickname, password },
        });

        return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
    } catch (error) {}
});

export default router;
