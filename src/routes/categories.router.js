import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 카테고리 등록 API
router.post('/categories', authMiddleware, async (req, res, next) => {
    const { name } = req.body
    try {
        if (req.userType !== 'OWNER') {
            const err = new Error('사장님만 ㄱㄱ');
            err.status = 404;
            throw err;
        
        }
        if (!name) {
            const err = new Error('데이터 형식이 올바르지 않습니다.');
            err.status = 400;
            throw err;
        }



        const lastCategory = await prisma.categories.findFirst({
            orderBy: {
                order: 'desc',
            },
        });
        const newOrder = lastCategory ? lastCategory.order + 1 : 1;


        const newCategory = await prisma.categories.create({
            data: {
                name: name,
                order: newOrder
            },
        });

        return res.status(201).json({ message: "카테고리를 등록하였습니다." });

    } catch (err) {
        next(err);
    }
});

// 카테고리 목록 조회 API
router.get('/categories', async (req, res) => {
    const categorylist = await prisma.categories.findMany({
        select: {
            id: true,
            name: true,
            order: true,
        }
    });

    return res.status(200).json({ data: categorylist });

});

// 카테고리 정보 변경 API
router.patch('/categories/:categoryId', authMiddleware, async (req, res, next) => {
    const { name, order } = req.body
    const { categoryId } = req.params;
    try {

        if (!name || !order) {
            const err = new Error('데이터 형식이 올바르지 않습니다.');
            err.status = 404;
            throw err;
        }

        const findId = await prisma.categories.findUnique({
            where: {
                id: +categoryId
            }
        });


        if (!findId) {
            const err = new Error('존재하지 않는 카테고리 입니다.');
            err.status = 404;
            throw err;
        }

        await prisma.categories.update({
            where: {
                id: +categoryId,
            },
            data: {
                name: name,
                order: order,
            }
        })
        return res.status(200).json({ message: "카테고리 정보를 수정하였습니다." })

    } catch (err) {
        next(err);
    }
});

// 카테고리 삭제 API
router.delete('/categories/:categoryId', async (req, res, next) => {
    const { categoryId } = req.params;
    try {

        const findId = await prisma.categories.findUnique({
            where: {
                id: +categoryId
            }
        });

        if (!findId) {
            const err = new Error('존재하지 않는 카테고리 입니다.');
            err.status = 404;
            throw err;
        }


        await prisma.categories.delete({
            where: {
                id: +categoryId
            }
        });
        return res.status(200).json({ message: '카테고리 정보를 삭제하였습니다.' })

    } catch (err) {
        next(err);
    }
});

export default router;
