const tokenService = require("../services/tokenService");

module.exports = async function(req,res,next){
    try {
        const {accessToken} = req.cookies;
        if(!accessToken){
            throw new Error();
        }
        console.log(accessToken);
        const userData = await tokenService.verifyAccessToken(accessToken);
        console.log(userData);

        if(!userData){
            throw new Error();
        }

        req.user = userData;
        next();
        
    } catch (error) {
        console.log(error)
        res.status(401).json({message:'Invalid token'})
    }
}