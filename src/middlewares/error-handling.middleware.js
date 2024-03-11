export default function (err, req, res, next) {
    console.error(err);

    const errorMessages = {
        404: {
            categoryNotFound: '존재하지 않는 카테고리입니다.',
            menuNotFound: '존재하지 않는 메뉴입니다.',
            orderNotFound: '존재하지 않는 주문내역입니다.',
        },
        400: {
            priceZero: '메뉴 가격은 0일 수 없습니다.',
            priceInvalid: '메뉴 가격은 0보다 작을 수 없습니다.',
            default: '데이터 형식이 올바르지 않습니다.',
        },
        default: '서버 내부에서 에러가 발생했습니다.',
    };

    let statusCode = 500;
    let errorMessage = errorMessages[statusCode] || errorMessages.default;

    if (err.statusCode && errorMessages[err.statusCode]) {
        const errorType = Object.keys(err).find((key) => key !== 'statusCode');
        if (errorType && errorMessages[err.statusCode][errorType]) {
            statusCode = err.statusCode;
            errorMessage = errorMessages[statusCode][errorType];
        } else {
            errorMessage = errorMessages[statusCode].default;
        }
    }

    // 클라이언트에게 응답 전송
    res.status(statusCode).json({
        errorMessage: errorMessage,
    });
}
