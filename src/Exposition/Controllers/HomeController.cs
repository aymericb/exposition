using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace Exposition
{
    public class HomeController : Controller
    {
        private readonly IOptions<AppSettings> settings;

        public HomeController(IOptions<AppSettings> settings)
        {
            Contract.RequireNotNull(settings);
            this.settings = settings;
        }

        // GET: /<controller>/
        public IActionResult Index()
        {
            return View(this.settings.Value);
        }
    }
}   