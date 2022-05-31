module.exports = {
  name: "busStop",
  description: "return the ETA of buses at a given Bus Stop Code",
  async execute(ctx, bot, saving=false) {
    
    // Getting axios client 
    const axios = require("axios");
    
    var crowd_dict = {
      "SEA": "🟢", "SDA": "🟠", "LSD":"🔴"
    }
    // getting ETA given time
    function estimatedTime(busTime) {
      var time_bus = busTime.split(/[T+]/)[1];
      var busRealHours = time_bus.split(":");
      var busComingSecs =
        Math.floor(busRealHours[0] * (60 * 60)) +
        Math.floor(busRealHours[1] * 60) +
        Math.floor(busRealHours[2]);
      var timeNow = new Date();
      var timeHour = timeNow.getHours() + 8;

      if (timeHour >= 24) {
        timeHour = timeHour - 24;
      }
      
      var timeMin = timeNow.getMinutes();
      var timeSec = timeNow.getSeconds();
      var timeIRL =
        Math.floor(timeHour * (60 * 60)) +
        Math.floor(timeMin * 60) +
        Math.floor(timeSec);
      var estimatedTime = busComingSecs - timeIRL;
      var estimatedMin = Math.floor(estimatedTime / 60);

      if (estimatedMin <= 0.5) {
        estimatedMin = "Arriving";
        return estimatedMin;
      }
      if (estimatedMin <= 1) {
        return estimatedMin + 'Min';
        
      }
      return estimatedMin + 'Mins';
    }

    // getter function 
    async function getBusData(url, config) {
      let res = await axios.get(url, config);
      let data = res.data;
      return data;
    }
    

    //configuration for API calls
    let url = `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${ctx}`;
    let config = {
      headers: {
        accept: "application/json",
        AccountKey: process.env.bus_key,
      },
    };
    // Getting services in a given bus stop
    var nextBusList = [];
    let bus_data = await getBusData(url, config).catch();
    var services = bus_data["Services"];
    services.forEach((bus) => {
      if (bus.NextBus.EstimatedArrival) {
        var time1 = estimatedTime(bus.NextBus.EstimatedArrival);
        var crowd1 = crowd_dict[bus.NextBus.Load];
      }
      else{
        var time1 = "No Info"
        var crowd1 = "";
      }
      if (bus.NextBus2.EstimatedArrival) {
        var time2 = estimatedTime(bus.NextBus2.EstimatedArrival);
        var crowd2 = crowd_dict[bus.NextBus2.Load]; 
        
      }
      else{
        var time2 = "";
        var crowd2 = "";
      }
      
      
      
      nextBusList.push({ busNo: bus.ServiceNo, ETA1: time1, ETA2:time2, Load1: crowd1, Load2: crowd2 });
    });
    //sort
    nextBusList.sort(function (a, b) {
      return a.busNo - b.busNo;
    });
    // The list of ETA for the buses at the bus stop
    return nextBusList;
  },
};
