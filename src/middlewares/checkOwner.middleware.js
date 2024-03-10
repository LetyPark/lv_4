export default async function checkOwner(req, res, next) {
    try {
        // 401 사장님(OWNER) 토큰을 가지고 있지 않은 경우
        if (res.locals.role !== 'OWNER') {
            return res.status(401).json({ message: '사장님만 사용할 수 있는 API입니다.' });
        }
        // 다음 미들웨어로 진행
        return next();
    } catch (error) {
        return next(error);
    }
}
