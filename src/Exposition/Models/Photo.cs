using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Exposition.Models
{
    public class Photo : Item
    {
        public Photo(string path, string title)
            : base(path, title)
        {
        }
    }
}
