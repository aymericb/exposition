using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

// For more information on enabling Web API for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace Exposition.Controllers
{
    [Route("api/v1/[controller]")]
    public class ConfigController : Controller
    {
        private readonly Models.Config config;

        public ConfigController(IOptions<AppSettings> settings)
        {
            Contract.RequireNotNull(settings);
            Contract.Require(settings.Value != null);
            this.config = new Models.Config(settings.Value);
        }

        // GET: api/v1/config
        [HttpGet]
        public Models.Config Get()
        {
            return this.config;
        }
    }
}
