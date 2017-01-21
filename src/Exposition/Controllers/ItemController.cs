using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Exposition.Services;
using System.Diagnostics.Contracts;
using System.IO;

// For more information on enabling Web API for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace Exposition.Controllers
{
    [Route("api/v1/[controller]/")]
    public class ItemController : Controller
    {
        private readonly IFileProvider fileProvider;

        #region Public Interface 
        public ItemController(IFileProvider fileProvider)
        {
            Contract.Requires(fileProvider != null);
            this.fileProvider = fileProvider;
        }

        [HttpGet("{*path}")]
        public Models.Item Get(string path)
        {
            Contract.Requires(path.StartsWith("/"));
            path = path == "/" ? "" : path.Substring(1);
            return CreateItem(path);
        }

        [HttpGet]
        public Models.Item Get()
        {
            return CreateItem("");
        }

        #endregion

        #region Implementation

        private Models.Item CreateItem(string path)
        {
            Contract.Requires(!string.IsNullOrEmpty(path));

            // ### TODO Parse album.json
            var title = Path.GetFileNameWithoutExtension(path);

            var type = this.fileProvider.GetItemType(path);

            if (type == FileProvider.ItemType.Photo)
            {
                return new Models.Photo("/"+path, title);
            }
            else if (type == FileProvider.ItemType.Album)
            {
                // ### TODO Parse album.json
                Func<string, Models.Item> SafeCreateItem = item_path =>
                {
                    try
                    {
                        return CreateItem(item_path);
                    }
                    catch (Exception)
                    {
                        // We are resilient to children items not loading. The album might still be partially usable.
                        // ### TODO: log
                        return null;
                    }
                };

                // ### FIXME: This is fully recursive. Denial of service
                var children = this.fileProvider.GetAlbumChildren(path).Select(x => SafeCreateItem(x)).Where(x => x != null);

                return new Models.Album("/"+path, title, children);
            }

            throw new Exception("Unreachable Statement");
        }

        private Models.AlbumDescriptor LoadAlbumDescriptor(string path)
        {
            Contract.Requires(!string.IsNullOrEmpty(path));

            using (var stream = this.fileProvider.GetAlbumDescriptor(path))
            {
                if (stream == null)
                    return null;

                using (var reader = new StreamReader(stream))
                {
                    var json = reader.ReadToEnd();
                    return Models.AlbumDescriptor.Parse(json);
                }
            }
        }

        #endregion
    }
}
