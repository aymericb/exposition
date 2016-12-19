using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace Exposition.Models
{
    public class AlbumDescriptor
    {
        public class Item
        {
            [JsonRequired]
            public string Filename { get; set; }

            public string Title { get; set; }
        }

        [JsonRequired]
        public int Version { get; set; }

        [JsonRequired]
        [NonEmptyEnumerable]
        public IEnumerable<Item> Children { get; set; }

        static public int CURRENT_VERSION = 1;

        static public AlbumDescriptor Parse(string json)
        {
            var album = JsonConvert.DeserializeObject<Models.AlbumDescriptor>(json);
            if (album == null)
                throw new System.IO.InvalidDataException();
            if (album.Version != CURRENT_VERSION)
                throw new NotImplementedException($"Version ${album.Version} is not supported");

            var validation_ctx = new ValidationContext(album);
            Validator.ValidateObject(album, validation_ctx, true);


            return album;
        }
    }
}
