const asyncHandler = function(requestHandler){
    (request,response,next)=>{
        Promise.resolve(requestHandler()).
        catch((error) => { next(error) })
    }
}


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


export {asyncHandler} ; 