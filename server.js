const { Telegraf } = require('telegraf')
const bot = new Telegraf(process.env.bot_key)
const bus_command = require('./commands/bus');


//bot start command
bot.start( async (ctx) => {
  console.log('working')
  ctx.reply("Welcome");
  bot.telegram.sendMessage(ctx.chat.id, 'Can we access your location?', requestLocationKeyboard);
})



// Listening for location
bot.on('location', async (ctx) => {
  location = await ctx.update.message.location;
  ctx.reply("Please wait while we retrieve some info...");
  bus_command.execute(location, ctx);
  
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
      ["cancel"]
      
      ]
  }
}

bot.launch()