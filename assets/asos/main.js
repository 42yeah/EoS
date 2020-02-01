import { Canvas } from "./Canvas.js";
import { Bubble } from "./Bubble.js";
import { Insertion } from "./Insertion.js";
import { Shell } from "./Shell.js";
import { Quick } from "./Quick.js";
import { Heap } from "./Heap.js";
import { Cocktail } from "./Cocktail.js";
import { Bogo } from "./Bogo.js";

const canvases = {};


function render(t) {
    requestAnimationFrame(render);
    for (let k in canvases) {
        if (canvases[k].sorting) {
            canvases[k].render(t);
        }
    }
}

window.addEventListener("load", () => {
    document.querySelectorAll(".sorts").forEach(elem => {
        const t = elem.getAttribute("t");
        let algorithm = null;
        switch (t) {
            case "bubble":
                algorithm = new Bubble();
                break;

            case "insertion":
                algorithm = new Insertion();
                break;

            case "shell":
                algorithm = new Shell();
                break;

            case "quick":
                algorithm = new Quick();
                break;

            case "heap":
                algorithm = new Heap();
                break;

            case "cocktail":
                algorithm = new Cocktail();
                break;

            case "bogo":
                algorithm = new Bogo();
                break;
        }
        canvases[t] = new Canvas(elem, algorithm);
        canvases[t].generate();
        canvases[t].render(0);
    });
    document.querySelectorAll(".sorti").forEach(elem => {
        elem.addEventListener("click", () => {
            canvases[elem.getAttribute("t")].sort();
        })
    });
    document.querySelectorAll(".mixi").forEach(elem => {
        elem.addEventListener("click", () => {
            canvases[elem.getAttribute("t")].generate();
            canvases[elem.getAttribute("t")].render(0);
        })
    });
    render();
    window.canvases = canvases;
});
