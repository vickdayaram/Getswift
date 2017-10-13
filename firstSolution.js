require('es6-promise').polyfill();
require('isomorphic-fetch');

const geodist = require('geodist')
const depot = {lat: -37.816218, lon: 144.964068}
const options = {exact: true, unit: 'km'}

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

  for(let i = 0; i < drones.length; i++){
    let travelTime = droneTravelTime(drones[i])
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

function droneTravelTime(drone){
  let time
  if(drone.packages.length){
    time = timeToCurrentDelivery(drone) + timeBackToDepot(drone)
  } else {
    time = timeBackToDepot(drone)
  }
  return time
}

function isLessThanMin(travelTime, minTime){
  if(minTime === 0){
    return true
  } else {
    return minTime > travelTime
  }
}

function meetsDeadLine(travelTime, pack){
  let currentTime = Math.round((new Date).getTime()/1000)
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


function fetchAndAnalyzeData(){
  let drones = []
  let packages = []
  let promises = [
      fetch('https://codetest.kube.getswift.co/drones')
      .then(res => res.json())
      .then(json => drones = json) ,

      fetch('https://codetest.kube.getswift.co/packages')
      .then(res => res.json())
      .then(json => packages = json)
  ]

  Promise.all(promises)
  .then(() => assignPackages(drones, packages))
  .catch(err => {
    console.log('error', err)
    return
  })
}

fetchAndAnalyzeData()
