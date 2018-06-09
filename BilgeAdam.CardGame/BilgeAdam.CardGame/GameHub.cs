using Microsoft.AspNet.SignalR;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BilgeAdam.CardGame
{
    public class GameHub : Hub
    {
        static List<Game> games = new List<Game>();
        static List<Gamer> gamers = new List<Gamer>();
        public void OpenCard(int id)
        {
            Clients.All.openCard(id);
        }

        public void Register(string name)
        {
            var gamer = new Gamer { Id = Context.ConnectionId, Name = name, Status = Status.Guest };
            Clients.All.userRegistered(gamer.Id, gamer.Name);
            gamers.Add(gamer);
        }

        public void StartGame()
        {
            var game = new Game(Context.ConnectionId);
            games.Add(game);
            var gamer = gamers.FirstOrDefault(i => i.Id == Context.ConnectionId);
            if (gamer != null)
            {
                gamer.Status = Status.Waiting;
            }
            Clients.All.userStartedGame(Context.ConnectionId);
        }

        public void GetUsers()
        {
            Clients.Caller.loadUsers(gamers);
        }

        public void JoinGame(string ownerId)
        {
            var game = games.FirstOrDefault(i => i.User1 == ownerId);
            if (game != null)
            {
                game.IsAvaliable = false;
            }
            var user1 = gamers.FirstOrDefault(i => i.Id == ownerId);
            if (user1 != null)
            {
                user1.Status = Status.Busy;
            }
            var user2 = gamers.FirstOrDefault(i => i.Id == Context.ConnectionId);
            if (user2 != null)
            {
                user2.Status = Status.Busy;
            }
            game.User2 = user2.Id;
            Clients.All.usersStartedToGame(user1.Id, user2.Id);
            game.SetCards();
            Clients.Client(user1.Id).gameStarted(game);
            Clients.Client(user2.Id).gameStarted(game);
        }

        public void FlipCard(int index, string userId)
        {
            Clients.Client(userId).flipCard(index);
        }

        public void ChangeTurn(string opponent)
        {
            Clients.Client(opponent).getTurn();
        }

        public async override Task OnDisconnected(bool stopCalled)
        {
            var gamer = gamers.FirstOrDefault(i => i.Id == Context.ConnectionId);
            if (gamer != null)
            {
                gamers.Remove(gamer);
            }
            var userGame = games.FirstOrDefault(i => i.User1 == gamer.Id || i.User2 == gamer.Id);
            Clients.Others.removeUser(gamer.Id);
            Clients.Others.gameRemoved(userGame.User1, userGame.User2);

            //TODO: Kartların çevrilmesi durumu için rakibe bildirim gitmesi
            games.Remove(userGame);
            await Task.CompletedTask;
        }
    }
}