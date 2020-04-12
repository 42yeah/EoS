function addGoogleAnalytics() {
    let script = document.createElement("script");
    script.setAttribute("src", "https://www.googletagmanager.com/gtag/js?id=UA-147744221-1");
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'UA-147744221-1');
}

window.addEventListener("load", () => {
    fetch("https://google.com", {
        mode: "no-cors"
    }).then(res => {
        addGoogleAnalytics();
    });
});
