using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Exposition.Models
{
    abstract public class Item
    {
        public const string TYPE_ALBUM = "album";
        public const string TYPE_PHOTO = "photo";

        public string Title { get; }
        public string Path { get; }
        public abstract string Type { get; }

        public Item(string path, string title)
        {
            Contract.RequireNotNull(title);
            Contract.RequireNotNull(path);
            this.Title = title;
            this.Path = path;
        }
    }
}
