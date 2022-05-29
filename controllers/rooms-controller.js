const RoomDto = require("../dtos/roomDto");
const roomService = require("../services/roomService");

class RoomsController{
    async create(req,res){
        //rooms
        const {topic,roomType} = req.body;
        console.log(req.body);
        if(!topic || !roomType){
            return res.status(400).json({message:"All fields are required"})
        }

        const room = await roomService.create({
            topic,
            roomType,
            ownerId: req.user._id
        });

        return res.json(new RoomDto(room));

    }

    async index(req,res){
        const rooms = await roomService.getAllRooms(['open']);
        const allRooms = rooms.map(room => new RoomDto(room));
        return res.json(allRooms);
    }

    async show(req,res){
        const room = await roomService.getRoom(req.params.roomId);
        return res.json(room);
    }


}

module.exports = new RoomsController();