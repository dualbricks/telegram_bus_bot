module.exports = {
  name: "Bus_Location",
  description: "Return the ETA of buses at a given location/Bus Stop",
  async execute(ctx, bot) {
    // setting up necessary modules
    const axios = require("axios");
    const busStop = require("./busStop");
    const haversine = require("haversine-distance");
    // object for location of user
    var lat = parseFloat(ctx["latitude"]);
    var lon = parseFloat(ctx["longitude"]);
    var user_location = { lat: lat, lng: lon };

    // Getter function
    async function getBusData(url, config) {
      let res = await axios.get(url, config);
      let data = res.data;
      return data;
    }

    var number = 0;

    // Configuration for API calls
    let url1 = `http://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${number}`;
    let config = {
      headers: {
        accept: "application/json",
        AccountKey: process.env.bus_key,
      },
    };
    var bus_data = [];

    // Loop to get all the bus stops
    while (number <= 5000) {
      var busStopData = await getBusData(url1, config);
      bus_data.push.apply(bus_data, busStopData["value"]);
      number += 500;
      url1 = `http://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${number}`;
    }

    var nearby_buslist = [];

    bus_data.forEach((busStop) => {
      var busLat = parseFloat(busStop["Latitude"]);
      var busLon = parseFloat(busStop["Longitude"]);
      var bus_location = { lat: busLat, lng: busLon };
      var dist = haversine(user_location, bus_location);

      // nearby bus stop within 500m

      if (dist <= 300) {
        nearby_buslist.push({
          buscode: busStop.BusStopCode,
          Des: busStop.Description,
          dist: dist,
        });
      }
    });
    
    nearby_buslist.sort(function (a,b) {
      return a.dist - b.dist;
    });

    // loop to get ETA for buses in each nearby bus stop
    async function busStop_info() {
      for (const busCode of nearby_buslist) {
      var bus_list = await busStop.execute(busCode.buscode);
      var busStopinfo = [busCode.Des, Math.round(busCode.dist), bus_list];
      console.log(busStopinfo);
      var bus_services = "";
      busStopinfo[2].forEach((busSev) => {
        bus_services =
          bus_services +
          "Bus Service: " +
          busSev["busNo"] +
          "\nETA: " +
          busSev["ETA"] +
          "\n";
      });
      console.log(bus_services);
      async function send_msg() {
        await bot.reply(
          `Bus Stop:${busStopinfo[0]} \nDistance from you: ${busStopinfo[1]}m\n`
        );
        
        await bot.reply(bus_services);
        await bot.reply(
          "-------------------------------------------------------------"
        );
      }

      await send_msg();
        
      }
    }
    await busStop_info();
    bot.reply(
      "If you are seeing this, the info is retreived correctly from LTA"
    );
  },
};
