using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(BilgeAdam.CardGame.Startup))]
namespace BilgeAdam.CardGame
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.MapSignalR();
        }
    }
}