var game = {};
game.hub = {};
game.cards = [];
game.filpCard = function (index, name) {
    var self = $(".card[index=" + index + "]");
    var path = "/images/" + name + ".png";
    self.find(".card__face.card__face--back").css("background-image", "url('" + path + "')");
}
var userStatus = {};
userStatus.waiting = 0;
userStatus.busy = 1;
userStatus.guest = 2;
$(document).ready(function () {
    
    game.hub = $.connection.gameHub;
    game.hub.client.openCard = function (id) {
        alert(id);
    };
    game.hub.client.userRegistered = function (id, name) {
        var newGamer = new gamer(id, name, userStatus.guest);
        if (id == game.hub.connection.id) {
            newGamer.isSelf = true;
        }
        users.gamers.push(newGamer);
    }
    game.hub.client.userStartedGame = function (clientId) {
        var user = users.gamers.filter(function (u) {
            return u.id == clientId;
        });
        if (user && user.length == 1) {
            user[0].status = userStatus.waiting;
        }
    }
    game.hub.client.loadUsers = function (gamers) {
        for (var g in gamers) {
            var ng = new gamer(gamers[g].Id, gamers[g].Name, gamers[g].Status);
            users.gamers.push(ng);
        }
    }
    game.hub.client.removeUser = function (id) {
        var user = users.gamers.filter(function (u) {
            return u.id == id;
        });

        if (user && user.length == 1) {
            var index = users.gamers.indexOf(user[0]);
            users.gamers.splice(index, 1);
        }
    }
    game.hub.client.usersStartedToGame = function (user1, user2) {
        users.gamers.filter(function (i) {
            var index = users.gamers.indexOf(i);
            if (i.id == user1) {
                users.gamers[index].status = userStatus.busy;
            }
            else if (i.id == user2) {
                users.gamers[index].status = userStatus.busy;
            }
        });
    }
    game.hub.client.gameRemoved = function (user1, user2) {
        var gameUsers = users.gamers.filter(function (i) {
            return i.id == user1 || i.id == user2;
        });
        gameUsers.forEach(function (i) {
            i.status = userStatus.guest;
        });
    }
    game.hub.client.gameStarted = function (g) {
        gameArea.isStarted = true;
        if (game.hub.connection.id == g.User1) {
            gameArea.canPlay = true;
            $("#gameArea").css("border-color", "#1bff00");
        }
        gameArea.user1 = g.User1;
        gameArea.user2 = g.User2;
        gameArea.cards = g.Cards;
    }
    game.hub.client.flipCard = function (index) {
        var card = $(".card[index=" + index + "]");
        card.toggleClass("is-flipped");
        card.off("click");

        var cardName = gameArea.cards[index];
        game.filpCard(index, cardName);
    }
    game.hub.client.getTurn = function () {
        gameArea.canPlay = true;
        gameArea.selections = [];
        $("#gameArea").css("border-color", "#1bff00");
    }
    $.connection.hub.start().done(function () {
        game.hub.server.getUsers();
    });
    $('.card').click(function () {
        if (gameArea.isStarted && gameArea.canPlay) {
            if (gameArea.clickCount < 2) {
                gameArea.clickCount++;
                $(this).off("click");
                $(this).toggleClass("is-flipped");
                $(this).addClass("justPlayed");
                var index = $(this).attr("index");
                var cardName = gameArea.cards[index];
                gameArea.selections.push(cardName);
                game.filpCard(index, cardName);
                if (game.hub.connection.id != gameArea.user1) {
                    game.hub.server.flipCard(index, gameArea.user1);
                }
                else if (game.hub.connection.id != gameArea.user2) {
                    game.hub.server.flipCard(index, gameArea.user2);
                }

                //Oyun hakı bitti
                if (gameArea.clickCount == 2) {
                    $("#gameArea").css("border-color", "#ae1e1e");
                    gameArea.canPlay = false;
                    gameArea.clickCount = 0;
                    var opponent = "";
                    if (gameArea.user1 == game.hub.connection.id) {
                        opponent = gameArea.user2;
                    }
                    else {
                        opponent = gameArea.user1;
                    }
                    if (gameArea.selections[0] == gameArea.selections[1]) {
                        gameArea.point += 1;
                    }
                    else {
                        setTimeout(function () {
                            $(".justPlayed").toggleClass("is-flipped");
                            $(".justPlayed").removeClass("justPlayed");
                        }, 1000);
                    }
                    game.hub.server.changeTurn(opponent);
                }
            }            
        }
        else {
            toastr.error("Kart oyun hakkınız doldu. Sıranızı bekleyiniz");
        }
    });
});
var connector = new Vue({
    el: "#connectArea",
    data: {
        name: "",
        connected: false
    },
    methods: {
        openDialog: function () {
            $("#loginModal").modal("toggle");
        },
        connect: function () {
            game.hub.server.register(this.name);
            $("#loginModal").modal("toggle");
            connector.connected = true;
        }
    }
});
var users = new Vue({
    el: "#userList",
    data: {
        gamers: []
    },
    methods: {
        startGame: function () {
            game.hub.server.startGame();
        },
        join: function (g) {
            if (game.hub.connection.id == g.id) {
                return;
            }
            if (g.status != 0) {
                toastr.warning("Yalnızca oyun oluşturan kullanıcıları seçebilirsiniz");
                return;
            }
            game.hub.server.joinGame(g.id);
        }
    }
});
var gameArea = new Vue({
    el: "",
    data: {
        user1: "",
        user2: "",
        isStarted: false,
        cards: [],
        clickCount: 0,
        canPlay: false,
        selections: [],
        point : 0
    },
    methods: {
        
    }
});
var gamer = function (id, name, status) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.isSelf = false;
}

