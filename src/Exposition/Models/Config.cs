using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Exposition.Models
{
    public class Config
    {
        public string Version { get; set; }
        public string Info { get; set; }
        public string GalleryName { get; set; }
        public int[] PhotoSizes { get; set; }
        public int[] ThumbnailSizes { get; set; }
        public bool IsDownloadAllowed { get; set;}


        public Config(AppSettings settings)
        {
            Contract.RequireNotNull(settings);
            Contract.Require(settings.IsValid());

            // ### FIXME: Hardcoded
            this.Version = "0.5";

            // ### FIXME:
            this.Info = "";

            this.GalleryName = settings.GalleryName;
            this.PhotoSizes = settings.PhotoSizes;
            this.ThumbnailSizes = settings.ThumbnailSizes;
            this.IsDownloadAllowed = settings.IsDownloadAllowed;
        }
    }
}
