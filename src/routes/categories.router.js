import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 카테고리 등록 API
router.post('/categories', authMiddleware, async (req, res, next) => {
    const { name } = req.body;

    // 400 body 또는 params를 입력받지 못한 경우
    if (!name) return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

    // 401 로그인 되지 않은 상태인 경우
	
});
export default router;
