using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Diagnostics.Contracts;

// For more information on enabling Web API for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace Exposition.Controllers
{
    [Route("api/v1/[controller]")]
    public class ConfigController : Controller
    {
        private readonly AppSettings settings;

        public ConfigController(IOptions<AppSettings> settings)
        {
            Contract.Requires(settings != null && settings.Value != null);
            this.settings = settings.Value;
        }

        // GET: api/v1/config
        [HttpGet]
        public AppSettings Get()
        {
            return this.settings;
        }
    }
}
