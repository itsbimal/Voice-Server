class userDto{
    id;
    phone;
    activated;
    createdAt;
    name;
    profile;

    constructor(user){
        this.id = user._id;
        this.phone = user.phone;
        this.name = user.name;
        this.profile = user.profile;
        this.activated = user.activated;
        this.createdAt = user.createdAt;
    }
}

module.exports = userDto;