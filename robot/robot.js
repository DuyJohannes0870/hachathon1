(function() {
  "use strict"

  let active = null

  const places = {
    "Post Office": {x: 123, y: 556},
    "Cua Trai": {x: 226, y: 397},
    "Blue": {x: 276, y: 286},
    "Bai Coc": {x: 212, y: 262},
    "Bai Soi": {x: 278, y: 334},
    "Red": {x: 453, y: 420},
    "Bai Chim": {x: 414, y: 375},
    "Bai Da": {x: 482, y: 473},
    "Gank Bot": {x: 650, y: 478},
    "Gank Mid": {x: 442, y: 302},
    "Gank Top": {x: 206, y: 133}
  }
  const placeKeys = Object.keys(places)

  const speed = 1

  class Animation {
    constructor(worldState, robot, robotState) {
      this.worldState = worldState
      this.robot = robot
      this.robotState = robotState
      this.turn = 0

      let outer = (window.__sandbox ? window.__sandbox.output.div : document.body), doc = outer.ownerDocument
      this.node = outer.appendChild(doc.createElement("div"))
      this.node.style.cssText = "position: relative; line-height: 0.1; margin-left: 10px"
      this.map = this.node.appendChild(doc.createElement("img"))
      this.map.src = "./Maplol.png"
      this.map.style.cssText = "vertical-align: -8px; height:590px "
      this.robotElt = this.node.appendChild(doc.createElement("div"))
      this.robotElt.style.cssText = `position: absolute; transition: left ${0.8 / speed}s, top ${0.8 / speed}s;`
      let robotPic = this.robotElt.appendChild(doc.createElement("img"))
      robotPic.src = "./lee.png"
      robotPic.style = "width: 25px"
      this.parcels = []

      this.text = this.node.appendChild(doc.createElement("span"))
      this.button = this.node.appendChild(doc.createElement("button"))
      this.button.style.cssText = "color: white; background: #28b; border: none; border-radius: 2px; padding: 2px 5px; line-height: 1.1; font-family: sans-serif; font-size: 80%"
      this.button.textContent = "Stop"

      this.button.addEventListener("click", () => this.clicked())
      this.schedule()

      this.updateView()
      this.updateParcels()

      this.robotElt.addEventListener("transitionend", () => this.updateParcels())
    }


    updateView() {
      let pos = places[this.worldState.place]
      this.robotElt.style.top = (pos.y - 38) + "px"
      this.robotElt.style.left = (pos.x - 16) + "px"

      this.text.textContent = ` Turn ${this.turn} `
    }

    updateParcels() {
      while (this.parcels.length) this.parcels.pop().remove()
      let heights = {}
      for (let {place, address} of this.worldState.parcels) {
        let height = heights[place] || (heights[place] = 0)
        heights[place] += 14
        let node = document.createElement("div")
        let offset = placeKeys.indexOf(address) * 16
        node.style.cssText = "position: absolute; height: 16px; width: 16px; background-image: url(./parcel2x.png); background-position: 0 -" + offset + "px";
        if (place == this.worldState.place) {
          node.style.left = "25px"
          node.style.bottom = (20 + height) + "px"
          this.robotElt.appendChild(node)
        } else {
          let pos = places[place]
          node.style.left = (pos.x - 5) + "px"
          node.style.top = (pos.y - 10 - height) + "px"
          this.node.appendChild(node)
        }
        this.parcels.push(node)
      }
    }

    tick() {
      let {direction, memory} = this.robot(this.worldState, this.robotState)
      this.worldState = this.worldState.move(direction)
      this.robotState = memory
      this.turn++
      this.updateView()
      if (this.worldState.parcels.length == 0) {
        this.button.remove()
        this.text.textContent = ` Finished after ${this.turn} turns`
        this.robotElt.firstChild.src = "./lee.png"
      } else {
        this.schedule()
      }
    }

    schedule() {
      this.timeout = setTimeout(() => this.tick(), 1000 / speed)
    }

    clicked() {
      if (this.timeout == null) {
        this.schedule()
        this.button.textContent = "Stop"
        this.robotElt.firstChild.src = "./lee.png"
      } else {
        clearTimeout(this.timeout)
        this.timeout = null
        this.button.textContent = "Start"
        this.robotElt.firstChild.src = "./lee.png"
      }
    }
  }

  window.runRobotAnimation = function(worldState, robot, robotState) {
    if (active && active.timeout != null)
      clearTimeout(active.timeout)
    active = new Animation(worldState, robot, robotState)
  }
})()
var roads = [
    "Post Office-Cua Trai",   "Post Office-Cua Phai",
    "Cua Trai-Blue",   "Blue-Bai Coc",
    "Bai Coc-Bai Soi", "Bai Coc-Gank Top",
    "Bai Soi-Bai Chim", "Bai Chim-Red",
    "Bai Soi-Red",          "Red-Bai Da",
    "Bai Da-Bai Chim",     "Bai Da-Gank Bot",
    "Gank Bot-Gank Mid",       "Gank Mid-Gank Top"
  ];
  
  function buildGraph(edges) {
    let graph = Object.create(null);
    function addEdge(from, to) {
      if (graph[from] == null) {
        graph[from] = [to];
      } else {
        graph[from].push(to);
      }
    }
    for (let [from, to] of edges.map(r => r.split("-"))) {
      addEdge(from, to);
      addEdge(to, from);
    }
    return graph;
  }
  
  var roadGraph = buildGraph(roads);
  
  var VillageState = class VillageState {
    constructor(place, parcels) {
      this.place = place;
      this.parcels = parcels;
    }
  
    move(destination) {
      if (!roadGraph[this.place].includes(destination)) {
        return this;
      } else {
        let parcels = this.parcels.map(p => {
          if (p.place != this.place) return p;
          return {place: destination, address: p.address};
        }).filter(p => p.place != p.address);
        return new VillageState(destination, parcels);
      }
    }
  }
  
  function runRobot(state, robot, memory) {
    for (let turn = 0;; turn++) {
      if (state.parcels.length == 0) {
        console.log(`Done in ${turn} turns`);
        break;
      }
      let action = robot(state, memory);
      state = state.move(action.direction);
      memory = action.memory;
      console.log(`Moved to ${action.direction}`);
    }
  }
  
  function randomPick(array) {
    let choice = Math.floor(Math.random() * array.length);
    return array[choice];
  }
  
  function randomRobot(state) {
    return {direction: randomPick(roadGraph[state.place])};
  }
  
  VillageState.random = function(parcelCount = 5) {
    let parcels = [];
    console.log (parcels)
    for (let i = 0; i < parcelCount; i++) {
      let address = randomPick(Object.keys(roadGraph));
      let place;
      do {
        place = randomPick(Object.keys(roadGraph));
      } while (place == address);
      parcels.push({place, address});
    }
    return new VillageState("Post Office", parcels);
  };
  
  var mailRoute = [
    "Gank Bot", "Blue", "Gank Bot", "Cua Trai",
    "Gank Top", "Bai Coc", "Bai Soi",
    "Bai Chim", "Gank Bot", "Bai Chim", "Red",
    "Bai Da", "Post Office"
  ];
  
  function routeRobot(state, memory) {
    if (memory.length == 0) {
      memory = mailRoute;
    }
    return {direction: memory[0], memory: memory.slice(1)};
  }
  
  function findRoute(graph, from, to) {
    let work = [{at: from, route: []}];
    for (let i = 0; i < work.length; i++) {
      let {at, route} = work[i];
      for (let place of graph[at]) {
        if (place == to) return route.concat(place);
        if (!work.some(w => w.at == place)) {
          work.push({at: place, route: route.concat(place)});
        }
      }
    }
  }
  
  function goalOrientedRobot({place, parcels}, route) {
    if (route.length == 0) {
      let parcel = parcels[0];
      if (parcel.place != place) {
        route = findRoute(roadGraph, place, parcel.place);
      } else {
        route = findRoute(roadGraph, place, parcel.address);
      }
    }
    return {direction: route[0], memory: route.slice(1)};
  }

runRobotAnimation(VillageState.random(),goalOrientedRobot, []);