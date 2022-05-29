const otpService = require("../services/otpService");
const hashService = require("../services/hashService");
const userService = require("../services/userService");
const tokenService = require("../services/tokenService");
const UserDto = require("../dtos/userDto");

class AuthController {
  async sendOtp(req, res) {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ message: "You have to enter number" });
    }

    // Generating random number
    const otp = await otpService.generateOtp();

    // Time for valid hash (2MIN)
    const validity_time = 1000 * 60 * 10;

    // Time for validity expire
    const expire_time = Date.now() + validity_time;

    const data = `${phone}.${otp}.${expire_time}`;

    // Hashing
    const hash = hashService.hashOtp(data);

    // Sending otp verification
    try {
      await otpService.sendOtp(phone, otp);
      res.json({
        hash: `${hash}.${expire_time}`, // . is seperator
        phone,
        // otp
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Failed to send SMS" });
    }
  }

  async verifyOtp(req, res) {
    const { otp, hash, phone } = req.body;
    if (!otp || !hash || !phone) {
      res.status(400).json({ message: "Something is missing!" });
    }

    const [hashedOtp, expire_time] = hash.split(".");
    if (Date.now() > +expire_time) {
      res.status(400).json({ message: "OTP code no longer valid!" });
    }

    const data = `${phone}.${otp}.${expire_time}`;

    const isValid = otpService.verifyOtp(hashedOtp, data);

    if (!isValid) {
      res.status(400).json({ message: "Invalid Code!" });
    }

    let user;

    // checking and creating user
    try {
      user = await userService.findUser({ phone });
      if (!user) {
        user = await userService.createUser({ phone });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Database error occured" });
    }

    // Token generations
    const { accessToken, refreshToken } = tokenService.generateToken({
      _id: user._id,
      activated: false,
    });

    // refreshtoken database
    await tokenService.storeRefreshToken(refreshToken, user._id);

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
    });

    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
    });

    const userDto = new UserDto(user);
    res.json({ user: userDto, auth: true }); // important
  }
  
  // solving frequent logout
  async refresh(req, res) {
    // get refresh token from cookie
    const { refreshToken: refreshTokenFromCookie } = req.cookies;

    // chech if it is valid
    let userData;
    try {
      userData = await tokenService.verifyRefreshToken(refreshTokenFromCookie);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Invalid Token" });
    }

    // check if token is in dAtabase
    let token;
    try {
        token = await tokenService.findRefreshToken(userData._id, refreshTokenFromCookie);
    } catch (error) {
        return res.status(401).json({message:'Invalid token'});
    }
    
    // generate new token
    if (!token){
        return res.status(500).json({message:'Token not found'});
        
    }
    // Chech if user is valid
    const user = await userService.findUser({_id:userData._id});
    if(!user){
        return res.status(404).json({message:'User not found'});

    }
    //Generate new token
    const {refreshToken,accessToken} = tokenService.generateToken({_id:userData._id})

    // Update refreshtoken in database
    try {
        await tokenService.updateRefreshToken(userData._id,refreshToken)
    } catch (error) {
        return res.status(500).json({message:'Update Failed'});
        
    }

    // put token in cookie
    res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      });
  
      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      });
  
      const userDto = new UserDto(user);
      res.json({ user: userDto, auth: true }); // important
    
    // response
  }
  
  async logout(req,res){
      const {refreshToken} = req.cookies;
      // delete refresh token
      await tokenService.deleteToken(refreshToken);

      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');
      res.json({user:null, auth: false});
  }
}

module.exports = new AuthController();
