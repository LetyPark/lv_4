import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

// 원래 비밀키는 .env 파일을 이용해 관리해야 한다.
const ACCESS_TOKEN_SECRET_KEY = 'access-secret-key';
const REFRESH_TOKEN_SECRET_KEY = 'refresh-secret-key';

const tokenStorages = {};

export default async function (req, res, next) {
    try {
        const { accessToken, refreshToken } = req.cookies;
        // 400 토큰이 존재하지 않는 경우
        if (!accessToken || !refreshToken) {
            return res
                .status(400)
                .json({ errorMessage: 'Access Token 또는 Refresh Token이 존재하지 않습니다.' });
        }
        console.log('🎫🎫🎫' + accessToken);
        console.log('🎟️🎟️🎟️' + refreshToken);

        tokenStorages[refreshToken] = {
            nickname: req.nickname,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        };

        const [accessTokenType, accessTokenValue] = accessToken.split(' ');
        const [refreshTokenType, refreshTokenValue] = refreshToken.split(' ');
        if (accessTokenType !== 'Bearer' || refreshTokenType !== 'Bearer') {
            res.clearCookie();
            return res.status(400).json({ errorMessage: '토큰 타입이 Bearer 형식이 아닙니다.' });
        }

        // jwt 토큰 검증
        const decodedAccessToken = jwt.verify(accessTokenValue, ACCESS_TOKEN_SECRET_KEY);
        const decodedRefreshToken = jwt.verify(refreshTokenValue, REFRESH_TOKEN_SECRET_KEY);

        // 인증에 실패하거나 해독된 토큰이 이 없을 때
        if (!decodedAccessToken || !decodedRefreshToken) {
            return res.status(401).json({ errorMessage: '토큰이 정상적이지 않습니다.' });
        }
        console.log('🎫🎫🎫' + decodedAccessToken);
        console.log('🎟️🎟️🎟️' + decodedRefreshToken);

        const { nickname, role } = decodedAccessToken;

        const user = await prisma.users.findFirst({ where: { nickname } });
        if (!user) throw new Error('사용자가 존재하지 않습니다.');

        req.user = user;
        req.role = role;

        // 액세스 토큰이 만료되었을 경우, 새로운 액세스 토큰 발급
        const userInfo = tokenStorages[refreshToken];
        if (!userInfo) {
            return res
                .status(419)
                .json({ errorMessage: 'Refresh Token의 정보가 서버에 존재하지 않습니다.' });
        }

        const newAccessToken = jwt.sign(decodedAccessToken, ACCESS_TOKEN_SECRET_KEY);

        res.cookie('accessToken', `Bearer ${newAccessToken}`);

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ errorMessage: '토큰이 만료되었습니다.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ errorMessage: '토큰이 조작되었습니다.' });
        }
        return res.status(400).json({ errorMessage: error.message });
    }
}
