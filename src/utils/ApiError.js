class ApiError extends Error{
    constructor(statusCode, message = "Something Went Wrong", error = [], stack = ""){
        super(message);

        this. statusCode = statusCode
        this.message = message
        this.error = error
        this.data = null
        this.success = false

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export {ApiError};
//const asyncHandler = () => {}
//const asyncHandler = (func) => () => {}
//const asyncHandler = (func) => async () => {} 

// const asyncHandler = (func) => async (err, req, res, next) => {
//     try{
//         await func(err, req, res, next)
//     }
//     catch(error) {
//             res.status(err.code || 500).json({
//                 flag: false,
//                 message: err.message
//             })
//         }
//     }