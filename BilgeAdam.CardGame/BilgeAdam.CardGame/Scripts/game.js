var game = {};
game.hub = {};
game.cards = [];
game.filpCard = function (index, name) {
    var self = $(".card[index=" + index + "]");
    var path = "/images/" + name + ".png";
    self.find(".card__face.card__face--back").css("background-image", "url('" + path + "')");
}
game.selection = function (index, card) {
    this.index = index;
    this.card = card;
}
game.userCanContinue = function () {
    $("#gameArea").css("border-color", "#1bff00");
}
game.userCanNotContinue = function () {
    $("#gameArea").css("border-color", "#ae1e1e");
}
game.userInfo = function (id, name) {
    this.id = id;
    this.name = name;
    this.point = 0;
}
game.onCardClick = function () {
    if (gameArea.isStarted && gameArea.canPlay) {
        if (gameArea.clickCount < 2) {
            var self = $(this);
            gameArea.clickCount++;
            self.off("click");
            self.toggleClass("is-flipped");
            self.addClass("justPlayed");
            var index = self.attr("index");
            var cardName = gameArea.cards[index];
            var selection = new game.selection(index, cardName);
            gameArea.selections.push(selection);
            game.filpCard(index, cardName);
            if (game.hub.connection.id != gameArea.user1.id) {
                game.hub.server.flipCard(index, gameArea.user1.id);
            }
            else if (game.hub.connection.id != gameArea.user2.id) {
                game.hub.server.flipCard(index, gameArea.user2.id);
            }

            //Oyun hakı bitti
            if (gameArea.clickCount == 2) {
                game.userCanNotContinue();
                gameArea.canPlay = false;
                gameArea.clickCount = 0;
                var opponentGamer = "";
                var selfGamer = "";
                //rakip bul
                if (gameArea.user1.id == game.hub.connection.id) {
                    opponentGamer = gameArea.user2.id;
                    selfGamer = gameArea.user1.id;
                }
                else {
                    opponentGamer = gameArea.user1.id;
                    selfGamer = gameArea.user2.id;
                }
                //kartlar eşit mi
                if (gameArea.selections[0].card == gameArea.selections[1].card) {
                    gameArea.point += 1;
                    gameArea.clickCount = 0;
                    gameArea.canPlay = true;
                    game.userCanContinue();
                    gameArea.selections = [];
                    if (gameArea.user1.id == selfGamer) {
                        gameArea.user1.point++;
                        game.hub.server.updatePoint(gameArea.user2.id, gameArea.user1.id, gameArea.user1.point);
                    }
                    else {
                        gameArea.user2.point++;
                        game.hub.server.updatePoint(gameArea.user1.id, gameArea.user2.id, gameArea.user2.point);
                    }
                    $(".justPlayed").removeClass("justPlayed");
                    return;
                }
                else {
                    setTimeout(function () {
                        $(".justPlayed").click(game.onCardClick);
                        $(".justPlayed").toggleClass("is-flipped");
                        $(".justPlayed").removeClass("justPlayed");
                        game.hub.server.undo(opponentGamer, gameArea.selections[0].index, gameArea.selections[1].index);
                    }, 1000);
                }
                game.hub.server.changeTurn(opponentGamer);
            }
        }
    }
    else {
        toastr.error("Kart oyun hakkınız doldu. Sıranızı bekleyiniz");
    }
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
        if (game.hub.connection.id == g.User1.Id) {
            gameArea.canPlay = true;
            game.userCanContinue();
        }
        gameArea.user1 = new game.userInfo(g.User1.Id, g.User1.Name);
        gameArea.user2 = new game.userInfo(g.User2.Id, g.User2.Name);
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
        game.userCanContinue();
    }
    game.hub.client.undo = function (c1, c2) {
        $(".card[index=" + c1 + "]").removeClass("is-flipped").click(game.onCardClick);
        $(".card[index=" + c2 + "]").removeClass("is-flipped").click(game.onCardClick);
    }
    game.hub.client.updatePoint = function (id, point) {
        if (gameArea.user1.id == id) {
            gameArea.user1.point = point;
        }
        else {
            gameArea.user2.point = point;
        }
    }
    $.connection.hub.start().done(function () {
        game.hub.server.getUsers();
    });
    $('.card').click(game.onCardClick);
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
    el: "#gameArea",
    data: {
        user1: {},
        user2: {},
        isStarted: false,
        cards: [],
        clickCount: 0,
        canPlay: false,
        selections: []
    }
});
var gamer = function (id, name, status) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.isSelf = false;
}