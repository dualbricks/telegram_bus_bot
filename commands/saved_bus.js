module.exports = {
  name: "saved_bus",
  description: "return a list of saved bus stops of a given user",
  async execute(ctx, bot) {
    const fs = require("fs");
    var xpPath = "./bus.JSON";
    var xpRead = fs.readFileSync(xpPath);
    var xpFile = JSON.parse(xpRead); //ready for use
    var user = bot.update.message.from.username;
    function read(path) {
      const fileContent = fs.readFileSync(path);
      const array = JSON.parse(fileContent);
      return array;
    }
    
    if(ctx.length !=5) {
      bot.reply("Invalid Code! please double check");
      return 0;
    }
    
    var userData = read("./bus.JSON")
    if(userData[user]) {
      if(userData[user][ctx]) {
        bot.reply("Already added this bus stop before!")
        return 0;
      }
    }
    
    var data = {};
    var busData = read("./busData.txt");
    for(const busStop of busData){
      if(busStop["BusStopCode"] == ctx) {
        data = busStop["Description"];
        break;
      }
    }
    if(data == {}) {
      bot.reply("No such busStop please double check!");
      return 0;
    }
    if (!xpFile[user]) {
      xpFile[user] = {
        [ctx]: data,
      };
      console.log("test2");
    } else {
      xpFile[user][ctx] = data
      console.log("test1");
    }
    fs.writeFileSync(xpPath, JSON.stringify(xpFile, null, 2));
    console.log("sup")
    return 1;
  },
  
};
