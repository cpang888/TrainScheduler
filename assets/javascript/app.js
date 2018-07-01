
var config = {
  apiKey: "AIzaSyBuweN3EUnz88jP-dqLcnYMBqvToSg40lc",
  authDomain: "cpang945-a0991.firebaseapp.com",
  databaseURL: "https://cpang945-a0991.firebaseio.com",
  projectId: "cpang945-a0991",
  storageBucket: "cpang945-a0991.appspot.com",
  messagingSenderId: "914525249010"
};

var dbData;
var dbDataArr = [];

firebase.initializeApp(config);
var database = firebase.database();

var trainName = "";
var destination = "";
var first_train_time = "";
var frequency = "";

function start() {
  console.log("inside start()");

  refreshTable();

  $("#submit").click(function() {
    event.preventDefault();

    console.log("submit new schedule");

    // get all the input from the screen
    trainName = $("#train-name").val().trim();
    destination = $("#destination").val().trim();
    first_train_time = $("#first-train-time").val().trim();
    frequency = $("#frequency").val().trim();

    // init the train schedule array so that we could store in Firebase
    var trainSchedule = [];

    // declare endDate so we don't add the next day mid-night train to the array
    var endDate = moment().endOf('day');
    
    // convert first train time to moment object
    // var train_time = moment(first_train_time, "HH:mm");
    // train_time = getMomentFromTimeString(train_time);
    console.log("first_train_time: " + first_train_time);
    var train_time = moment(first_train_time, "HH:mm");
    console.log("train_time before push: " + train_time);
    // push the first train time to array
    trainSchedule.push(train_time);

    // build the train schedule array for the rest of the day
    while (train_time < endDate) {

      // add train schedule to array
      train_time = getMomentFromTimeString(train_time);
      // add train frequency to train time so we could get the next train schedule
      train_time = train_time.add(frequency, 'minutes');
      
      var iscurrentDate = train_time.isSame(new Date(), "day");
      
      if(iscurrentDate) {
        // add to trainSchedule array only if it's current date
        trainSchedule.push(train_time);
      }
    }

    console.log(trainSchedule);
    for(var i=0; i<trainSchedule.length; i++) {
      var a = moment(trainSchedule[i]).format("LLL");
      console.log("trainSchedule: " + a);
    }

    // push all info to Firebase
    database.ref().push({
      trainName: trainName,
      destination: destination,
      first_train_time: first_train_time,
      frequency: frequency,
      trainSchedule: JSON.stringify(trainSchedule),
        dateAdded: firebase.database.ServerValue.TIMESTAMP
    });
  
    $("#form").children("option:not(:first)").remove();

    alert("You have added a train scheudle!");

    // clear input form fields
    clearInput();
  });

  function clearInput() {
    $("#train-name").val("");
    $("#destination").val("");
    $("#first-train-time").val("");
    $("#frequency").val("");
  }

  function getMomentFromTimeString(str) {
    var t = moment(str, 'HH:mm');
    return t;
  }

  function getNextArrivalTrain(trainScheduleArr) {
    var currentTime = moment();
    var anyNextTrain = false;

    for(var i=0; i<trainScheduleArr.length; i++) {
      var a = moment(trainScheduleArr[i]).format("LLL");
      var nextTrain = moment().diff(a) > 0;
      console.log("nextTrain: " + nextTrain);
      if(!nextTrain) {
        anyNextTrain = true;
        break;
      }
    }
    // need to check if there is no more train today
    // if yes, return next's day first train schedule
    if(!anyNextTrain) {
        // var temp = moment(trainScheduleArr[0]).format("LLL");
        var temp2 = moment(trainScheduleArr[0]).add(1, 'day').format("LLL");
        console.log("next morning first train: " + temp2);

        // also need to update the train achedule array in DB
        
        return temp2;
    }
    for(var i=0; i<trainScheduleArr.length; i++) {

      var a = moment(trainScheduleArr[i]).format("LLL");

      var nextTrain = moment().diff(a) > 0;
      console.log("nextTrain: " + nextTrain);
      if(!nextTrain) {
        console.log("nextTrain schedule: " + a);
        return a;
      // } else {
      //   // return first train next day
      //   var temp = moment(trainScheduleArr[0]).format("LLL");
      //   console.log("temp: " + temp);
      //   var temp2 = moment(trainScheduleArr[0]).add(1, 'day').format("LLL");
      //   return temp2;
      }
    }
  }

  database.ref().orderByChild("dateAdded").limitToLast(100).on("child_added", function(snapshot) {

    // get object from Firebase
    var trainName = snapshot.val().trainName;
    var destination = snapshot.val().destination;
    var first_train_time = snapshot.val().first_train_time;
    var frequency = snapshot.val().frequency;
    var trainSchedule = JSON.parse(snapshot.val().trainSchedule);

    var nextArrivalTrain = getNextArrivalTrain(trainSchedule);
    console.log("nextArrivalTrain time: " + nextArrivalTrain);

    var temp = moment().diff(moment(nextArrivalTrain), 'minute');
    // console.log("temp: " + temp);
    var minuteAway = Math.abs(temp);
    console.log(minuteAway);

    dbData = {dbTrainName: trainName, dbDestination: destination, dbFirstTrainTime: first_train_time,
                dbFrequency: frequency, dbTrainSchedule: trainSchedule};

    console.log(dbData);
    // build the dbDataArr so we don't have to go back to DB and get data
    // it's for refresh table
    dbDataArr.push(dbData);
    // build the train schedule table
     $("#table-body").append("<tr><td>" + dbData.dbTrainName + "</td><td>" + dbData.dbDestination + "</td><td>" + 
      dbData.dbFrequency + "</td><td>" + nextArrivalTrain + "</td><td>" + minuteAway + "</td></tr>");
    
  });
  
  function refreshTable() {
    console.log("refresh");
    $("#table-body").empty();

    // use the dbDataArr to build the table
    console.log(dbDataArr);
    dbDataArr.forEach(dbData => {
      var nextArrivalTrain = getNextArrivalTrain(dbData.dbTrainSchedule);
      console.log("nextArrivalTrain time: " + nextArrivalTrain);
  
      var temp = moment().diff(moment(nextArrivalTrain), 'minute');
      // console.log("temp: " + temp);
      var minuteAway = Math.abs(temp);

      $("#table-body").append("<tr><td>" + dbData.dbTrainName + "</td><td>" + dbData.dbDestination + "</td><td>" + 
      dbData.dbFrequency + "</td><td>" + nextArrivalTrain + "</td><td>" + minuteAway + "</td></tr>");
 
    });
 
    // auto refresh every minute
    setInterval(function(){ 
      // $("#table-body").empty();
      refreshTable();
    }, 60000);
  }
}

$(document).ready(function() {
  // when document is ready, call the start method
  start();
  
})