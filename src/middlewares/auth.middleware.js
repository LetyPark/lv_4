import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

export default async function (req, res, next) {
    try {
        const { loginSetToken } = req.cookies;
        if (!loginSetToken) throw new Error('요청한 사용자의 토큰이 존재하지 않습니다.');

        const [tokenType, token] = loginSetToken.split(' ');
        if (!tokenType === 'Bearer') throw new Error('토큰 타입이 Bearer 형식이 아닙니다.');

        // jwt 토큰 검증
        const decodedToken = jwt.verify(token, 'secret-key');

        const { nickname, role } = decodedToken;

        const user = await prisma.users.findFirst({ where: { nickname } });
        if (!user) throw new Error('사용자가 존재하지 않습니다.');

        req.user = user;
        req.role = role;

        next();
    } catch (error) {
        return res.status(400).json({ errorMessage: error.message });
    }
}
