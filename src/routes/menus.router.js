import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 메뉴 등록 API
router.post('/categories/:categoryId/menus', authMiddleware, async (req, res, next) => {
    const { categoryId } = req.params;
    const { name, description, image, price } = req.body;

    // 400 body 또는 params를 입력받지 못한 경우
    if (!categoryId || !name || !description || !image || !price)
        return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

    const category = await prisma.categories.findFirst({ where: { id: +categoryId } });

    // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
    if (!category) return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });

    // 400 메뉴 가격이 0보다 작은 경우
    if (price <= 0) return res.status(400).json({ message: '메뉴 가격은 0보다 작을 수 없습니다.' });

    // 401 로그인 되지 않은 상태인 경우
    const { loginSetToken } = req.cookies;
    if (!loginSetToken) return res.status(401).json({ message: '로그인이 필요한 서비스입니다.' });

    // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우
    if (req.role !== 'OWNER')
        return res.status(401).json({ message: '사장님만 사용할 수 있는 API입니다.' });

    const lastMenu = await prisma.menus.findFirst({ orderBy: { order: 'desc' } });
    const newOrder = lastMenu ? lastMenu.order + 1 : 1;
    // 메뉴 등록
    const menu = await prisma.menus.create({
        data: {
            name: name,
            description: description,
            image: image,
            price: price,
            order: newOrder,
            // status: status,
            categoryId: +categoryId,
        },
    });

    return res.status(200).json({ data: menu, message: '메뉴를 등록하였습니다.' });
});

// 카테고리별 메뉴 조회 API
router.get('/categories/:categoryId/menus', async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!categoryId)
            return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

        // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
        const category = await prisma.categories.findFirst({ where: { id: +categoryId } });
        if (!category) return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });

        // 메뉴 조회
        const menus = await prisma.menus.findMany({
            select: { id: true, name: true, image: true, price: true, order: true, status: true },
            orderBy: { id: 'desc' },
        });

        return res.status(200).json({ data: menus });
    } catch (error) {}
});

// 메뉴 상세 조회 API
router.get('/categories/:categoryId/menus/:menuId', async (req, res, next) => {
    try {
        const { categoryId, menuId } = req.params;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!categoryId)
            return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

        // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
        const category = await prisma.categories.findFirst({ where: { id: +categoryId } });
        if (!category) return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });

        const menu = await prisma.menus.findFirst({
            where: { id: +menuId },
            select: {
                id: true,
                name: true,
                description: true,
                image: true,
                price: true,
                order: true,
                status: true,
            },
        });

        return res.status(200).json({ data: menu });
    } catch (error) {}
});

// 메뉴 수정 API
router.patch('/categories/:categoryId/menus/:menuId', authMiddleware, async (req, res, next) => {
    try {
        const { categoryId, menuId } = req.params;
        const { name, description, image, price, order, status } = req.body;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!categoryId)
            return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

        // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
        const category = await prisma.categories.findFirst({ where: { id: +categoryId } });
        if (!category) return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });

        // 400 메뉴 가격이 0보다 작은 경우
        if (price <= 0)
            return res.status(400).json({ message: '메뉴 가격은 0보다 작을 수 없습니다.' });

        // 401 로그인 되지 않은 상태인 경우
        const { loginSetToken } = req.cookies;
        if (!loginSetToken)
            return res.status(401).json({ message: '로그인이 필요한 서비스입니다.' });

        // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우
        if (req.role !== 'OWNER')
            return res.status(401).json({ message: '사장님만 사용할 수 있는 API입니다.' });

        await prisma.menus.update({
            where: { id: +menuId },
            data: {
                name: name,
                description: description,
                image: image,
                price: price,
                order: order,
                status: status,
            },
        });

        return res.status(200).json({ message: '메뉴를 수정하였습니다.' });
    } catch (error) {}
});

// 메뉴 삭제 API
router.delete('/categories/:categoryId/menus/:menuId', authMiddleware, async (req, res, next) => {
    try {
        const { categoryId, menuId } = req.params;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!categoryId || !menuId)
            return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

        // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
        const category = await prisma.categories.findFirst({ where: { id: +categoryId } });
        if (!category) return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });

        // 404 menuId에 해당하는 메뉴가 존재하지 않을 경우
        const menu = await prisma.menus.findFirst({ where: { id: +menuId } });
        if (!menu) return res.status(404).json({ message: '존재하지 않는 메뉴입니다.' });

        // 401 로그인 되지 않은 상태인 경우
        const { loginSetToken } = req.cookies;
        if (!loginSetToken)
            return res.status(401).json({ message: '로그인이 필요한 서비스입니다.' });

        // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우
        if (req.role !== 'OWNER')
            return res.status(401).json({ message: '사장님만 사용할 수 있는 API입니다.' });

        await prisma.menus.delete({ where: { id: +menuId } });

        return res.status(200).json({ message: '메뉴를 삭제하였습니다.' });
    } catch (error) {}
});

export default router;
