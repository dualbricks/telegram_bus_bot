const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.bot_key);
const bus_command = require("./commands/bus");
const bus_code_command = require("./commands/busStop");
const fs = require("fs");
const justin = require("./justin.js");
const save_function = require("./commands/saved_bus");
//bot start command


function isEmpty(obj) {
      return Object.keys(obj).length === 0;
    }


bot.start(async (ctx) => {
  console.log("working");
  ctx.reply("Welcome");
  var xpPath = "./user.JSON";
  var xpRead = fs.readFileSync(xpPath);
  var xpFile = JSON.parse(xpRead); //ready for use
  var user = ctx.update.message.from.username;
  if (!xpFile[user]) {
    xpFile[user] = "visited";
    fs.writeFileSync(xpPath, JSON.stringify(xpFile, null, 2));
  }
  await bot.telegram.sendMessage(
    ctx.chat.id,
    "Please send over your location or bus stop code thanks~ Alternatively, you can use the custom keyboard for commands/help",
    requestLocationKeyboard
  );
  ctx.replyWithPhoto({url:"https://cdn.glitch.global/0cebf716-f12e-43cb-bc42-c5fefd10548c/telegram3.PNG?v=1654006159630"})
});

let dict = {};
let dict2 = {};

// Listening for location
bot.on("location", async (ctx) => {
  location = await ctx.update.message.location;
  ctx.reply("Please wait while we retrieve some info...");
  var text = await bus_command.execute(location, ctx).catch((error) => {
    ("LTA Services down. Please try again later");
  });
  dict[ctx.chat.id] = location;
  ctx.reply("🟢= LOW crowd,🟠= MODERATE crowd\n🔴= BIG crowd\n\n" + text, {
    reply_markup: {
      inline_keyboard: [[{ text: "Update", callback_data: "Location" }]],
    },
  });
});

bot.on("message", async (ctx) => {
  var command = ctx.update.message.text;
  var length = (Math.log(command) * Math.LOG10E + 1) | 0;
  if (command == "Use Bus Stop Code") {
    ctx.reply("Please provide me with a Bus Code");
  } else if (command == "Cancel") {
    ctx.reply(
      "Okay~ See you again! If you want ETA of your buses, just send over your Bus Stop Code or location anytime here"
    );
  } else if (command == "Saved Bus Stops") {
    //Loading bus.JSON
    var xpPath = "./bus.JSON";
    var xpRead = fs.readFileSync(xpPath);
    var xpFile = JSON.parse(xpRead); //ready for use
    var user = ctx.update.message.from.username;

    if (!xpFile[user]) {
      ctx.reply(
        "You don't have any saved bus stops yet. Please follow the image below for instructions on how to add one."
      );
      ctx.replyWithPhoto({ url: 'https://cdn.glitch.global/0cebf716-f12e-43cb-bc42-c5fefd10548c/telegram_1.PNG?v=1654001742766' });
      return;
    } else {
      var userData = xpFile[user];
      console.log(userData);
      var text = "";
      await ctx.reply("Please choose the bus stop you want");
      for (const stops in userData) {
        text = `🚌Bus Stop: ${userData[stops]} (${stops})\n\n\n`;
        ctx.reply(text, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "This one!!", callback_data: "code:" + stops }],
            ],
          },
        });
      }
    }
  } else if (command.includes("save") || command.includes("Save")) {
    var bus = command.split(" ")[1];
    console.log(bus);
    var result = await save_function.execute(bus, ctx).catch("error");
    if (result) {
      ctx.reply("Saved!");
    }
  } else if (command == "Delete Bus Stops") {
    ctx.reply(
      "Please provide me with the bus stop codes that you want to remove seperated by spaces. The image below shows you how"
    );
    ctx.replyWithPhoto({url: 'https://cdn.glitch.global/0cebf716-f12e-43cb-bc42-c5fefd10548c/telegram%202.PNG?v=1654002201858'});
  } else if (command.includes("delete") || command.includes("Delete")) {
    var bus = command.split(" ");
    bus.shift();
    console.log(bus);
    var xpPath = "./bus.JSON";
    var xpRead = fs.readFileSync(xpPath);
    var xpFile = JSON.parse(xpRead); //ready for use
    var user = ctx.update.message.from.username;
    var userData = xpFile[user];
    if (isEmpty(xpFile[user])) {
      ctx.reply("You dont have any bus stops saved!");
      return;
    }
    try {
      for (const codes of bus) {
        if (!xpFile[user][codes]) {
          var text = "";
          ctx.reply(
            "Please provide bus stops you saved correctly. Here are the codes you saved:"
          );
          console.log(userData)
          for (const stops in userData) {
            text = text + `🚌Bus Stop: ${userData[stops]} (${stops})\n\n\n`;
          }
          console.log(text);
          console.log("yoooo");
          if (text != "") {
            ctx.reply(text);
          }
          return;
        }
        delete xpFile[user][codes];
        fs.writeFileSync(xpPath, JSON.stringify(xpFile, null, 2));
      }
    } catch {
      console.log("WIP");
    }

    ctx.reply(`Deleted a total of ${bus.length} stops`);
  } else if (length != 5) {
    ctx.reply("Please provide a valid Bus Stop Code");
  } else if (length == 5) {
    var busCode = ctx.update.message.text;
    dict2[ctx.chat.id] = busCode;
    await ctx.reply("Please wait while we retrieve some info...");
    var bus_list = await bus_code_command
      .execute(busCode, ctx)
      .catch((error) => {
        ctx.reply("No Response");
      });
    var text = "";
    if (bus_list) {
      bus_list.forEach((busNo) => {
        text =
          text +
          "🚌Bus Service: " +
          busNo["busNo"] +
          "\n🕐ETA: " +
          busNo["ETA1"] +
          busNo["Load1"] +
          ", " +
          busNo["ETA2"] +
          busNo["Load2"] +
          "\n\n";
      });
    }

    if (text != "") {
      ctx
        .reply("🟢= LOW crowd,🟠= MODERATE crowd\n🔴= BIG crowd\n\n" + text, {
          reply_markup: {
            inline_keyboard: [[{ text: "Update", callback_data: "1" }]],
          },
        })
        .catch();
    } else {
      ctx.reply("No information please double check Bus Code");
    }
  }
});

