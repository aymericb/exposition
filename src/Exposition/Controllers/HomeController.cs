using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Diagnostics.Contracts;

// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace Exposition
{
    public class HomeController : Controller
    {
        private readonly IOptions<Models.Config> config;

        public HomeController(IOptions<Models.Config> config)
        {
            Contract.Requires(config != null);
            this.config = config;
        }

        // GET: /<controller>/
        public IActionResult Index()
        {
            return View(this.config.Value);
        }
    }
}   