const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    phone: {type:String, require:true},
    name: {type:String, require:false},
    profile: {type:String, required:false, get:(profile) => {
        return `${process.env.BASE_URL}${profile}`;
    }},
    activated: {type:Boolean, required:false, default:false}
},{
    timestamps:true.valueOf,
    toJSON: {getters:true}
})

module.exports = mongoose.model('User',userSchema,'users');