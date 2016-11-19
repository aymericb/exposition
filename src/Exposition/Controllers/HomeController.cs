using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace Exposition
{
    public class HomeController : Controller
    {
        // GET: /<controller>/
        public /*IActionResult*/ ContentResult Index()
        {
            // return View();
            return Content("Index page");
        }
    }
}   
