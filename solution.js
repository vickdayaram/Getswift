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
        "deadline": 1590425202
    },
    {
        "destination": {
            "latitude": -37.77058198385452,
            "longitude": 144.85157121265505
        },
        "packageId": 8218,
        "deadline": 1507859000
    }
]

const geodist = require('geodist')
const depot = {lat: -37.816218, lon: 144.964068}
const options = {exact: true, unit: 'km'}
const currentTime = Math.round((new Date).getTime()/1000);


function assignPackages(drones, packages){
  let results = {assignments: [], packages: []}

  for(let i = 0; i < packages.length; i++){
    let assignment = findAssignment(packages[i], drones)
    if(assignment.droneId === null){
      results.packages.push(packages[i].packageId)
    } else {
      results.assignments.push(assignment)
    }
  }

  console.log(results)
}

function findAssignment(pack, drones){
  let assignment = {droneId: null, packageId: null}
  let minTime = 0
  let minIndx = -1
  let travelTime

  for(let i = 0; i < drones.length; i++){
    if(drones[i].packages.length){
      travelTime = timeToCurrentDelivery(drones[i]) + timeBackToDepot(drones[i])
    } else {
      travelTime = timeBackToDepot(drones[i])
    }
    if(meetsDeadLine(travelTime, pack) && isLessThanMin(travelTime, minTime)){
        minTime = travelTime
        assignment["droneId"] = drones[i].droneId
        assignment["packageId"] = pack.packageId
        minIndx = i
    } else {
      continue
    }
  }
  if(minIndx !== -1)drones.splice(minIndx, 1)
  return assignment
}

function isLessThanMin(travelTime, minTime){
  if(minTime === 0){
    return true
  } else {
    return minTime > travelTime
  }
}

function meetsDeadLine(travelTime, pack){
  let destination = {lat: pack.destination.latitude, lon: pack.destination.longitude}
  let distance = geodist(depot, destination, options)
  let deliveryTime = calculateTravelTime(distance)
  return currentTime + travelTime + deliveryTime < pack.deadline
}

function timeBackToDepot(drone){
  let startLocation
  if(drone.packages.length){
    startLocation = {lat: drone.packages[0].destination.latitude, lon: drone.packages[0].destination.longitude}
  } else {
    startLocation = {lat: drone.location.latitude, lon: drone.location.longitude }
  }
  let distance = geodist(startLocation, depot, options)
  let time = calculateTravelTime(distance)
  return time
}

function timeToCurrentDelivery(drone){
  let droneLoc = {lat: drone.location.latitude, lon: drone.location.longitude }
  let packLoc = {lat: drone.packages[0].destination.latitude, lon: drone.packages[0].destination.longitude}
  let distance = geodist(droneLoc, packLoc, options)
  let time = calculateTravelTime(distance)
  return time
}

function calculateTravelTime(distance){
  let time = (distance/50) * 3600
  return time
}


function getAndAnalyzeData(){
  let drones = []
  let packages = []
  fetch('https://codetest.kube.getswift.co/drones')
  .then(res => res.json())
  .then(json => drones = json)

  fetch('https://codetest.kube.getswift.co/packages')
  .then(res => res.json())
  .then(json => packages = json)
  .then(() => assignPackages(drones, packages))
}

//getAndAnalyzeData()
assignPackages(dronesTest, packagesTest)
