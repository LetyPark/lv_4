export default function (err, req, res, next) {
    console.error(err);

    let statusCode = 500;
    let errorMessage = '서버 내부에서 에러가 발생했습니다.';

    if (err.statusCode === 404) {
        if (err.categoryNotFound) {
            statusCode = 404;
            errorMessage = '존재하지 않는 카테고리입니다.';
        } else if (err.menuNotFound) {
            statusCode = 404;
            errorMessage = '존재하지 않는 메뉴입니다.';
        } else if (err.orderNotFound) {
            statusCode = 404;
            errorMessage = '존재하지 않는 주문내역입니다.';
        }
    } else if (err.statusCode === 400) {
        if (err.priceZero) {
            console.log('🎉🎉🎉🎉🎉Price is zero');
            statusCode = 400;
            errorMessage = '메뉴 가격은 0일 수 없습니다.';
        } else if (err.priceInvalid) {
            statusCode = 400;
            errorMessage = '메뉴 가격은 0보다 작을 수 없습니다.';
        } else {
            statusCode = 400;
            errorMessage = '데이터 형식이 올바르지 않습니다.';
        }
    }

    // 클라이언트에게 응답 전송
    res.status(statusCode).json({
        errorMessage: errorMessage,
    });
}
