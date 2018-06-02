using Microsoft.AspNet.SignalR;

namespace BilgeAdam.CardGame
{
    public class GameHub : Hub
    {
        public void OpenCard(int id)
        {
            Clients.All.openCard(id);
        }

        public void Register(string name)
        {
            Clients.All.userRegistered(name);
        }
    }
}