//This is a helper file or a wrapper that handles asynchronous operations. We can handle requests and
//respones using this file. By using this file we don't need try catch in api's. 
//AsyncHandler is used to handle web requests.

//Method 1:
//How to create a higher order Function:
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

//Method 2:
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
      Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}
export {asyncHandler};