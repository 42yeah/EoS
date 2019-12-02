function adjustImageAspect() {
    let images = document.querySelectorAll("img");
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const aspect = image.naturalWidth / image.naturalHeight;
        const flooredPercent = Math.max(100, Math.floor(aspect * 100));
        image.style.width = flooredPercent + "%";
    }
}

adjustImageAspect();
