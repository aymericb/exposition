using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Microsoft.Extensions.Options;
using System.IO;
using System.Reflection;

namespace Exposition.Tests
{
    public class FileProvider
    {
        private Services.IFileProvider provider;

        public static readonly string FIXTURE_DIR = Path.Combine(Path.GetDirectoryName(typeof(FileProvider).GetTypeInfo().Assembly.Location), "..\\..\\..\\Fixtures");
        public static readonly string ALBUM_DIR = Path.Combine(FIXTURE_DIR, "Albums");
        public static readonly string CACHE_DIR = Path.Combine(FIXTURE_DIR, "Cache");

        private static readonly string[] UNAUTHORIZED_PATHS = new[] { ALBUM_DIR, "C:\\", "/", "..", "/..", "../item", "/../item", "..\\item", "\\..\\item" };

        static public Services.IFileProvider CreateMockFileProvider()
        {
            var settings = new AppSettings
            {
                AlbumDir = ALBUM_DIR,
                CacheDir = CACHE_DIR
            };
            return new Services.FileProvider(Options.Create(settings));
        }

        public FileProvider()
        {
            this.provider = CreateMockFileProvider();
        }

        #region GetItemType

        [Fact]
        public void GetItemType_UnauthorizedPath()
        {
            var exceptions = UNAUTHORIZED_PATHS.Select(x => Record.Exception(() => this.provider.GetItemType(x)));
            Assert.Empty(exceptions.Where(x => x == null));
            Assert.Empty(exceptions.Where(x => x.GetType() != typeof(UnauthorizedAccessException)));
        }

        [Fact]
        public void GetItemType_UnauthorizedExtension()
        {
            var exception = Record.Exception(() => this.provider.GetItemType("album.json"));
            Assert.NotNull(exception);
            Assert.IsType<UnauthorizedAccessException>(exception);
        }

        [Fact]
        public void GetItemType_FileNotFound()
        {
            var exception = Record.Exception(() => this.provider.GetItemType("something.jpg"));
            Assert.NotNull(exception);
            Assert.IsType<FileNotFoundException>(exception);
        }

        [Fact]
        public void GetItemType()
        {
            var albums = new[] { "", "animals", "cities", "cities/dubai", "cities/europe", "cities/singapore", "cities/europe/london", "cities/europe/paris" };
            var types = albums.Select(x => this.provider.GetItemType(x));
            Assert.Empty(types.Where(x => x != Services.FileProvider.ItemType.Album));

            var photos = new[] { "animals/edqp5r_qwre-alec-weir.jpg", "animals/t20pc32vbru-thomas-kelley.jpg", "cities/qqwxu7njwti-jindong-h.jpg",
                "cities/dubai/cv4qkkordfy-robert-bock.jpg", "cities/dubai/j7cli8qj0xa-rktkn.jpg", "cities/dubai/jomuw0-3f8a-roman-logov.jpg",
                "cities/europe/london/hakd2yx3xyo-david-east.jpg", "cities/europe/london/n3pqjmom9ug-rob-bye.jpg", "cities/europe/london/ntg5ar7g7kq-samuel-zeller.jpg",
                "cities/europe/london/nzztld3_7ym-jamie-street.jpg", "cities/europe/london/xzer0sqkpee-bruno-abatti.jpg", "cities/europe/paris/adl1z8_ngy-stacy-wyss.jpg",
                "cities/europe/paris/l2oedf1ash8-all-bong.jpg", "cities/europe/paris/moognyoq1ne-felipe-dolce.jpg", "cities/europe/paris/tjff7c7bqjy-lucas-gallone.jpg",
                "cities/europe/paris/w7rimytn6wk-pedro-gandra.jpg" };
            types = photos.Select(x => this.provider.GetItemType(x));
            var types2 = types.ToArray();
            Assert.Empty(types.Where(x => x != Services.FileProvider.ItemType.Photo));
        }

        #endregion

        #region GetAlbumChildren

