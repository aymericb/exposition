using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Exposition.Services
{
    public class FileProvider : IFileProvider
    {
        public enum ItemType
        {
            Album,
            Photo
        };

        private string[] PhotoExtensions { get; }
        private string AlbumDir { get; }

        #region IFileProvider

        public FileProvider(IOptions<AppSettings> settings)
        {
            Contract.Requires(settings.Value != null);
            Contract.Requires(settings.Value.IsValid());

            this.PhotoExtensions = settings.Value.PhotoExtensions;
            this.AlbumDir = settings.Value.AlbumDir;
        }

        public ItemType GetItemType(string path)
        {
            try
            {
                var fs_path = GetFileSystemPath(path);

                // Photo access
                if (File.Exists(fs_path))
                {
                    // Check if extension is white-listed
                    if (!this.PhotoExtensions.Select(x => "."+x.ToLowerInvariant()).Contains(Path.GetExtension(fs_path).ToLowerInvariant()))
                    {
                        throw new UnauthorizedAccessException();    // HTTP 403
                    }

                    return ItemType.Photo;
                }

                // Create Album
                else if (Directory.Exists(fs_path))
                {
                    return ItemType.Album;
                }

                throw new Exception("Unreachable Statement");
            }
            catch (Exception err)
            {
                err.Data["path"] = path;
                throw;
            }
        }

        public IEnumerable<string> GetAlbumChildren(string path)
        {
            try
            {
                var fs_path = GetFileSystemPath(path);
                if (!Directory.Exists(fs_path))
                {
                    throw new DirectoryNotFoundException();       // HTTP 404
                }

                return Directory.EnumerateFileSystemEntries(fs_path)
                                .Where(x => Directory.Exists(x) || this.PhotoExtensions.Select(y => "." + y.ToLowerInvariant()).Contains(Path.GetExtension(x).ToLowerInvariant()))
                                .Select(x => Path.GetFullPath(x))
                                .Select(x => x.Substring((Path.GetFullPath(this.AlbumDir) + Path.DirectorySeparatorChar).Length))
                                .Select(x => x.Replace(Path.DirectorySeparatorChar, '/'))
                                .OrderBy(x => x);
            }
            catch (Exception err)
            {
                err.Data["path"] = path;
                throw;
            }
        }

        public Stream GetAlbumDescriptor(string album_path)
        {
            try 
            {
                var fs_path = GetFileSystemPath(album_path);
                if (!Directory.Exists(fs_path))
                {
                    throw new DirectoryNotFoundException();       // HTTP 404
                }

                fs_path = Path.Combine(fs_path, "album.json");

                if (!File.Exists(fs_path))
                {
                    return null;
                }

                return new FileStream(fs_path, FileMode.Open);
            }
            catch (Exception err)
            {
                err.Data["path"] = album_path;
                throw;
            }
        }

        #endregion

        #region Implementation

        private string GetFileSystemPath(string path)
        {
            // Check path is a valid sub-path of AlbumDir
            if (Path.IsPathRooted(path))
                throw new UnauthorizedAccessException();    // HTTP 403
            var fs_path = Path.GetFullPath(Path.Combine(this.AlbumDir, path.Replace('/', Path.DirectorySeparatorChar)));
            if (!fs_path.StartsWith(Path.GetFullPath(this.AlbumDir)))
            {
                throw new UnauthorizedAccessException();    // HTTP 403
            }

            // Check if path exists at all
            if (!File.Exists(fs_path) && !Directory.Exists(fs_path))
            {
                throw new FileNotFoundException();          // HTTP 404
            }

            return fs_path;
        }

        #endregion
    }
}
