using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Exposition.Services;

namespace Exposition.Controllers
{
    //[Route("api/v1/[controller]")]
    public class ImageController
    {
        private readonly bool isDownloadAllowed;
        private readonly IFileProvider fileProvider;

        public ImageController(IFileProvider fileProvider, IOptions<AppSettings> settings)
        {
            Contract.RequireNotNull(fileProvider);
            Contract.RequireNotNull(settings);
            Contract.Require(settings.Value != null);

            this.isDownloadAllowed = settings.Value.IsDownloadAllowed;
            this.fileProvider = fileProvider;
        }

        // GET: api/v1/download/{path}
        [HttpGet("api/v1/download/{*path}")]
        public FileContentResult Download(string path)
        {
            if (!isDownloadAllowed)
                throw new Exception("Downloads are not allowd");

            var type = this.fileProvider.GetItemType(path);
            if (type == FileProvider.ItemType.Photo)
            {
                // download photo
                throw new NotImplementedException();
                //this.fileProvider.GetAlbumChildren()
            }
            else
            {
                throw new NotImplementedException();
                // zip up!
            }
        }
    }
}
