using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Exposition
{
    /** 
     * Main configuration of Exposition
     * Typically done by editing appsettings.json
     */
    public class AppSettings
    {
        //
        // Configuration values that must be provided by user
        //

        /** Name of the gallery. Displayed to end user */
        public string GalleryName { get; set; } = "Exposition";

        /** Path to album directory (read-only) */
        public string AlbumDir { get; set; }

        /** Path to cache directory (read-write) */
        public string CacheDir { get; set; }

        //
        // Configuration values with suitable defaults
        //

        /** Extensions of files which are recognized as photos. Lowercase */
        public string[] PhotoExtensions { get; set; } = new [] { "jpg", "jpeg", "png" };

        /** Intermediate sizes used for photos (pixels) */
        public int[] PhotoSizes { get; set; } = new[]
        {
            0,      // Full Size
            2560,   // iMac 27" non-retina
            2048,   // iPad Retina 
            1334,   // iPhone 7
            960,
            512
        };

        /** Intermediate sizes used for thumbnails (pixels) */
        public int[] ThumbnailSizes { get; set; } = new[]
        {
            320,    // Thumbnails
            160
        };

        /** Indicates whether photos can be downloaded */
        public bool IsDownloadAllowed { get; set; } = true;

        //
        // Helper Methods
        //

        public bool IsValid()
        {
            return !string.IsNullOrWhiteSpace(this.AlbumDir) && !string.IsNullOrWhiteSpace(this.CacheDir);
        }
    }
}
