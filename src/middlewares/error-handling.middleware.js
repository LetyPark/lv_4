export default function (err, req, res, next) {
    console.error(err);

    res.status(500).json({
        errorMessage: '서버 내부에서 에려가 발생했습니다.',
    });
}
