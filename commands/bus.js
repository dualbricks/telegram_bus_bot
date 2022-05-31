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
    const fs = require("fs");
    var user_location = { lat: lat, lng: lon };

    
    // reading from file
    function read(path) {
      const fileContent = fs.readFileSync(path);
      const array = JSON.parse(fileContent);
      return array;
    }

    var bus_data = read('./busData.txt');
    var nearby_buslist = [];
    bus_data.forEach((busStop) => {
      var busLat = parseFloat(busStop["Latitude"]);
      var busLon = parseFloat(busStop["Longitude"]);
      var bus_location = { lat: busLat, lng: busLon };
      var dist = haversine(user_location, bus_location);

      // nearby bus stop within 300m

      if (dist <= 300) {
        nearby_buslist.push({
          buscode: busStop.BusStopCode,
          Des: busStop.Description,
          dist: dist,
        });
      }
    });

    nearby_buslist.sort(function (a, b) {
      return a.dist - b.dist;
    });
    var text = "";
    // loop to get ETA for buses in each nearby bus stop
    async function busStop_info() {
      for (const busCode of nearby_buslist) {
        var bus_list = await busStop.execute(busCode.buscode).catch("Bus List Error");
        var busStopinfo = [busCode.Des, Math.round(busCode.dist), bus_list];
        var busStopText = `🅿️Bus Stop: ${busStopinfo[0]} \nDistance from you: ${busStopinfo[1]}m\n`;

        var bus_services = "";
        busStopinfo[2].forEach((busSev) => {
          bus_services =
            bus_services +
            "🚌Bus Service: " +
            busSev["busNo"] +
            "\n🕐ETA: " +
            busSev["ETA1"] + busSev["Load1"] + ", " + busSev["ETA2"] + busSev["Load2"] +
            "\n\n";
        });
        text =
          text +
          busStopText +
          bus_services +
          "-------------------------------------\n";
          
      }
      return text;
    }
    var bus_timing = await busStop_info();
    
    return bus_timing;
  },
};
