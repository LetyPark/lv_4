import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

export default async function (req, res, next) {
    try {
        const { accessToken } = req.cookies;

        // 400 토큰이 존재하지 않는 경우
        if (!accessToken) {
            return res.status(400).json({ errorMessage: 'Access Token 이 존재하지 않습니다.' });
        }

        // 액세스 토큰 형식이 Bearer 형식이 아닌 경우
        const [accessTokenType, accessTokenValue] = accessToken.split(' ');
        if (accessTokenType !== 'Bearer') {
            res.clearCookie();
            return res.status(400).json({ errorMessage: '토큰 타입이 Bearer 형식이 아닙니다.' });
        }

        const { nickname, role } = decodedAccessToken;

        let decodedAccessToken;
        try {
            // 액세스 토큰 검증
            decodedAccessToken = jwt.verify(accessTokenValue, 'access-secret-key', {
                expiresIn: '10s',
            });
        } catch (error) {
            // 액세스 토큰이 만료된 경우
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ errorMessage: '토큰이 만료되었습니다.' });
            }
            // 리프레시 토큰 검증
            const { refreshToken } = req.cookies;

            const decodedRefreshToken = jwt.verify(refreshToken, 'refresh-secret-key');

            if (!decodedRefreshToken) {
                return res.status(401).json({ errorMessage: '리프레시 토큰이 유효하지 않습니다.' });
            }

            // 액세스 토큰이 만료되었을 경우, 새로운 액세스 토큰 발급
            const newAccessToken = jwt.sign({ nickname, role }, 'access-secret-key', {
                expiresIn: '10m',
            });
            res.cookie('accessToken', newAccessToken, { httpOnly: true });
            // 다음 미들웨어로 진행
            return next();
        }

        // 사용자 확인
        const user = await prisma.users.findFirst({ where: { nickname } });
        if (!user) throw new Error('사용자가 존재하지 않습니다.');

        req.user = user;
        req.role = role;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ errorMessage: '토큰이 조작되었습니다.' });
        }
        return res.status(400).json({ errorMessage: error.message });
    }
}
