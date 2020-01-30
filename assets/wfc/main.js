import { Vec2 } from "./Vec2.js";
import { Model } from "./Model.js";
import { WFC } from "./WFC.js";


let ctx;
let canvas;
let canvasSize;
let imageSize;
let availableColors = [
    "#000000", "#ff0000", "#00ff00", "#0000ff"
];
let currentColor = 0;
let clicking = false;
let boundingRect = null;

let outCtx;
let outCanvas;

let wfc;
const size = new Vec2(48, 48);

function clear() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);
    outClear();
    colorBar();
}

function outClear() {
    outCtx.fillStyle = "#000000";
    outCtx.fillRect(0, 0, canvasSize.x, canvasSize.y);
}

function colorBar() {
    let width = canvasSize.x / availableColors.length;
    let height = canvasSize.y / (imageSize.y + 1);
    for (let i = 0; i < availableColors.length; i++) {
        ctx.fillStyle = availableColors[i];
        ctx.fillRect(i * width, canvasSize.y - height, width, height);
    }
}

function select(e) {
    const x = e.relativeX;
    let width = canvasSize.x / availableColors.length;
    currentColor = Math.floor(x / width);
}

function paint(e) {
    const pos = new Vec2(e.relativeX, e.relativeY);
    let width = canvasSize.x / imageSize.x;
    let height = canvasSize.y / (imageSize.y + 1);
    const grid = pos.divide(new Vec2(width, height)).floor();
    ctx.fillStyle = availableColors[currentColor];
    ctx.fillRect(grid.x * width, grid.y * height, width, height);
}

function event(e) {
    switch (e.type) {
        case "mousedown":
            clicking = true;
            break;

        case "mouseup":
            clicking = false;
            break;
    }
    if (clicking) {
        let height = canvasSize.y / (imageSize.y + 1);
        e.relativeX = (e.clientX - boundingRect.x) * 2;
        e.relativeY = (e.clientY - boundingRect.y) * 2;
        if (e.relativeY >= canvasSize.y - height) {
            select(e);
        } else {
            paint(e);
        }
    }
}

function generate() {
    let map = [];
    let width = canvasSize.x / imageSize.x;
    let height = canvasSize.y / (imageSize.y + 1);
    for (let y = 0; y < imageSize.y; y++) {
        let rows = [];
        for (let x = 0; x < imageSize.x; x++) {
            rows.push(ctx.getImageData(width * x + width / 10.0, height * y + height / 10.0, 1, 1).data);
        }
        map.push(rows);
    }
    const model = new Model(map, document.querySelector("#n").value);
    model.processPatterns();

    wfc = new WFC(model);
    wfc.init(size);
    requestAnimationFrame(render);
}

function render() {
    const res = wfc.step();
    wfc.render(canvasSize.x / size.x, canvasSize.y / size.y, outCtx);
    if (res == 0) {
        requestAnimationFrame(render);
    }
}

window.addEventListener("load", () => {
    canvas = document.querySelector("#input");
    ctx = canvas.getContext("2d");
    outCanvas = document.querySelector("#output");
    outCtx = outCanvas.getContext("2d");
    canvasSize = new Vec2(canvas.width, canvas.height);
    imageSize = new Vec2(12, 12);
    boundingRect = canvas.getBoundingClientRect();
    canvas.addEventListener("mousedown", event);
    canvas.addEventListener("mousemove", event);
    canvas.addEventListener("mouseup", event);
    clear();
    document.querySelector("#generate").addEventListener("click", generate);
    document.querySelector("#clear").addEventListener("click", clear);
});
