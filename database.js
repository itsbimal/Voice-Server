
const { default: mongoose } = require("mongoose");

function DbConnect(){
    const DB_URL = process.env.DB_URL;
    mongoose.connect(DB_URL,
       err =>{
           if(err) throw err;
           console.log('Database Connected!')
       }
    );
    
}

module.exports = DbConnect;