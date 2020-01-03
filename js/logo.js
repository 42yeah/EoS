// Logo is rendered by Zdog, an awesome library!
// https://zzz.dog/

function rand() {
    return (Math.random() > 0.5 ? 1 : -1) * Math.random();
}

function randZ() {
    return rand() * 200.0;
}

let illo = new Zdog.Illustration({
    // set canvas with selector
    element: '#logo',
    resize: true,
    rotate: { x: rand() * Math.PI * 2.0, y: rand() * Math.PI * 2.0, z: rand() * Math.PI * 2.0 }
});

let offset = -250;

new Zdog.Shape({
    addTo: illo,
    path: [
        { x: 40, y: 0, z: randZ() },
        { x: -40, y: 0, z: randZ() },
        { x: 10, y: -80, z: randZ() },
        { x: 10, y: 80, z: randZ() }
    ],
    translate: { x: offset },
    stroke: 20,
    color: "#0d66be",
    closed: false
});

new Zdog.Ellipse({
    addTo: illo,
    diameter: 60,
    quarters: 2,
    translate: { x: offset + 100, y: -55 },
    rotate: { z: -Math.PI / 2.0 },
    stroke: 20,
    color: "#abc",
    closed: false
});

new Zdog.Shape({
    addTo: illo,
    path: [
        { x: 130, y: -55, z: randZ() },
        { x: 70, y: 80, z: randZ() },
        { x: 130, y: 80, z: randZ() }
    ],
    translate: { x: offset },
    stroke: 20,
    color: "#abc",
    closed: false
});

new Zdog.Shape({
    addTo: illo,
    path: [
        { x: 170, y: 0, z: randZ() },
        { x: 200, y: 80, z: randZ() }
    ],
    translate: { x: offset },
    stroke: 20,
    color: "orange",
    closed: false
});

new Zdog.Shape({
    addTo: illo,
    path: [
        { x: 230, y: 0, z: randZ() },
        { x: 170, y: 160, z: randZ() }
    ],
    translate: { x: offset },
    stroke: 20,
    color: "orange",
    closed: false
});

new Zdog.Ellipse({
    addTo: illo,
    diameter: 70,
    quarters: 3,
    translate: { x: offset + 300, y: 30 },
    rotate: { z: -Math.PI / 1.0 },
    stroke: 20,
    color: "#12c172",
    closed: false
});

new Zdog.Shape({
    addTo: illo,
    path: [
        { x: 70, y: 30, z: randZ() },
        { x: 130, y: 30, z: randZ() }
    ],
    translate: { x: offset + 200 },
    stroke: 20,
    color: "#12c172",
    closed: false
});

new Zdog.Shape({
    addTo: illo,
    path: [
        { x: 0, y: 65, z: randZ() },
        { x: 10, y: 65, z: randZ() }
    ],
    translate: { x: offset + 300 },
    stroke: 20,
    color: "#12c172",
    closed: false
});

new Zdog.Ellipse({
    addTo: illo,
    diameter: 70,
    quarters: 4,
    translate: { x: offset + 400, y: 30 },
    stroke: 20,
    color: "#f13371",
    closed: false
});

new Zdog.Shape({
    addTo: illo,
    path: [
        { x: 135, y: 30, z: randZ() },
        { x: 135, y: 65, z: randZ() }
    ],
    translate: { x: offset + 300 },
    stroke: 20,
    color: "#f13371",
    closed: false
});

new Zdog.Ellipse({
    addTo: illo,
    diameter: 70,
    quarters: 2,
    translate: { x: offset + 500, y: 30 },
    rotate: { z: -Math.PI / 2.0 },
    stroke: 20,
    color: "#31a1ef",
    closed: false
});

new Zdog.Shape({
    addTo: illo,
    path: [
        { x: 65, y: -80, z: randZ() },
        { x: 65, y: 65, z: randZ() }
    ],
    translate: { x: offset + 400 },
    stroke: 20,
    color: "#31a1ef",
    closed: false
});

new Zdog.Shape({
    addTo: illo,
    path: [
        { x: 135, y: 30, z: randZ() },
        { x: 135, y: 65, z: randZ() }
    ],
    translate: { x: offset + 400 },
    stroke: 20,
    color: "#31a1ef",
    closed: false
});

let vx, vy, vz;
vx = rand() * 0.02;
vy = rand() * 0.02;
vz = rand() * 0.02;
const canvas = document.querySelector("#logo");

function animate() {
    const d2PiX = Math.abs((vx > 0 ? 1.0 : -1.0) * Math.PI * 2.0 - illo.rotate.x);
    const d2PiY = Math.abs((vy > 0 ? 1.0 : -1.0) * Math.PI * 2.0 - illo.rotate.y);
    const d2PiZ = Math.abs((vz > 0 ? 1.0 : -1.0) * Math.PI * 2.0 - illo.rotate.z);
    illo.rotate.x += d2PiX * vx;
    illo.rotate.y += d2PiY * vy;
    illo.rotate.z += d2PiZ * vz;
    if (d2PiX <= 0.01 && d2PiY <= 0.01 && d2PiZ <= 0.01) {
        illo.rotate.x = 0.0;
        illo.rotate.y = 0.0;
        illo.rotate.z = 0.0;
        vx = rand() * 0.02;
        vy = rand() * 0.02;
        vz = rand() * 0.02;
    }
    illo.updateRenderGraph();
    requestAnimationFrame(animate);
}

illo.zoom = canvas.width / (816 * 2.0) * 0.9;

// update & render
requestAnimationFrame(animate);
window.addEventListener("resize", () => {
    illo.zoom = canvas.width / (816 * 2.0) * 0.9;
    illo.updateRenderGraph();
});
