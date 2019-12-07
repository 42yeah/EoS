function translateMathJax() {
    document.querySelectorAll("script[type='math/tex']").forEach(function(el){
        el.outerHTML = "\\(" + el.textContent + "\\)";
      });
    document.querySelectorAll("script[type='math/tex; mode=display']").forEach(function(el){
        el.outerHTML = "\\[" + el.textContent + "\\]";
    });
    var script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
    document.head.appendChild(script);
}

function codeMirrorify() {
    if (typeof canvasScriptList == "undefined") { return; }
    for (let i = 0; i < canvasScriptList.length; i++) {
        const elem = canvasScriptList[i];
        const editor = CodeMirror.fromTextArea(elem.previousElementSibling, { 
            lineNumbers: false, 
            mode: "javascript"
        });
    }
}

function switchCodePadPanel(elem, panel) {
    const swooper = elem.parentElement.parentElement.querySelector(".codepad-swooper-frame").firstElementChild;
    // const swooperWidth = swooper.clientWidth;
    switch (panel) {
        case "code":
            swooper.style.transform = "";
            break;

        case "run":
            swooper.style.transform = "translate(-100%, 0)";
            runCode(elem);
            break;

        case "canvas":
            swooper.style.transform = "translate(-200%, 0)";
            break;

        case "help":
            swooper.style.transform = "translate(-300%, 0)";
            break;
    }
    const tabs = elem.parentElement.querySelectorAll("div").forEach((elem) => {
        if (elem.getAttribute("data-type") == panel) {
            elem.classList.add("codepad-action__active");
        } else {
            elem.classList.remove("codepad-action__active");
        }
    });
}

function runCode(elem) {
    const gallery = elem.parentElement.parentElement.querySelector(".codepad-swooper-frame").firstElementChild;
    const edit = gallery.querySelector("[data-type='code']").firstElementChild.nextElementSibling.CodeMirror;
    const out = gallery.querySelector("[data-type='run']").firstElementChild;
    const canvas = gallery.querySelector("[data-type='canvas']").firstElementChild;
    const ctx = canvas.getContext("2d");
    let terminalClean = true;
    out.innerHTML = "<font style=\"color: #a1a1a1\">There is no actual output at this moment. Use log to barf stuffs into this terminal!</font><br />";
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    
    function log(...args) {
        if (terminalClean) {
            terminalClean = false;
            out.innerHTML = "";
        }
        for (let i = 0; i < args.length; i++) {
            out.innerHTML += "<font style=\"color: #676767\">&gt;&nbsp;" + args[i] + "</font><br />";
        }
    }
    const nativeConsoleLog = console.log;
    console.log = log;
    try {
        eval(edit.getValue());
    } catch (e) {
        out.innerHTML += "<font style=\"color: #a12321\">#&nbsp;" + e.toString() + "</font><br />";
    }
    console.lpg = nativeConsoleLog;
}

window.addEventListener("load", () => {
    translateMathJax();
    codeMirrorify();
});
