import { Vec2 } from "./Vec2.js";
import { Perlin } from "./Perlin.js";


let canvas;
let ctx;
let size;
let perlin;
let zoom, dx, dy;

window.addEventListener("load", () => {
    canvas = document.querySelector("#output");
    ctx = canvas.getContext("2d");
    size = new Vec2(canvas.width, canvas.height);
    document.querySelectorAll(".slider").forEach(elem => {
        elem.addEventListener("change", renew);
    });
    document.querySelectorAll(".slider").forEach(elem => {
        elem.addEventListener("input", updateValues);
    });
    renew();
});

function renew() {
    perlin = new Perlin(
        new Vec2(
            document.querySelector("#seeda1").value,
            document.querySelector("#seeda2").value
        ),
        new Vec2(
            document.querySelector("#seedb1").value,
            document.querySelector("#seedb2").value
        )
    );
    zoom = document.querySelector("#zoom").value;
    dx = +document.querySelector("#dx").value;
    dy = +document.querySelector("#dy").value;
    updateValues();
    requestAnimationFrame(render);
}

function updateValues() {
    document.querySelectorAll(".slider").forEach(elem => {
        document.querySelector("#" + elem.id + "Value").innerHTML = elem.value;
    });
}

function at(pos, off) {
    if (!pos.boundaryCheck(size)) {
        return -1;
    }
    return (pos.y * size.x + pos.x) * 4 + off;
}

function render() {
    const data = ctx.getImageData(0, 0, 500, 500);
    for (let y = 0; y < size.y; y++) {
        for (let x = 0; x < size.x; x++) {
            const d = new Vec2(x, y);
            const norm = d.divide(size).add(new Vec2(dx, dy)).multiply(new Vec2(zoom, zoom));
            const ret = perlin.at(norm) * 0.5 + 0.5;
            data.data[at(d, 0)] = Math.floor(ret * 255);
            data.data[at(d, 1)] = Math.floor(ret * 255);
            data.data[at(d, 2)] = Math.floor(ret * 255);
            data.data[at(d, 3)] = 255;
        }
    }
    ctx.putImageData(data, 0, 0);
}
