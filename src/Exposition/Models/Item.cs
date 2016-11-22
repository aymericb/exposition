using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Threading.Tasks;

namespace Exposition.Models
{
    public class Item
    {
        public string Title { get; }
        public string Path { get; }

        public Item(string path, string title)
        {
            Contract.Requires(title != null);
            Contract.Requires(!string.IsNullOrEmpty(path));
            this.Title = title;
            this.Path = path;
        }
    }
}
