using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Exposition;

namespace Exposition.Tests
{
    public class ItemController
    {
        private Controllers.ItemController controller;

        public ItemController()
        {
            this.controller = new Controllers.ItemController(FileProvider.CreateMockFileProvider());
        }

        [Fact]
        public void GetRootAlbum()
        {
            var item = this.controller.Get();

            Assert.Equal("", item.Title);
            Assert.Equal("/", item.Path);
            Assert.Equal(Models.Item.TYPE_ALBUM, item.Type);
            Assert.True(item is Models.Album);

            var album = (Models.Album)item;
            Assert.NotEmpty(album.Children);
            Assert.Equal(2, album.Children.Count());

            // Non albphabetical order imposed by albums.json
            var children = album.Children.ToArray();
            Assert.IsType<Models.Album>(children[0]);
            Assert.Equal("Cities", children[0].Title);
            Assert.Equal("/cities", children[0].Path);
            Assert.IsType<Models.Album>(children[1]);
            Assert.Equal("Animals", children[1].Title);
            Assert.Equal("/animals", children[1].Path);
        }
        
        [Fact]
        public void GetAlbumWithDescriptor()
        {
            var path = "/cities";
            var item = this.controller.Get(path.Substring(1));

            Assert.Equal("Cities", item.Title);
            Assert.Equal(path, item.Path);
            Assert.Equal(Models.Item.TYPE_ALBUM, item.Type);
            Assert.True(item is Models.Album);

            var album = (Models.Album)item;
            Assert.NotEmpty(album.Children);
            Assert.Equal(4, album.Children.Count());

            // Some titles decuded from json some from file system
            // Some files do not exist
            var children = album.Children.ToArray();
            Assert.IsType<Models.Album>(children[0]);
            Assert.Equal("Dubai", children[0].Title);
            Assert.Equal("/cities/dubai", children[0].Path);
            Assert.IsType<Models.Album>(children[1]);
            Assert.Equal("europe", children[1].Title);
            Assert.Equal("/cities/europe", children[1].Path);
            Assert.IsType<Models.Album>(children[2]);
            Assert.Equal("singapore", children[2].Title);
            Assert.Equal("/cities/singapore", children[2].Path);
            Assert.IsType<Models.Photo>(children[3]);
            Assert.Equal("interchange", children[3].Title);
            Assert.Equal("/cities/qqwxu7njwti-jindong-h.jpg", children[3].Path);
        }

        [Fact]
        public void GetAlbumWithParentDescriptor()
        {
            var path = "/cities/dubai";
            var item = this.controller.Get(path.Substring(1));

            // Title set from parent album descriptor
            Assert.Equal("Dubai", item.Title);
            Assert.Equal(path, item.Path);
            Assert.Equal(Models.Item.TYPE_ALBUM, item.Type);
            Assert.True(item is Models.Album);

            var album = (Models.Album)item;
            Assert.NotEmpty(album.Children);
            Assert.Equal(3, album.Children.Count());

            var children = album.Children.ToArray();
            Assert.IsType<Models.Photo>(children[0]);
            Assert.Equal("cv4qkkordfy-robert-bock", children[0].Title);
            Assert.Equal("/cities/dubai/cv4qkkordfy-robert-bock.jpg", children[0].Path);
            Assert.IsType<Models.Photo>(children[1]);
            Assert.Equal("j7cli8qj0xa-rktkn", children[1].Title);
            Assert.Equal("/cities/dubai/j7cli8qj0xa-rktkn.jpg", children[1].Path);
            Assert.IsType<Models.Photo>(children[2]);
            Assert.Equal("jomuw0-3f8a-roman-logov", children[2].Title);
            Assert.Equal("/cities/dubai/jomuw0-3f8a-roman-logov.jpg", children[2].Path);
        }

