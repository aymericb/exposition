using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Exposition.Models
{
    public class Photo : Item
    {
        public override string Type { get; } = TYPE_PHOTO;

        public Photo(string path, string title)
            : base(path, title)
        {
        }
    }
}
