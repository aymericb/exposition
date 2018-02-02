using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;
using Xunit;

namespace Exposition.Tests
{
    public class AlbumDescriptor
    {
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("asdasd")]
        [InlineData("{\"version\": 1,")]
        public void InvalidJson(string data)
        {
            var exception = Record.Exception(() => Models.AlbumDescriptor.Parse(data));
            Assert.NotNull(exception);
        }

        [Theory]
        [InlineData("{\"version\": 2, \"children\":  [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { \"filename\": \"2007\"} ] }")]
        [InlineData("{\"version\": \"xxx\", \"children\":  [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { \"filename\": \"2007\"} ] }")]
        public void InvalidVersion(string json)
        {
            var exception = Record.Exception(() => Models.AlbumDescriptor.Parse(json));
            Assert.NotNull(exception);
        }

        [Theory]
        [InlineData("{\"version\": 1 }")]
        [InlineData("{\"version\": 1, \"children\":  [ ] }")]
        [InlineData("{\"version\": 1, \"children\":  [ { \"x\": \"2014\"} ] }")]
        [InlineData("{\"version\": 1, \"children\":  [ [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { } ] }")]
        [InlineData("{\"version\": 1, \"children\":  [ [ { \"title\": \"2014\"} ] }")]
        public void InvalidChildren(string data)
        {
            var exception = Record.Exception(() => Models.AlbumDescriptor.Parse(data));
            Assert.NotNull(exception);
        }

        [Fact]
        public void InvalidNoFileName()
        {
            var exception = Record.Exception( () => Models.AlbumDescriptor.Parse("{\"version\": 1, \"children\":  [ { \"title\": \"2014\"} ] }"));
            Assert.NotNull(exception);
        }

        [Fact]
        public void ParseNoTitle()
        {
            var json = "{\"version\": 1, \"children\":  [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { \"filename\": \"2007\"} ] }";
            var descriptor = Models.AlbumDescriptor.Parse(json);

            Assert.Equal(1, descriptor.Version);
            Assert.NotNull(descriptor.Children);
            Assert.Equal(3, descriptor.Children.Count());
            Assert.Equal("2014", descriptor.Children.ToList()[0].Filename);
            Assert.Equal("2013", descriptor.Children.ToList()[1].Filename);
            Assert.Equal("2007", descriptor.Children.ToList()[2].Filename);
            Assert.Null(descriptor.Children.ToList()[0].Title);
            Assert.Null(descriptor.Children.ToList()[1].Title);
            Assert.Null(descriptor.Children.ToList()[2].Title);
        }

        [Fact]
        public void Parse()
        {
            var json = "{\"version\": 1, \"children\":  [ { \"filename\": \"2014\", \"title\": \"title_2014\"}, { \"filename\": \"2013\", \"title\": \"title_2013\" }, { \"filename\": \"2007\"} ] }";
            var descriptor = Models.AlbumDescriptor.Parse(json);

            Assert.Equal(1, descriptor.Version);
            Assert.NotNull(descriptor.Children);
            Assert.Equal(3, descriptor.Children.Count());
            Assert.Equal("2014", descriptor.Children.ToList()[0].Filename);
            Assert.Equal("2013", descriptor.Children.ToList()[1].Filename);
            Assert.Equal("2007", descriptor.Children.ToList()[2].Filename);
            Assert.Equal("title_2014", descriptor.Children.ToList()[0].Title);
            Assert.Equal("title_2013", descriptor.Children.ToList()[1].Title);
            Assert.Null(descriptor.Children.ToList()[2].Title);
        }

        [Fact]
        public void ParseFixtures()
        {
            var descriptors = Directory.EnumerateFiles(FileProvider.FIXTURE_DIR, "*.json", SearchOption.AllDirectories).Where(x => x.EndsWith("album.json"));
            Assert.NotEmpty(descriptors);

            foreach (var path in descriptors)
            {
                var json = File.ReadAllText(path);
                Models.AlbumDescriptor.Parse(json);
            }
        }
    }
}
