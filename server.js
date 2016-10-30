
var express = require('express')
  , http = require('http')
  , path = require('path')
  , firebase = require("firebase")
  , request = require('request');
var app = express();

firebase.initializeApp({
  serviceAccount: "SERVICE_ACCOUNT_JSON_FILE.json",
  databaseURL: "https://FIREBASE_DATABASE_URL.firebaseio.com"
});


var db = firebase.database();
var ref = db.ref("chatItems");

function sendNotificationToUser(fcmID,data) {
  request({
    url: 'https://fcm.googleapis.com/fcm/send',
    method: 'POST',
    headers: {
      'Content-Type' :' application/json',
      'Authorization': 'key=AUTHORIZATION_KEY'
    },
    body: JSON.stringify(data)
  }, function(error, response, body) {
    if (error) { 
      console.log(error);
       }
    else if (response.statusCode >= 400) { 
      console.log('HTTP Error: '+response.statusCode+' - '+response.statusMessage); 
    }
    else{
      console.log("success: ",body);
    }
  });
}

ref.on("child_added", function(snapshot, prevChildKey) {
  var phoneNumber=snapshot.key;
  var phRef=db.ref("chatItems/"+phoneNumber);
  phRef.on("child_added",function(snapshot,prevChildKey){
    var data=snapshot.val();
    var fcmRef=db.ref("fcmTokens/"+phoneNumber);  
    fcmRef.once("value",function(snap) {
      var fcmClientTokenObj=snap.val();
      if(fcmClientTokenObj!=null){
        var sendTo=fcmClientTokenObj[Object.keys(fcmClientTokenObj)[0]];
        var data={ "to" : sendTo
            ,"data" : {"refresh": "true"}
            ,"collapse_key": "chat_notify"
            ,"time_to_live": 2419200
            ,"priority": "high"
          };
        sendNotificationToUser(sendTo,data);
      }
  });
  });
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