        [Fact]
        public void GetAlbumWithoutDescriptor()
        {
            var path = "/cities/europe/london";
            var item = this.controller.Get(path.Substring(1));

            Assert.Equal("london", item.Title);
            Assert.Equal(path, item.Path);
            Assert.Equal(Models.Item.TYPE_ALBUM, item.Type);
            Assert.True(item is Models.Album);

            var album = (Models.Album)item;
            Assert.NotEmpty(album.Children);
            Assert.Equal(5, album.Children.Count());

            var children = album.Children.ToArray();
            Assert.IsType<Models.Photo>(children[0]);
            Assert.Equal("hakd2yx3xyo-david-east", children[0].Title);
            Assert.Equal("/cities/europe/london/hakd2yx3xyo-david-east.jpg", children[0].Path);
            Assert.IsType<Models.Photo>(children[1]);
            Assert.Equal("n3pqjmom9ug-rob-bye", children[1].Title);
            Assert.Equal("/cities/europe/london/n3pqjmom9ug-rob-bye.jpg", children[1].Path);
            Assert.IsType<Models.Photo>(children[2]);
            Assert.Equal("ntg5ar7g7kq-samuel-zeller", children[2].Title);
            Assert.Equal("/cities/europe/london/ntg5ar7g7kq-samuel-zeller.jpg", children[2].Path);
            Assert.IsType<Models.Photo>(children[3]);
            Assert.Equal("nzztld3_7ym-jamie-street", children[3].Title);
            Assert.Equal("/cities/europe/london/nzztld3_7ym-jamie-street.jpg", children[3].Path);
            Assert.IsType<Models.Photo>(children[4]);
            Assert.Equal("xzer0sqkpee-bruno-abatti", children[4].Title);
            Assert.Equal("/cities/europe/london/xzer0sqkpee-bruno-abatti.jpg", children[4].Path);
        }

        [Fact]
        public void GetAlbumWithHiddenFile()
        {
            var path = "/cities/europe/paris";
            var item = this.controller.Get(path.Substring(1));

            Assert.Equal("paris", item.Title);
            Assert.Equal(path, item.Path);
            Assert.Equal(Models.Item.TYPE_ALBUM, item.Type);
            Assert.True(item is Models.Album);

            var album = (Models.Album)item;
            Assert.NotEmpty(album.Children);
            Assert.Equal(4, album.Children.Count());
        }

        [Fact]
        public void GetPhotoWithDescriptorTitle()
        {
            var path = "/cities/qqwxu7njwti-jindong-h.jpg";
            var item = this.controller.Get(path.Substring(1));
            Assert.Equal("interchange", item.Title);
            Assert.Equal(path, item.Path);
            Assert.Equal(Models.Item.TYPE_PHOTO, item.Type);
            Assert.True(item is Models.Photo);
        }

        [Fact]
        public void GetPhotoWithDescriptorInvisible()
        {
            var path = "/cities/europe/paris/moognyoq1ne-felipe-dolce.jpg";
            var item = this.controller.Get(path.Substring(1));
            Assert.Equal("moognyoq1ne-felipe-dolce", item.Title);
            Assert.Equal(path, item.Path);
            Assert.Equal(Models.Item.TYPE_PHOTO, item.Type);
            Assert.True(item is Models.Photo);
        }

        [Fact]
        public void GetPhotoWithDescriptorNoTitle()
        {
            var path = "/cities/europe/paris/tjff7c7bqjy-lucas-gallone.jpg";
            var item = this.controller.Get(path.Substring(1));
            Assert.Equal("tjff7c7bqjy-lucas-gallone", item.Title);
            Assert.Equal(path, item.Path);
            Assert.Equal(Models.Item.TYPE_PHOTO, item.Type);
            Assert.True(item is Models.Photo);
        }

        [Fact]
        public void GetPhotoWithoutDescriptor()
        {
            var path = "/cities/europe/london/hakd2yx3xyo-david-east.jpg";
            var item = this.controller.Get(path.Substring(1));
            Assert.Equal("hakd2yx3xyo-david-east", item.Title);
            Assert.Equal(path, item.Path);
            Assert.Equal(Models.Item.TYPE_PHOTO, item.Type);
            Assert.True(item is Models.Photo);
        }
    }
}
