import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import checkCustomer from '../middlewares/checkCustomer.middleware.js';
import checkOwner from '../middlewares/checkOwner.middleware.js';

const router = express.Router();

// 메뉴 주문
router.post('/orders', authMiddleware, checkCustomer, async (req, res, next) => {
    try {
        const { menuId, quantity, status } = req.body;
        if (!menuId || !quantity) throw { statusCode: 400 };

        const menu = await prisma.menus.findFirst({ where: { id: +menuId } });
        if (!menu) throw { statusCode: 404, menuNotFound: true };

        // 401 로그인 되지 않은 상태인 경우 -> authMiddleware에서 처리하기 때문에 생략.
        // 401 소비자(CUSTOMER) 토큰을 가지고 있지 않은 경우 -> checkUserRole 에서 처리하기 때문에 생략.

        // 사용자 정보 가져오기
        const { id } = res.locals.user;

        // 주문 생성 및 저장
        const newOrder = await prisma.orders.create({
            data: {
                userId: id,
                menuId: +menuId,
                quantity: +quantity,
                status: status,
            },
        });

        return res.status(200).json({ data: newOrder, message: '메뉴 주문에 성공하였습니다.' });
    } catch (error) {
        next(error);
    }
});

// 주문 내역 조회 (소비자)
router.get('/orders/customer', authMiddleware, checkOwner, async (req, res, next) => {
    try {
        // 주문 목록 조회
        const orders = await prisma.orders.findMany({
            include: {
                menu: true, // 메뉴 정보 포함
            },
            orderBy: {
                orderDate: 'desc', // 주문 날짜 기준으로 내림차순 정렬
            },
        });

        // 각 주문에 대한 정보 가공
        const formattedOrders = orders.map((order) => ({
            menuName: order.menu.name,
            price: order.menu.price,
            quantity: order.quantity,
            status: order.status,
            orderDate: order.orderDate, // 주문 날짜는 orderDate 필드를 활용하거나 다른 필드에 저장된 주문 날짜를 사용할 수 있습니다.
            totalAmount: order.quantity * order.menu.price, // 총 주문 금액 계산
        }));

        // 조회된 주문 정보 응답
        return res.status(200).json({ data: formattedOrders });
    } catch (error) {
        next(error);
    }
});

// 주문 내역 조회 (사장님)
router.get('/orders/owner', authMiddleware, checkOwner, async (req, res, next) => {
    try {
        const { orderId } = req.body;
        // 주문 내역 조회
        const orders = await prisma.orders.findMany({
            include: {
                menu: true, // 메뉴 정보 포함
                user: true, // 사용자 정보 포함
            },
            orderBy: {
                orderDate: 'desc', // 주문 날짜 기준으로 내림차순 정렬
            },
        });

        // 각 주문에 대한 정보 가공
        const formattedOrderHistory = orders.map((order) => ({
            id: order.id,
            user: {
                id: order.user.id,
                nickname: order.user.nickname,
            },
            menu: {
                name: order.menu.name,
                price: order.menu.price,
            },
            quantity: order.quantity,
            status: order.status,
            orderDate: order.orderDate,
            totalPrice: order.quantity * order.menu.price,
        }));

        return res.status(200).json({ data: formattedOrderHistory });
    } catch (error) {
        next(error);
    }
});

// 주문 내역 상태 변경
router.patch('/orders/:orderId/status', authMiddleware, checkOwner, async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // 400 body 또는 params를 입력받지 못한 경우
        if (!orderId || !status) throw { statusCode: 400 };

        // 404 orderId에 해당하는 주문 내역이 존재하지 않을 경우
        const order = await prisma.orders.findFirst({ where: { id: +orderId } });
        if (!order) throw { statusCode: 404, orderNotFound: true };

        // 401 로그인 되지 않은 상태인 경우 -> authMiddleware에서 처리하기 때문에 생략.
        // 401 소비자(CUSTOMER) 토큰을 가지고 있지 않은 경우 -> checkUserRole 에서 처리하기 때문에 생략.

        const updateOrder = await prisma.orders.update({
            where: { id: +orderId },
            data: { status: status },
        });

        return res.status(201).json({ data: updateOrder, message: '주문 내역을 수정하였습니다.' });
    } catch (error) {
        next(error);
    }
});

export default router;
