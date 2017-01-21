using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Threading.Tasks;

namespace Exposition.Models
{
    public class Album : Item
    {
        public override string Type { get; } = TYPE_ALBUM;
        public IEnumerable<Item> Children { get; }

        public Album(string path, string title, IEnumerable<Item> children)
            : base(path, title)
        {
            Contract.Requires(children != null);
            this.Children = children;
        }
    }
}
