function submit() {
    const key = document.querySelector("#key").value,
        a = document.querySelector("#a").value,
        b = document.querySelector("#b").value;

    fetch("http://127.0.0.1:41234?key=" + key + "&a=" + a + "&b=" + b)
        .then(res => {
            return res.json();
        })
        .then(json => {
            const common = document.querySelector("#common");
            const list = document.querySelector("#list");

            if (!json.success) {
                common.innerHTML = "The process was not successful. \
                    Check the input, and try again."
            } else {
                let games = "";

                for (let i = 0; i < json.common.length; i++) {
                    games += "<div class=\"list-item\">\
                        " + json.common[i].name + "\
                    </div>";
                }
                list.innerHTML = games;
            }
        });
}
