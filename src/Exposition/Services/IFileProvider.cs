using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using static Exposition.Services.FileProvider;

namespace Exposition.Services
{
    public interface IFileProvider
    {
        ItemType GetItemType(string path);
        IEnumerable<string> GetAlbumChildren(string path);
    }
}
