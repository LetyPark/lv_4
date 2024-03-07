import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import checkUserRole from '../middlewares/checkUserRole.middleware.js';

const router = express.Router();

// 메뉴 등록 API
router.post('/categories/:categoryId/menus', authMiddleware, checkUserRole, async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const { name, description, image, price } = req.body;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!categoryId || !name || !description || !image || !price) throw { statusCode: 400 };

        // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
        const category = await prisma.categories.findFirst({ where: { id: +categoryId } });
        if (!category) throw { statusCode: 404 };

        // 메뉴 가격이 0인 경우
        if (price === 0) {
            console.log('🎉🎉🎉🎉🎉Price is zero');
            throw { statusCode: 400, priceZero: true };
            // 400 메뉴 가격이 0보다 작은 경우
        } else if (price < 0) {
            throw { statusCode: 400, priceInvalid: true };
        }
        // 401 로그인 되지 않은 상태인 경우 -> authMiddleware에서 처리하기 때문에 생략.
        // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우 -> checkUserRole 에서 처리하기 때문에 생략.

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
    } catch (error) {
        return next(error);
    }
});

// 카테고리별 메뉴 조회 API
router.get('/categories/:categoryId/menus', async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!categoryId) throw { statusCode: 400 };

        // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
        const category = await prisma.categories.findFirst({ where: { id: +categoryId } });
        if (!category) throw { statusCode: 404 };

        // 메뉴 조회
        const menus = await prisma.menus.findMany({
            where: { categoryId: +categoryId },
            select: { id: true, name: true, image: true, price: true, order: true, status: true },
            orderBy: { id: 'desc' },
        });

        return res.status(200).json({ data: menus });
    } catch (error) {
        return next(error);
    }
});

// 메뉴 상세 조회 API
router.get('/categories/:categoryId/menus/:menuId', async (req, res, next) => {
    try {
        const { categoryId, menuId } = req.params;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!categoryId || !menuId) throw { statusCode: 400 };

        // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
        const category = await prisma.categories.findFirst({ where: { id: +categoryId } });
        if (!category) throw { statusCode: 404 };

        const menu = await prisma.menus.findFirst({
            where: { id: +menuId, categoryId: +categoryId },
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

        if (!menu) throw { statusCode: 404, menuNotFound: true };

        return res.status(200).json({ data: menu });
    } catch (error) {
        return next(error);
    }
});

// 메뉴 수정 API
router.patch('/categories/:categoryId/menus/:menuId', authMiddleware, checkUserRole, async (req, res, next) => {
    try {
        const { categoryId, menuId } = req.params;
        const { name, description, image, price, order, status } = req.body;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!categoryId || !menuId || !name || !description || !image || !price || !order || !status)
            throw { statusCode: 400 };

        // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
        const category = await prisma.categories.findFirst({ where: { id: +categoryId } });
        if (!category) throw { statusCode: 404 };

        // 400 메뉴 가격이 0보다 작은 경우
        if (price <= 0) throw { statusCode: 400, priceInvalid: true };
        // 401 로그인 되지 않은 상태인 경우 -> authMiddleware에서 처리하기 때문에 생략.
        // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우 -> checkUserRole 에서 처리하기 때문에 생략.

        const menu = await prisma.menus.update({
            where: { id: +menuId, categoryId: +categoryId },
            data: {
                name: name,
                description: description,
                image: image,
                price: price,
                order: order,
                status: status,
            },
        });
        if (!menu) throw { statusCode: 404, menuNotFound: true };

        return res.status(200).json({ message: '메뉴를 수정하였습니다.' });
    } catch (error) {
        return next(error);
    }
});

// 메뉴 삭제 API
router.delete('/categories/:categoryId/menus/:menuId', authMiddleware, checkUserRole, async (req, res, next) => {
    try {
        const { categoryId, menuId } = req.params;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!categoryId || !menuId) throw { statusCode: 400 };

        // 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
        const category = await prisma.categories.findFirst({ where: { id: +categoryId } });
        if (!category) throw { statusCode: 404, categoryNotFound: true };

        // 404 menuId에 해당하는 메뉴가 존재하지 않을 경우
        const menu = await prisma.menus.findFirst({ where: { id: +menuId } });
        if (!menu) throw { statusCode: 404, menuNotFound: true };

        // 401 로그인 되지 않은 상태인 경우 -> authMiddleware에서 처리하기 때문에 생략.
        // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우 -> checkUserRole 에서 처리하기 때문에 생략.

        await prisma.menus.delete({ where: { id: +menuId } });

        return res.status(200).json({ message: '메뉴를 삭제하였습니다.' });
    } catch (error) {
        return next(error);
    }
});

export default router;
