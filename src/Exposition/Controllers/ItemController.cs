using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Exposition.Services;
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
            Contract.RequireNotNull(fileProvider);
            this.fileProvider = fileProvider;
        }

        [HttpGet("{*path}")]
        public Models.Item Get(string path)
        {
            return CreateItem(path);
        }

        [HttpGet]
        public Models.Item Get()
        {
            return CreateItem("");
        }

        #endregion

        #region Implementation       

        private Models.Item CreateItem(string path, string title=null)
        {
            Contract.RequireNotNull(path);

            // Set title of root item
            if (title == null)
            {
                title = Path.GetFileNameWithoutExtension(path);
                if (path != "")
                {
                    var descriptor = LoadAlbumDescriptor(Path.GetDirectoryName(path));
                    if (descriptor != null)
                    {
                        var match = descriptor.Children.Where(item => item.Filename == Path.GetFileName(path) && !string.IsNullOrEmpty(item.Title));
                        if (match.Count() != 0)
                            title = match.First().Title;
                    }
                }
            }

            // Check type
            var type = this.fileProvider.GetItemType(path);
            if (type == FileProvider.ItemType.Photo)
            {
                // Photo
                return new Models.Photo("/"+path, title);
            }
            else if (type == FileProvider.ItemType.Album)
            {
                // ### FIXME: This is fully recursive. Denial of service
                Func<string, string, Models.Item> SafeCreateItem = (item_path, item_title) =>
                {
                    try
                    {
                        return CreateItem(item_path, item_title);
                    }
                    catch (Exception)
                    {
                        // We are resilient to children items not loading. The album might still be partially usable.
                        // ### TODO: log
                        return null;
                    }
                };

                IEnumerable<Models.Item> children;
                var descriptor = LoadAlbumDescriptor(path);
                if (descriptor == null)
                {
                    // Use file system to resolve children
                    children = this.fileProvider.GetAlbumChildren(path).Select(x => SafeCreateItem(x, Path.GetFileNameWithoutExtension(x)));
                }
                else
                {
                    // Use album descriptor to resolve chilren
                    children = descriptor.Children.Select(item => {
                        var item_path = path + (path == "" ? "" : "/");
                        item_path += item.Filename;
                        return SafeCreateItem(item_path, item.Title ?? Path.GetFileNameWithoutExtension(item.Filename));
                    });
                }
                children = children.Where(x => x != null);
                return new Models.Album("/" + path, title, children);
            }

            throw new Exception("Unreachable Statement");
        }

        private Models.AlbumDescriptor LoadAlbumDescriptor(string path)
        {
            Contract.RequireNotNull(path);

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
