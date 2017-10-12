require('es6-promise').polyfill();
require('isomorphic-fetch');


let dronesTest = [
    {
        "droneId": 321361,
        "location": {
            "latitude": -37.78290448241537,
            "longitude": 144.85335277520906
        },
        "packages": [
            {
                "destination": {
                    "latitude": -37.78389758422243,
                    "longitude": 144.8574574322506
                },
                "packageId": 7645,
                "deadline": 1500422916
            }
        ]
    },
    {
        "droneId": 493959,
        "location": {
            "latitude": -37.77718638788778,
            "longitude": 144.8603578487479
        },
        "packages": []
    }
]




let packagesTest = [
    {
        "destination": {
            "latitude": -37.78404125474984,
            "longitude": 144.85238118232522
        },
        "packageId": 8041,
        "deadline": 1590000000
    },
    {
        "destination": {
            "latitude": -37.77058198385452,
            "longitude": 144.85157121265505
        },
        "packageId": 8218,
        "deadline": 1500423287
    }
]

const geodist = require('geodist')
const depot = {lat: -37.816218, lon: 144.964068}
const options = {exact: true, unit: 'km'}
const currentTime = Math.round((new Date).getTime()/1000);


function assignPackages(drones, packages){
  let results = {assignments: [], packages: []}

  for(let i = 0; i < packages.length; i++){
    let assignment = findDrone(packages[i], drones)
    if(assignment.time === 0){
      results.packages.push(packages[i].packageId)
    } else {
      results.assignments.push(assignment)
    }
  }

  console.log(results)
}

function findDrone(pack, drones){
  let minTime = {time: 0, droneId: 0, packageId: 0}
  let estimatedReturn
  let deliveryTime
  for(let i = 0; i < drones.length; i++){
    if(drones[i].packages.length){
      deliveryTime = calcTimeToDelivery(drones[i])
      estimatedReturn = calcTimeBackToDepot(drones[i])
      estimatedReturn = estimatedReturn + deliveryTime
    } else {
      estimatedReturn = calcTimeBackToDepot(drones[i])
    }
  if(doesNotMeetDeadLine(estimatedReturn, pack.deadline)){
    continue
  } else {
    if(minTime.time === 0){
      minTime["time"] = estimatedReturn
      minTime["droneId"] = drones[i].droneId
      minTime["packageId"] = pack.packageId
    } else if(minTime.time > estimatedReturn){
      minTime["time"] = estimatedReturn
      minTime["droneId"] = drones[i].droneId
      minTime["packageId"] = pack.packageId
    }
  }
}
  return minTime
}

function doesNotMeetDeadLine(droneTime, deadline){
  return droneTime + currentTime > deadline
}

function calcTimeBackToDepot(drone){
  let start
  if(drone.packages.length){
    start = {lat: drone.packages[0].destination.latitude, lon: drone.packages[0].destination.longitude}
  } else {
    start = {lat: drone.location.latitude, lon: drone.location.longitude }
  }
  let distance = geodist(start, depot, options)
  let time = calculateTime(distance)
  return time
}

function calcTimeToDelivery(drone){
  let droneLoc = {lat: drone.location.latitude, lon: drone.location.longitude }
  let packLoc = {lat: drone.packages[0].destination.latitude, lon: drone.packages[0].destination.longitude}
  let distance = geodist(droneLoc, packLoc, options)
  let time = calculateTime(distance)
  return time
}

function calculateTime(distance){
  let time = (distance/50) * 3600
  return time
}

function getDataAndAnalyze(){
  let drones = []
  let packages = []
  fetch('https://codetest.kube.getswift.co/drones')
  .then(function(res){
    drones = res
  })

  fetch('https://codetest.kube.getswift.co/packages')
  .then(json => {
    packages = json.body["_events"]
    console.log(packages)
    assignPackages(drones, packages)}
  )
}


getDataAndAnalyze()
