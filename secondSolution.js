require('es6-promise').polyfill();
require('isomorphic-fetch');

const geodist = require('geodist')
const depot = {lat: -37.816218, lon: 144.964068}
const options = {exact: true, unit: 'km'}

function assignPackages(drones, packages){
  let sortedDrones = sortDronesByTime(drones)
  let results = {assignments: [], packages: []}
  let assignment = {}

  for(let i = 0; i < packages.length; i++){
    let travelTime = droneTravelTime(sortedDrones[0])
    if(meetsDeadLine(travelTime, packages[i])){
      assignment = { droneId: sortedDrones[0].droneId, packageId: packages[i].packageId}
      results.assignments.push(assignment)
      sortedDrones.splice(0, 1)
    } else {
      results.packages.push(packages[i].packageId)
    }
  }
  console.log(results)
}

function sortDronesByTime(drones){
  let sortedDrones = drones.sort(function(a, b){
    return droneTravelTime(a) - droneTravelTime(b)
  })
  return sortedDrones
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
