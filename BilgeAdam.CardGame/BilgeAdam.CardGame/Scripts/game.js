var game = {};
game.hub = {};
game.cards = [];
$(document).ready(function () {
    $("#btnConnect").click(function () {
        $("#loginModal").modal();
    });
    $("#btnStart").click(function () {
        game.cards = [];
        var cardSet = ["10", "2", "4", "5", "8", "A", "J", "K", "Q", "R"];
        game.hub.server.register("Can PERK");
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
    game.hub.client.userRegistered = function (name) {
        alert(name + " oyuna katıldı");
    }
    $.connection.hub.start().done(function () {
        $("#btnStart").removeAttr("disabled");
        $("#loginModal").modal("close");
    });
});