import jwt from 'jsonwebtoken';
import {prisma} from '../utils/prisma/index.js';

export default async function (req, res, next) {
    try {
        // 1. 클라이언트로 부터 쿠키를 전달받는다
        const {authorization} = req.cookies;
        // 쿠키가 존재하지 않으면, 인증된 사용자가 아니다
        if(!authorization) 
        throw new Error('요청한 사용자의 토큰이 존재하지 않습니다.');
        // 2.쿠키가 Bearer  형식인지 확인
        const [tokenType, token] = authorization.split(" ");
        // 만약 토큰 타입이 Bearer 가 아닐때 오류
        if(tokenType !=='Bearer') 
        throw new Error('토큰 타입이 Bearer 형식이 아닙니다');

        // JWT를 사용하여 서버에서 발급한 토큰이 유효한지 검증
        const decodedToken = jwt.verify(token, "custom-secret-key");

        // JWT의 userId를 사용하여 사용자 조회
        const userId = decodedToken.id;
        const user = await prisma.users.findUnique({
            where: { id: +userId }
        });

        // 사용자가 존재하지 않으면 에러
        if (!user) throw new Error('토큰 사용자가 존재하지 않습니다');

        // req.user에 조회된 사용자 정보 할당
        req.user = user;

        // 토큰에 있는 역할 정보를 가져옴
        const role = decodedToken.role;

        // req.user에 역할 정보 할당
        req.user.role = role;

        // 5. req.user에 조회된 사용자 정보 할당 
        req.user = user;

        next();

    }catch (error) {
        // 여기서 옵션으로 세부 에러 설정을 할수 있음
        if (error.name === "TokenExpiredError")
          return res.status(400).json({ Message: '토큰이 만료되었습니다' });
    if(error.name === 'JsonWebTokenError') return res.status(401).json({message : '토큰이 조작되었습니다.'})
    
    // 맨막줄은 모두 아닐때 거의 디폴트 같은 늑김
        return res.status(400).json({ message: error.message });
      }
    
    }

// 