using Microsoft.AspNet.SignalR;
using System;
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
            Clients.All.usersStartedToGame(user1.Id, user2.Id);
        }

        public async override Task OnDisconnected(bool stopCalled)
        {
            var gamer = gamers.FirstOrDefault(i => i.Id == Context.ConnectionId);
            if (gamer != null)
            {
                gamers.Remove(gamer);
            }
            var userGames = games.Where(i => i.User1 == gamer.Id || i.User2 == gamer.Id).ToList();
            userGames.ForEach(i => games.Remove(i));
            Clients.Others.removeUser(gamer.Id);
            await Task.CompletedTask;
        }
    }
    class Game
    {
        public Game(string ownerId)
        {
            Id = Guid.NewGuid().ToString();
            StartDate = DateTime.Now;
            User1 = ownerId;
            IsAvaliable = true;
        }
        public string Id { get; set; }
        public DateTime StartDate { get; set; }
        public string User1 { get; set; }
        public string User2 { get; set; }
        public bool IsAvaliable { get; set; }
    }

    class Gamer
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public Status Status { get; set; }
    }

    enum Status
    {
        Waiting = 0,
        Busy = 1,
        Guest = 2
    }
}