import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

export default async function (req, res, next) {
    try {
        const { accessToken, refreshToken } = req.cookies;

        // 400 토큰이 존재하지 않는 경우
        if (!accessToken) {
            throw new Error('Access Token 이 존재하지 않습니다.');
        }

        // 액세스 토큰 형식이 Bearer 형식이 아닌 경우
        const [accessTokenType, accessTokenValue] = accessToken.split(' ');
        if (accessTokenType !== 'Bearer') {
            res.clearCookie();
            throw new Error('토큰 타입이 Bearer 형식이 아닙니다.');
        }

        let decodedAccessToken;
        try {
            // 액세스 토큰 검증
            decodedAccessToken = jwt.verify(accessTokenValue, process.env.ACCESS_TOKEN_SECRET);
        } catch (error) {
            // 액세스 토큰이 만료된 경우
            if (error.name === 'TokenExpiredError') {
                // 액세스 토큰이 만료되었고 리프레시 토큰이 없는 경우
                if (!refreshToken) {
                    return res
                        .status(401)
                        .json({ errorMessage: '리프레시 토큰이 없습니다. 다시 로그인 해주세요.' });
                }

                // 액세스 토큰이 만료되었고 리프레시 토큰이 있는 경우
                let decodedRefreshToken;
                try {
                    // 리프레시 토큰 검증
                    decodedRefreshToken = jwt.verify(
                        refreshToken,
                        process.env.REFRESH_TOKEN_SECRET
                    );
                } catch (refreshError) {
                    return res
                        .status(401)
                        .json({ errorMessage: '리프레시 토큰이 유효하지 않습니다.' });
                }

                // 리프레시 토큰의 페이로드에서 사용자 정보 추출
                const { nickname, userType } = decodedRefreshToken;
                // 페이로드에 저장할 데이터
                const payload = { nickname, role: userType };
                // const payload = { nickname, userType };

                // 액세스 토큰이 만료되었을 경우, 새로운 액세스 토큰 발급
                const newAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '10m',
                });
                const newRefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
                    expiresIn: '7d',
                });
                res.cookie('accessToken', newAccessToken, { httpOnly: true }); // 'httpOnly:true' : 브라우저는 스크립트를 통해 쿠키에 접근할 수 없게 된다. 이는 보안을 강화하는 데 도움된다.
                res.cookie('refreshToken', newRefreshToken, { httpOnly: true });
                // 다음 미들웨어로 진행
                return next();
            }
            return res.status(401).json({ errorMessage: '토큰이 조작되었습니다.' });
        }
        // 값 추출
        const { nickname, role: userType } = decodedAccessToken;
        // 사용자 확인
        const user = await prisma.users.findUnique({ where: { nickname } });
        if (!user) throw new Error('토큰의 사용자가 존재하지 않습니다.');

        res.locals.user = user;
        res.locals.role = userType;

        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ errorMessage: '토큰이 조작되었습니다.' });
        }
        return res.status(400).json({ errorMessage: error.message });
    }
}
