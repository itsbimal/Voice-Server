const jimp = require("jimp");
const { dirname } = require("path");
const path = require("path");
const userDto = require("../dtos/userDto");
const tokenService = require("../services/tokenService");
const userService = require("../services/userService");

class ActivateController {
  async activate(req, res) {
    const { name, profile } = req.body;
    // console.log("Hello" + res.body)
    
    if (!name || !profile) {
      res.status(400).json({ message: "All field are required" });
      return;
    }

    // For image converting
    const buffer = Buffer.from(
      profile.replace(/^data:image\/(png|jpg|jpeg|gif);base64./, ""),
      "base64"
    );

    const imagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`; // changing name

    try {
      const jimpResp = await jimp.read(buffer);
      jimpResp.resize(150, jimp.AUTO).write(path.resolve(__dirname, `../storage/${imagePath}`));
       
    } catch (error) {
      res.status(500).json({ message: "Image processing failed.." });
    }

    const userId = req.user._id;
    let user;
    // Updating user
    try {
      user = await userService.findUser({ _id: userId });
      if (!user) {
        res.status(404).json({ message: "user not found" });
      }

      console.log(user);

      user.activated = true;
      user.name = name;
      user.profile = `/storage/${imagePath}`;
      user.save();

    
    } catch (error) { 
        res.status(500).json({message:'Something went wrong in database!'});
    }

    res.json({user: new userDto(user),Auth:true});
    return;
  }
  
}

module.exports = new ActivateController();
