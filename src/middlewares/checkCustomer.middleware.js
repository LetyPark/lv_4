export default async function checkCustomer(req, res, next) {
    try {
        // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우
        if (res.locals.role !== 'CUSTOMER') {
            return res.status(401).json({ message: '소비자만 사용할 수 있는 API입니다.' });
        }
        // 다음 미들웨어로 진행
        return next();
    } catch (error) {
        return next(error);
    }
}
