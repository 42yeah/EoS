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

window.addEventListener("load", translateMathJax);