        [Fact]
        public void GetAlbumChildren_UnauthorizedPath()
        {
            var exceptions = UNAUTHORIZED_PATHS.Select(x => Record.Exception(() => this.provider.GetAlbumChildren(x)));
            Assert.Empty(exceptions.Where(x => x == null));
            Assert.Empty(exceptions.Where(x => x.GetType() != typeof(UnauthorizedAccessException)));
        }

        [Fact]
        public void GetAlbumChildren_FileNotFound()
        {
            var exception = Record.Exception(() => this.provider.GetAlbumChildren("something.jpg"));
            Assert.NotNull(exception);
            Assert.IsType<FileNotFoundException>(exception);
        }

        [Fact]
        public void GetAlbumChildren_DirectoryNotFound()
        {
            var exception = Record.Exception(() => this.provider.GetAlbumChildren("cities/qqwxu7njwti-jindong-h.jpg"));
            Assert.NotNull(exception);
            Assert.IsType<DirectoryNotFoundException>(exception);
        }

        [Fact]
        public void GetAlbumChilren()
        {
            var paths = this.provider.GetAlbumChildren("");
            Assert.True(paths.SequenceEqual(new string[] { "animals", "cities" }));

            paths = this.provider.GetAlbumChildren("cities");
            Assert.True(paths.SequenceEqual(new string[] { "cities/dubai", "cities/europe", "cities/qqwxu7njwti-jindong-h.jpg", "cities/singapore" }));

            paths = this.provider.GetAlbumChildren("cities/europe");
            Assert.True(paths.SequenceEqual(new string[] { "cities/europe/london", "cities/europe/paris" }));

            paths = this.provider.GetAlbumChildren("cities/europe/paris");
            Assert.True(paths.SequenceEqual(new string[] { "cities/europe/paris/adl1z8_ngy-stacy-wyss.jpg", "cities/europe/paris/l2oedf1ash8-all-bong.jpg", "cities/europe/paris/moognyoq1ne-felipe-dolce.jpg", "cities/europe/paris/tjff7c7bqjy-lucas-gallone.jpg", "cities/europe/paris/w7rimytn6wk-pedro-gandra.jpg" }));
        }

        #endregion

        #region GetAlbumDescriptor

        [Fact]
        public void GetAlbumDescriptor_UnauthorizedPath()
        {
            var exceptions = UNAUTHORIZED_PATHS.Select(x => Record.Exception(() => this.provider.GetAlbumDescriptor(x)));
            Assert.Empty(exceptions.Where(x => x == null));
            Assert.Empty(exceptions.Where(x => x.GetType() != typeof(UnauthorizedAccessException)));
        }

        [Fact]
        public void GetAlbumDescriptor_FileNotFound()
        {
            var exception = Record.Exception(() => this.provider.GetAlbumDescriptor("something.jpg"));
            Assert.NotNull(exception);
            Assert.IsType<FileNotFoundException>(exception);
        }

        [Fact]
        public void GetAlbumDescriptor_DirectoryNotFound()
        {
            var exception = Record.Exception(() => this.provider.GetAlbumDescriptor("cities/qqwxu7njwti-jindong-h.jpg"));
            Assert.NotNull(exception);
            Assert.IsType<DirectoryNotFoundException>(exception);
        }

        [Fact]
        public void GetAlbumDescriptor()
        {
            var text = File.ReadAllText(Path.Combine(FIXTURE_DIR, "Albums\\album.json"));
            using (var reader = new StreamReader(this.provider.GetAlbumDescriptor("")))
            {
                Assert.Equal(text, reader.ReadToEnd());
            }

            text = File.ReadAllText(Path.Combine(FIXTURE_DIR, "Albums\\cities\\album.json"));
            using (var reader = new StreamReader(this.provider.GetAlbumDescriptor("cities")))
            {
                Assert.Equal(text, reader.ReadToEnd());
            }
        }

        #endregion

        #region GetPhoto
        #endregion

    }
}
