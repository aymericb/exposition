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
        [Fact]
        public void InvalidJson()
        {
            var exception = Record.Exception(() => Models.AlbumDescriptor.Parse(null));
            Assert.NotNull(exception);

            exception = Record.Exception(() => Models.AlbumDescriptor.Parse(""));
            Assert.NotNull(exception);

            exception = Record.Exception(() => Models.AlbumDescriptor.Parse("asdasd"));
            Assert.NotNull(exception);

            exception = Record.Exception(() => Models.AlbumDescriptor.Parse("{\"version\": 1,"));
            Assert.NotNull(exception);
        }

        [Fact]
        public void InvalidVersion()
        {
            var json = "{\"version\": 2, \"children\":  [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { \"filename\": \"2007\"} ] }";
            var exception = Record.Exception(() => Models.AlbumDescriptor.Parse(json));
            Assert.NotNull(exception);
            
            json = "{\"version\": \"xxx\", \"children\":  [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { \"filename\": \"2007\"} ] }";
            exception = Record.Exception(() => Models.AlbumDescriptor.Parse(json));
            Assert.NotNull(exception);
        }

        [Fact]
        public void InvalidChildren()
        {
            var actions = new Action[] {
                () => Models.AlbumDescriptor.Parse("{\"version\": 1 }"),
                () => Models.AlbumDescriptor.Parse("{\"version\": 1, \"children\":  [ ] }"),
                () => Models.AlbumDescriptor.Parse("{\"version\": 1, \"children\":  [ { \"x\": \"2014\"} ] }"),
                () => Models.AlbumDescriptor.Parse("{\"version\": 1, \"children\":  [ [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { } ] }"),
                () => Models.AlbumDescriptor.Parse("{\"version\": 1, \"children\":  [ [ { \"title\": \"2014\"} ] }")
            };

            var exceptions = actions.Select(x => Record.Exception(x)).ToArray();
            Assert.Equal(0, exceptions.Where(x => x == null).Count());
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
            Assert.Equal(descriptor.Children.ToList()[0].Filename, "2014");
            Assert.Equal(descriptor.Children.ToList()[1].Filename, "2013");
            Assert.Equal(descriptor.Children.ToList()[2].Filename, "2007");
            Assert.Equal(descriptor.Children.ToList()[0].Title, null);
            Assert.Equal(descriptor.Children.ToList()[1].Title, null);
            Assert.Equal(descriptor.Children.ToList()[2].Title, null);
        }

        [Fact]
        public void Parse()
        {
            var json = "{\"version\": 1, \"children\":  [ { \"filename\": \"2014\", \"title\": \"title_2014\"}, { \"filename\": \"2013\", \"title\": \"title_2013\" }, { \"filename\": \"2007\"} ] }";
            var descriptor = Models.AlbumDescriptor.Parse(json);

            Assert.Equal(1, descriptor.Version);
            Assert.NotNull(descriptor.Children);
            Assert.Equal(3, descriptor.Children.Count());
            Assert.Equal(descriptor.Children.ToList()[0].Filename, "2014");
            Assert.Equal(descriptor.Children.ToList()[1].Filename, "2013");
            Assert.Equal(descriptor.Children.ToList()[2].Filename, "2007");
            Assert.Equal(descriptor.Children.ToList()[0].Title, "title_2014");
            Assert.Equal(descriptor.Children.ToList()[1].Title, "title_2013");
            Assert.Equal(descriptor.Children.ToList()[2].Title, null);
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
