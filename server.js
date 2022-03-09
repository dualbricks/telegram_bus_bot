const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.bot_key);
const bus_command = require('./commands/bus');
const bus_code_command = require('./commands/busStop');

//bot start command
bot.start( async (ctx) => {
  console.log('working');
  ctx.reply("Welcome");
  bot.telegram.sendMessage(ctx.chat.id, 'Can we access your location?', requestLocationKeyboard);
})



// Listening for location
bot.on('location', async (ctx) => {
  location = await ctx.update.message.location;
  ctx.reply("Please wait while we retrieve some info...");
  bus_command.execute(location, ctx);
  
})
//Listening for valid bus code 
bot.on('message', async (ctx)=> {
  var length = Math.log(ctx.update.message.text) * Math.LOG10E + 1 | 0;
  if(ctx.update.message.text == "Use Bus Stop Code") {
    ctx.reply("Please provide me with a Bus Code");
  }
  else if(ctx.update.message.text == "cancel") {
    ctx.reply("Okay~ See you again! If you want ETA of your buses, just send over your Bus Stop Code or location anytime here");
  }
  else if(length != 5) {
    ctx.reply("Please provide a valid Bus Stop Code");
    }
  
  else if(length == 5){
    var busCode = ctx.update.message.text;
    ctx.reply("Please wait while we retrieve some info...");
    var bus_list = await bus_code_command.execute(busCode,ctx).catch(console.log('empty'));
    var text = "";
    bus_list.forEach(busNo=> {
      text = text +
          "🚌Bus Service: " +
          busNo["busNo"] +
          "\nETA: " +
          busNo["ETA"] +
          "\n";
    })
    
    if(text != "") {
      ctx.reply(text).catch();
    }
    else {
      ctx.reply("No information please double check Bus Code");
    }
  }
})

// Setting up inline keyboard for location
const requestLocationKeyboard = {
  "reply_markup": {
    "one_time_keyboard": true,
    "keyboard": [
      [{
        text: "My Location",
        request_location: true,
        one_time_keyboard: true       
      }],
      ["Use Bus Stop Code"],
      ["cancel"]
      
      ]
  }
}

bot.launch()
