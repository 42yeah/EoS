"use strict";


const retina = 2.0;
let lastInstant = 0.0;
let accu = 0.0;
let grids = [];
let active = null;
let offset = { x: 0.0, y: 0.0 };
let canvas, ctx;
let generation = 0;
let recording = false;
let camera = true;
let rate = 0.1;

function findGridByPosition(arr, blockPos) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].x == blockPos.x && arr[i].y == blockPos.y) { return i; }
    }
    return -1;
}

function setGridByPosition(arr, blockPos, state) {
    /// Check the availability with blockPos.
    /// If that grid is dead, it should simply delete it.
    /// Otherwise if the grid was originally dead, but now alive, it should add it
    /// into the array.
    /// setGrid needs another array because it will interfere otherwise.
    let g = findGridByPosition(arr, blockPos);
    if ((g == -1) == !state) { return; }
    if (g != -1 && !state) { arr.splice(g, 1); return; }
    arr.push({
        x: blockPos.x,
        y: blockPos.y
    });
}

function getGridNeighborCount(blockPos) {
    function positive(pos) { return findGridByPosition(grids, pos) != -1 ? 1 : 0; }
    function pos(x, y) { return { x, y } };
    return positive(pos(blockPos.x - 1, blockPos.y - 1)) +
        positive(pos(blockPos.x, blockPos.y - 1)) +
        positive(pos(blockPos.x + 1, blockPos.y - 1)) +
        positive(pos(blockPos.x - 1, blockPos.y)) +
        positive(pos(blockPos.x + 1, blockPos.y)) +
        positive(pos(blockPos.x - 1, blockPos.y + 1)) +
        positive(pos(blockPos.x, blockPos.y + 1)) +
        positive(pos(blockPos.x + 1, blockPos.y + 1));
}

/**
 * getNeighbors will return a set of neighbors of a specific position,
 * including himself.
 * @param {*} blockPos 
 */
function getNeighbors(blockPos) {
    function pos(x, y) { return { x, y } };
    return [
        pos(blockPos.x - 1, blockPos.y - 1),
        pos(blockPos.x, blockPos.y - 1),
        pos(blockPos.x + 1, blockPos.y - 1),
        pos(blockPos.x - 1, blockPos.y),
        pos(blockPos.x, blockPos.y),
        pos(blockPos.x + 1, blockPos.y),
        pos(blockPos.x - 1, blockPos.y + 1),
        pos(blockPos.x, blockPos.y + 1),
        pos(blockPos.x + 1, blockPos.y + 1)
    ];
}

function mouseEvents(e) {
    switch (e.type) {
        case "mousedown": recording = true; break;
        case "mouseup": recording = false; break;
    }
    if (!recording) { return; }
    let boundingRect = canvas.getBoundingClientRect();
    let mousePos = { x: (e.clientX - boundingRect.left) * retina + offset.x, 
                     y: (e.clientY - boundingRect.top) * retina + offset.y };
    let blockPos = { x: Math.floor(mousePos.x / 25.0), y: Math.floor(mousePos.y / 25.0) };
    setGridByPosition(grids, blockPos, true);
}

function cleanRepetitives(arr) {
    for (let i = 0; i < arr.length; i++) {
        const pos = arr[i];
        for (let j = i + 1; j < arr.length; j++) {
            if (pos.x == arr[j].x && pos.y == arr[j].y) { arr.splice(j, 1); j--; continue; }
        }
    }
    return arr;
}

function update(dt) {
    if (recording) { return; }
    accu += dt;
    let dp;
    if (active != null) {
        dp = { x: (active.x * 25.0 - offset.x - 250.0) * 0.1, 
               y: (active.y * 25.0 - offset.y - 250.0) * 0.1 };
    } else { dp = { x: -offset.x * 0.1, y: -offset.y * 0.1 }; }
    offset = { x: offset.x + dp.x, y: offset.y + dp.y };
    if (accu <= rate) { return; }
    accu = 0.0;
    active = null;
    let swap = [];
    let potentials = [];
    for (let i = 0; i < grids.length; i++) {
        const g = grids[i];
        potentials = potentials.concat(getNeighbors(g));
    }
    cleanRepetitives(potentials);
    for (let i = 0; i < potentials.length; i++) {
        const g = potentials[i];
        const n = getGridNeighborCount(g);
        if (n <= 1 || n >= 4) { setGridByPosition(swap, g, false); }
        else if (n == 3) { 
            setGridByPosition(swap, g, true); 
            if (findGridByPosition(grids, g) == -1) { active = g; }
        } else { setGridByPosition(swap, g, findGridByPosition(grids, g) != -1); }
    }
    let gen = "";
    switch (swap.length) {
        case 0: gen = "There's nothing here for the moment"; break;
        default: gen = "Current generation: " + (++generation); break;
    }
    document.querySelector("#generation").innerHTML = gen;
    grids = swap;
}

function render() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000000";
    for (let i = 0; i < grids.length; i++) {
        const g = grids[i];
        ctx.fillRect(g.x * 25.0 - offset.x, g.y * 25.0 - offset.y, 25.0, 25.0);
    }
}

function loop(t) {
    requestAnimationFrame(loop);
    if (lastInstant == 0) { lastInstant = t; return; }
    const dt = (t - lastInstant) / 1000.0;
    lastInstant = t;

    update(dt);
    if (!camera) {
        offset = { x: 0.0, y: 0.0 };
    }
    render();
}

window.addEventListener("load", () => {
    document.querySelectorAll(".slider").forEach(elem => {
        elem.addEventListener("change", renew);
    });
    document.querySelectorAll(".slider").forEach(elem => {
        elem.addEventListener("input", updateValues);
    });
    renew();
    canvas = document.querySelector("#gol");
    canvas.addEventListener("mousedown", mouseEvents);
    canvas.addEventListener("mousemove", mouseEvents);
    canvas.addEventListener("mouseup", mouseEvents);
    ctx = canvas.getContext("2d");
    requestAnimationFrame(loop);
});

function renew() {
    rate = document.querySelector("#update").value;
    updateValues();
}

function updateValues() {
    document.querySelectorAll(".slider").forEach(elem => {
        document.querySelector("#" + elem.id + "Value").innerHTML = elem.value;
    });
}
