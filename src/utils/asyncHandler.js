const asyncHandler = function (requestHandler) {
    return (request, response, next) => {
        Promise.resolve(requestHandler(request, response, next)).
            catch((error) => { next(error) })
    }
}

// To understand middlewares refer to this chat with claude.ai : https://claude.ai/share/c43df8f7-d3ad-4743-8bec-4a7b40cd6ea8


// const asyncHandler = ()=>{}
// const asyncHandler = (function) => {() => {}};
// const asyncHandler = (function) => {async () => {}};

// Try-Catch way
// const asyncHandler = (requestHandler) => async (response,request,next)=> {
//     try {
//         await requestHandler(request,response,next)
//     } catch (error) {
//         response.status(error.code || 500).
//         json({
//             success : false,
//             message : error.message, 
//         })
//     }
// }


export { asyncHandler }; 