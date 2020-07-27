let canvas, ctx;
let lastInstant = 0.0;

function radians(deg) {
    return (deg / 360.0) * (2.0 * Math.PI);
}

let arrowRadians = 0.0; // radians
let startRadians = 0.0;
let currentRadians = 0.0;
let lastArrowRadians = 0.0;
let spinningSpeed = 0.0;
let acc = 0.0;
let chunks = [];

function addChunk(rad, color, name) {
    chunks.push({ rad, color, name });
}

function loop(thisInstant) {
    function circle(color, deg, fill) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(
            canvas.width / 2.0,
            canvas.height / 2.0,
            (canvas.width / 2.0) * 0.8,
            0, deg, false
        );
        if (fill) {
            ctx.fill();
        } else {
            ctx.lineWidth = 5;
            ctx.stroke();
        }
    }

    function arrow(deg) {
        function lineArrow() {
            const width = 20.0;
            let x = 0, y = 0;
            ctx.lineTo(x -= width / 2.0, y);
            ctx.lineTo(x, y -= (canvas.width / 2.0) * 0.7);
            ctx.lineTo(x -= width, y);
            ctx.lineTo(x += Math.sqrt(2.0 * Math.pow(width, 2)), y -= width);
            ctx.lineTo(x += Math.sqrt(2.0 * Math.pow(width, 2)), y += width);
            ctx.lineTo(x -= width, y);
            ctx.lineTo(x, y += (canvas.width / 2.0) * 0.7);
            ctx.lineTo(x -= width, y);
        }

        let x = canvas.width / 2.0, 
            y = canvas.height / 2.0;

        ctx.save();
        ctx.fillStyle = "#499832";
        ctx.translate(x, y);
        ctx.rotate(deg);
        ctx.moveTo(x, y);
        ctx.beginPath();
        lineArrow();
        ctx.fill();
        ctx.restore();
    }

    function renderChunks() {
        function min(a, b) {
            return a < b ? a : b;
        }

        let currentRad = 0.0;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const fontSize = Math.floor((min(chunk.rad, Math.PI / 2.0) / (Math.PI / 2.0)) * 30.0);

            ctx.fillStyle = chunk.color;
            ctx.beginPath();
            ctx.arc(canvas.width / 2.0, canvas.height / 2.0,
                (canvas.width / 2.0) * 0.8, currentRad, currentRad + chunk.rad, false);
            ctx.lineTo(canvas.width / 2.0, canvas.height / 2.0);
            ctx.fill();
            ctx.save();
            ctx.translate(canvas.width / 2.0, canvas.height / 2.0);
            ctx.rotate(Math.PI / 2.0 + currentRad + (chunk.rad / 2.0));
            if (chunk.color.indexOf("rgba") > -1) {
                ctx.fillStyle = "#000";
            } else {
                ctx.fillStyle = chunk.color;
                ctx.filter = "invert(100%) saturate(110%)"
            }
            ctx.font = fontSize + "px cmunrm";
            ctx.fillText(chunk.name, -(fontSize * 0.25) * chunk.name.length, -(canvas.height / 2.0) * 0.55);
            ctx.restore();
            currentRad += chunk.rad;
        }
    }

    const deltaTime = (thisInstant - lastInstant) / 1000.0;
    acc += deltaTime;
    lastInstant = thisInstant;
    requestAnimationFrame(loop);
    
    if (acc >= 0.1) {
        lastArrowRadians = arrowRadians;
        acc = 0.0;
    }
    
    arrowRadians += spinningSpeed * deltaTime;
    spinningSpeed *= 0.99;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    circle("#321", 2.0 * Math.PI);
    renderChunks();
    arrow(arrowRadians);
}

let down = false;

function normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    return {
        x: x / len,
        y: y / len
    };
}

function mouse(e) {
    function correct(rad, n) {
        if ((n.x > 0 && n.y <= 0)
            || (n.x <= 0 && n.y <= 0)) { return Math.PI + rad; }
        if (n.x <= 0 && n.y > 0) { return rad + 2.0 * Math.PI; }
        return rad;
    }

    function spin() {
        const deltaRadians = arrowRadians - lastArrowRadians;

        spinningSpeed = deltaRadians * 10.0;
    }

    const rect = canvas.getBoundingClientRect();

    switch (e.type) {
        case "mousedown": 
        case "touchstart":
            down = true; currentRadians = arrowRadians; break;

        case "mouseup":
        case "touchend":
            down = false; spin(); break;
    }
    if (!(e.type == "mousedown"
        || (down && (e.type == "mousemove" || e.type == "touchmove")))) {
        return;
    }

    let pos = {
        clientX: e.clientX,
        clientY: e.clientY
    };
    if (e.type.indexOf("touch") > -1) {
        pos.clientX = e.touches[0].clientX;
        pos.clientY = e.touches[0].clientY;
    }
    spinningSpeed = 0.0;
    const n = normalize((pos.clientX - rect.left) * 2.0 - (canvas.width / 2.0),
        -(pos.clientY - rect.top) * 2.0 + (canvas.height / 2.0));

    const rad = correct(Math.atan(n.x / n.y), n);
    if (e.type == "mousedown" || e.type == "touchstart") {
        console.log("Start");
        startRadians = rad;
    }
    arrowRadians = currentRadians + (rad - startRadians);
    
    flying = true;
}

function renderList() {
    const list = document.querySelector("#list");

    let build = "";
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        build += "<div><div style=\"width: 1em; height: 1em; background-color: " + chunk.color + "; display: inline-block\"></div> " + chunk.name + "</div>";
    }
    list.innerHTML = build;
}

function add() {
    function random255() {
        return Math.floor(Math.random() * 256);
    }

    let name = document.querySelector("#name").value,
        color = document.querySelector("#color").value,
        degree = document.querySelector("#degree").value;

    if (color == "") {
        color = "rgba(" + random255() + ", " + random255() + ", " + random255() + ", 0.3)";
    }

    let rad;
    if (degree == "") {
        rad = 2.0 * Math.PI;
        for (let i = 0; i < chunks.length; i++) {
            rad -= chunks[i].rad;
        }
    } else {
        rad = radians(degree);
    }
    addChunk(rad, color, name);
    renderList();
}

function clear() {
    chunks = [];
    renderList();
}

function main() {
    canvas = document.querySelector("#wheel");
    ctx = canvas.getContext("2d");
    requestAnimationFrame(loop);

    canvas.addEventListener("mousedown", mouse);
    canvas.addEventListener("mousemove", mouse);
    canvas.addEventListener("mouseup", mouse);
    canvas.addEventListener("touchstart", mouse);
    canvas.addEventListener("touchmove", mouse);
    canvas.addEventListener("touchend", mouse);

    addChunk(radians(180.0), "#321", "Late night supper");
    addChunk(radians(180.0), "#654", "Just sleep");
    renderList();
}

window.addEventListener("load", main);
