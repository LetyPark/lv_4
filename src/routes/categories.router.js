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
    const { loginSetToken } = req.cookies;
    console.log('카테고리에서 로그인셋토큰 : ' + loginSetToken);
    if (!loginSetToken) return res.status(401).json({ message: '로그인이 필요한 서비스입니다.' });

    // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우
    console.log('카테고리에서 req.role ? : ' + req.role);
    if (req.role !== 'OWNER') {
        return res.status(401).json({ message: '사장님만 사용할 수 있는 API입니다.' });
    }

    // 카테고리 등록 로직
    const lastCategory = await prisma.categories.findFirst({ orderBy: { order: 'desc' } });
    const newOrder = lastCategory ? lastCategory.order + 1 : 1;
    const category = await prisma.categories.create({
        data: {
            name: name,
            order: newOrder,
        },
    });

    // 401 JWT 토큰이 만료된 경우

    return res.status(200).json({ message: '카테고리를 등록하였습니다.' });
});

// 카테고리 목록 조회 API
router.get('/categories', async (req, res, next) => {
    const { name } = req.body;

    const categories = await prisma.categories.findMany({
        select: { id: true, name: true, order: true },
        // where : {name} ===> 이렇게 해도 결과 나옴!
        orderBy: { order: 'desc' },
    });

    return res.status(200).json({ data: categories });
});

// 카테고리 정보 변경 API
router.patch('/categories/:categoryId', authMiddleware, async (req, res, next) => {
    const { categoryId } = req.params;
    const { name, order } = req.body;

    // 400 body 또는 params를 입력받지 못한 경우
    if (!name || !order || !categoryId)
        return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

    const category = await prisma.categories.findFirst({ where: { id: +categoryId } });

    // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
    if (!category) return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });

    // 401 로그인 되지 않은 상태인 경우
    const { loginSetToken } = req.cookies;
    if (!loginSetToken) return res.status(401).json({ message: '로그인이 필요한 서비스입니다.' });

    // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우
    if (req.role !== 'OWNER')
        return res.status(401).json({ message: '사장님만 사용할 수 있는 API입니다.' });

    const changedCategory = await prisma.categories.update({
        where: { id: +categoryId },
        data: { name: name, order: order },
    });

    return res
        .status(200)
        .json({ data: changedCategory, message: '카테고리 정보를 수정하였습니다.' });
});

// 카테고리 삭제 API
router.delete('/categories/:categoryId', authMiddleware, async (req, res, next) => {
    const { categoryId } = req.params;

    // 400 body 또는 params를 입력받지 못한 경우
    if (!categoryId) return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

    // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
    const category = await prisma.categories.findFirst({ where: { id: +categoryId } });
    if (!category) return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });

    // 401 로그인 되지 않은 상태인 경우
    const { loginSetToken } = req.cookies;
    if (!loginSetToken) return res.status(401).json({ message: '로그인이 필요한 서비스입니다.' });

    // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우
    if (req.role !== 'OWNER')
        return res.status(401).json({ message: '사장님만 사용할 수 있는 API입니다.' });

    await prisma.categories.delete({ where: { id: +categoryId } });

    return res.status(200).json({ message: '카테고리 정보를 삭제하였습니다.' });
});

export default router;
