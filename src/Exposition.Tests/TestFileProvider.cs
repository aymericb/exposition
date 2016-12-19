using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.Extensions.Options;

namespace Exposition.Tests
{
    [TestClass]
    public class TestFileProvider
    {
        static private readonly string ALBUM_DIR = "C:\\Exposition\\Root\\AlbumDir";
        static private readonly string CACHE_DIR = "C:\\Exposition\\Root\\CacheDir";

        private Services.IFileProvider provider;

        [TestInitialize]
        public void Setup()
        {
            var settings = new AppSettings
            {
                AlbumDir = ALBUM_DIR,
                CacheDir = CACHE_DIR
            };
            this.provider = new Services.FileProvider(Options.Create(settings));
        }

        [TestMethod]
        public void TestInvalidPath_GetItemType()
        {
            // FIXME
            //provider.GetItemType("");

            Assertion.Throws(() => provider.GetItemType(ALBUM_DIR));
            Assertion.Throws(() => provider.GetItemType(CACHE_DIR));
            Assertion.Throws(() => provider.GetItemType("C:\\"));
            Assertion.Throws(() => provider.GetItemType("/"));
            Assertion.Throws(() => provider.GetItemType(".."));
            Assertion.Throws(() => provider.GetItemType("/.."));
            Assertion.Throws(() => provider.GetItemType("../item"));
            Assertion.Throws(() => provider.GetItemType("/../item"));
            Assertion.Throws(() => provider.GetItemType("..\\item"));
            Assertion.Throws(() => provider.GetItemType("\\..\\item"));

        }


    }
}