// Setting up inline keyboard for location
const requestLocationKeyboard = {
  reply_markup: {
    keyboard: [
      [
        {
          text: "Use Location",
          request_location: true,
          one_time_keyboard: true,
        },
      ],
      ["Use Bus Stop Code"],
      ["Saved Bus Stops"],
      ["Delete Bus Stops"],
    ],
  },
};

bot.on("callback_query", async (callback) => {
  try {
    let user = callback.from.id;
    let query = callback.update.callback_query.data;
    let msg_id = callback.update.callback_query.message.message_id;
    let last_edit = callback.update.callback_query.message.edit_date;
    let last_edit2 = last_edit;
    if (!last_edit) {
      last_edit = callback.update.callback_query.message.date;
      last_edit2 = 0;
    }

    var current_timestamp = Math.floor(Date.now() / 1000);
    console.log(last_edit);
    console.log(current_timestamp);

    if (query === "Location" && current_timestamp - last_edit > 5) {
      console.log("test");
      var location = dict[user];

      if (location) {
        var text = await bus_command
          .execute(location, callback)
          .catch((error) => {
            ("LTA Services down. Please try again later");
          });
      } else {
        callback.telegram.editMessageText(
          user,
          msg_id,
          "",
          "Location expired.Please send over location again."
        );
        return;
      }

      var s = new Date(Date.now()).toLocaleTimeString("en-US", {
        timeZone: "Asia/Singapore",
      });
      if (text) {
        callback.telegram.editMessageText(
          user,
          msg_id,
          "",
          "🟢= LOW crowd,🟠= MODERATE crowd\n🔴= BIG crowd\n\n" +
            text +
            `\n Last refresh time: ${s}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Update", callback_data: "Location" }],
              ],
            },
          }
        );
        console.log("success!");
      } else {
        callback.telegram.editMessageText(
          user,
          msg_id,
          "",
          "LTA info down. Please try again later." +
            `\n Last refresh time: ${s}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Update", callback_data: "Location" }],
              ],
            },
          }
        );
      }

      return;
    }

    if (query === "1" && current_timestamp - last_edit > 5) {
      var busCode = dict2[user];
      if (!busCode) {
        callback.telegram.editMessageText(
          user,
          msg_id,
          "",
          "Code expired.Please send over code again."
        );
        return;
      }

      var bus_list = await bus_code_command
        .execute(busCode, callback)
        .catch((error) => {
          callback.reply("No Response");
        });

      var text = "";
      if (bus_list) {
        bus_list.forEach((busNo) => {
          text =
            text +
            "🚌Bus Service: " +
            busNo["busNo"] +
            "\n🕐ETA: " +
            busNo["ETA1"] +
            busNo["Load1"] +
            ", " +
            busNo["ETA2"] +
            busNo["Load2"] +
            "\n\n";
        });
      }
      var s = new Date(Date.now()).toLocaleTimeString("en-US", {
        timeZone: "Asia/Singapore",
      });

      if (text) {
        callback.telegram.editMessageText(
          user,
          msg_id,
          "",
          "🟢= LOW crowd,🟠= MODERATE crowd\n🔴= BIG crowd\n\n" +
            text +
            `\n Last refresh time: ${s}`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: "Update", callback_data: "1" }]],
            },
          }
        );
      } else {
        callback.telegram.editMessageText(
          user,
          msg_id,
          "",
          "LTA info down. Please try again later." +
            `\n Last refresh time: ${s}`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: "Update", callback_data: "code" }]],
            },
          }
        );

        return;
      }
    } else if (query.includes("code") && current_timestamp - last_edit2 > 5) {
      dict2[user] = query.split(":")[1];
      var busCode = dict2[user];
      if (!busCode) {
        callback.telegram.editMessageText(
          user,
          msg_id,
          "",
          "Code expired.Please send over code again."
        );
        return;
      }

      var bus_list = await bus_code_command
        .execute(busCode, callback)
        .catch((error) => {
          callback.reply("No Response");
        });

      var text = "";
      if (bus_list) {
        bus_list.forEach((busNo) => {
          text =
            text +
            "🚌Bus Service: " +
            busNo["busNo"] +
            "\n🕐ETA: " +
            busNo["ETA1"] +
            busNo["Load1"] +
            ", " +
            busNo["ETA2"] +
            busNo["Load2"] +
            "\n\n";
        });
      }
      var s = new Date(Date.now()).toLocaleTimeString("en-US", {
        timeZone: "Asia/Singapore",
      });

      if (text) {
        callback.telegram.editMessageText(
          user,
          msg_id,
          "",
          "🟢= LOW crowd,🟠= MODERATE crowd\n🔴= BIG crowd\n\n" +
            text +
            `\n Last refresh time: ${s}`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: "Update", callback_data: "code:" + query.split(":")[1]}]],
            },
          }
        );
      } else {
        callback.telegram.editMessageText(
          user,
          msg_id,
          "",
          "LTA info down. Please try again later." +
            `\n Last refresh time: ${s}`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: "Update", callback_data: "code:"+ query.split(":")[1] }]],
            },
          }
        );

        return;
      }
    }
  } catch (error) {
    console.log(error);
  }
});

bot.launch();
justin.server_on();
console.log("Running");
