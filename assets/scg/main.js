"use strict";

const http = require("http");
const url = require("url");
const fetch = require("node-fetch");

let massiveList;


function submit(response, key, a, b, handler) {
    let resolves = [ false, false ];
    let games = [ false, false ];

    function check(cond, handler) {
        let c = true;
        for (let i = 0; i < cond.length; i++) {
            c &= cond[i] !== false ? true : false;
            if (!c) return false;
        }
        return handler();
    }

    function resolve(index, value) {
        if (value.length == 17 && +value != NaN) {
            resolves[index] = value;
            check(resolves, listGames);
            return;
        }
        fetch("http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001?key=" + key + "&vanityurl=" + value)
            .then(res => {
                return res.json();
            })
            .then(json => {
                if (json.response.success == 1) {
                    resolves[index] = json.response.steamid;
                    check(resolves, listGames);
                }
            });
    }

    function listGames() {
        for (let i = 0; i < resolves.length; i++) {
            fetch("http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=" + key + "&steamid=" + resolves[i] + "&format=json")
                .then(res => {
                    return res.json();
                })
                .then(json => {
                    games[i] = json.response.games;
                    check(games, compareGames);
                });
        }        
    }

    function compareGames() {
        let same = games[0];
        for (let i = 0; i < same.length; i++) {
            const game = same[i];
            let exists = false;
            for (let j = 0; j < games[1].length; j++) {
                if (games[1][j].appid == game.appid) {
                    exists = true;
                    break;
                }
            }

            if (!exists) {
                same.splice(i, 1);
                i--;
                continue;
            }
        }

        function getName(appid) {
            for (let i = 0; i < massiveList.length; i++) {
                if (massiveList[i].appid == appid) {
                    return massiveList[i].name;
                }
            }
            return "Unknown";
        }

        for (let i = 0; i < same.length; i++) {
            same[i].name = getName(same[i].appid);
        }
        handler(response, same);
    }

    resolve(0, a); resolve(1, b);
}

function cacheMasiveList(handler) {
    fetch("https://api.steampowered.com/ISteamApps/GetAppList/v2")
        .then(res => {
            console.log("Massive list got. Translating to JSON...");
            return res.json();
        })
        .then(json => {
            massiveList = json.applist.apps;
            console.log("Cached massive list, length: " + massiveList.length);
            handler();
        });
}

function main() {
    const server = http.createServer((request, response) => {
        let body = [];

        response.setHeader("Access-Control-Allow-Origin", "*");
        request.on("data", (chunk) => {
            body.push(chunk);
        }).on("end", () => {
            handle(request,
                Buffer.concat(body).toString(), 
                response); 
        });
    });

    function sendResponse(response, data) {
        const ret = {
            success: true,
            common: data
        };
        response.end(JSON.stringify(ret));
    }

    function handle(request, data, response) {
        let queries = url.parse(request.url, true).query;
        if (queries.key && queries.a && queries.b) {
            submit(response, queries.key, queries.a, queries.b, sendResponse);
        } else {
            response.end("{\"success\": false}");
        }
    }

    server.on("clientError", (err, socket) => {
        socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    });
    server.listen(41234);
}

cacheMasiveList(main);
