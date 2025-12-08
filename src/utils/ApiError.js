class ApiError extends Error {
    constructor(
        statusCode ,
        // Such type of message is notorious in production due to it's ambiguity
        message = "Something went wrong !",
        error = [],
        stack = "",
    ){
        super(message)
        this.statusCode = statusCode ;
        this.data = null;
        this.message = message;
        this.success = false ;
        this.errors = errors;

        if (stack) {
            this.stack = stack ;
        } else {
            Error.captureStackTrace(this,this.constructor)
        }
    };
}

export {ApiError} ;