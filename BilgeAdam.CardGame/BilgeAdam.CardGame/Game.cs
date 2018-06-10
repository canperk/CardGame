using System;
using System.Collections.Generic;
using System.Linq;

namespace BilgeAdam.CardGame
{
    class Game
    {
        public Game(string ownerId)
        {
            Id = Guid.NewGuid().ToString();
            StartDate = DateTime.Now;
            User1 = GameHub.gamers.First(i => i.Id == ownerId);
            IsAvaliable = true;
        }
        public List<string> Cards { get; set; }
        public string Id { get; set; }
        public DateTime StartDate { get; set; }
        public Gamer User1 { get; set; }
        public Gamer User2 { get; set; }
        public bool IsAvaliable { get; set; }
        public void SetCards() {
            var r = new Random();
            Cards = new List<string>();
            var cardSet = new string[] { "10", "2", "4", "5", "8", "A", "K", "Q", "R" };

            while (Cards.Count < 18)
            {
                var index = r.Next(0, 9);
                var card = cardSet[index];
                if (Cards.Count(i => i == card) < 2)
                {
                    Cards.Add(card);
                }
            }
        }
    }
}