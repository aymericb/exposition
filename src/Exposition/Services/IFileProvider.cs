using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;
using static Exposition.Services.FileProvider;

namespace Exposition.Services
{
    public interface IFileProvider
    {
        ItemType GetItemType(string album_path);
        IEnumerable<string> GetAlbumChildren(string album_path);
        Stream GetAlbumDescriptor(string album_path);
        Stream GetPhoto(string album_path);
    }
}
