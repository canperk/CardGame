var game = {};
game.hub = {};
game.cards = [];

var userStatus = {};
userStatus.waiting = 0;
userStatus.busy = 1;
userStatus.guest = 2;

$(document).ready(function () {
    $("#btnStart").click(function () {
        game.cards = [];
        var cardSet = ["10", "2", "4", "5", "8", "A", "J", "K", "Q", "R"];
        
        while (game.cards.length < 20) {
            var index = Math.floor(Math.random() * 10);
            var card = cardSet[index];
            var count = game.cards.filter(function (i) {
                return i == card;
            });
            if (count.length < 2) {
                game.cards.push(card);
            }
        }
    });
    $(".cardEmpty").click(function () {
        var self = $(this);
        self.removeClass("cardEmpty");
        var index = self.attr("index");
        var image = game.cards[index];
        var path = "/images/" + image + ".png";
        self.find(".cardContent").css("background-image", "url('" + path + "')");
    });
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
            else if (i.id == user2)
            {
                users.gamers[index].status = userStatus.busy;
            }
        });
        
    }
    $.connection.hub.start().done(function () {
        game.hub.server.getUsers();
    });
});
var connector = new Vue({
    el: "#connectArea",
    data: {
        name: "",
        connected : false
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
       gamers : []
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

    }
});
var gamer = function (id, name, status) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.isSelf = false;
}

