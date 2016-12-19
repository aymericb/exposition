using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace Exposition.Tests
{
    [TestClass]
    public class TestAlbumDescriptor
    {
        [TestMethod]
        public void TestInvalidJson()
        {
            Assertion.Throws(() => Models.AlbumDescriptor.Parse(null));
            Assertion.Throws(() => Models.AlbumDescriptor.Parse(""));
            Assertion.Throws(() => Models.AlbumDescriptor.Parse("asdasd"));
            Assertion.Throws(() => Models.AlbumDescriptor.Parse("{\"version\": 1,"));
        }

        [TestMethod]
        public void TestInvalidVersion()
        {
            var json = "{\"version\": 2, \"children\":  [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { \"filename\": \"2007\"} ] }";
            Assertion.Throws(() => Models.AlbumDescriptor.Parse(json));
            json = "{\"version\": \"xxx\", \"children\":  [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { \"filename\": \"2007\"} ] }";
            Assertion.Throws(() => Models.AlbumDescriptor.Parse(json));
        }

        [TestMethod]
        public void TestInvalidChildren()
        {
            Assertion.Throws(() => Models.AlbumDescriptor.Parse("{\"version\": 1 }"));
            Assertion.Throws(() => Models.AlbumDescriptor.Parse("{\"version\": 1, \"children\":  [ ] }"));
            Assertion.Throws(() => Models.AlbumDescriptor.Parse("{\"version\": 1, \"children\":  [ { \"x\": \"2014\"} ] }"));
            Assertion.Throws(() => Models.AlbumDescriptor.Parse("{\"version\": 1, \"children\":  [ [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { } ] }"));
            Assertion.Throws(() => Models.AlbumDescriptor.Parse("{\"version\": 1, \"children\":  [ [ { \"title\": \"2014\"} ] }"));
        }

        [TestMethod]
        public void TestInvalidNoFileName()
        {
            Assertion.Throws(() => Models.AlbumDescriptor.Parse("{\"version\": 1, \"children\":  [ { \"title\": \"2014\"} ] }"));
        }

        [TestMethod]
        public void TestParseNoTitle()
        {
            var json = "{\"version\": 1, \"children\":  [ { \"filename\": \"2014\"}, { \"filename\": \"2013\" }, { \"filename\": \"2007\"} ] }";
            var descriptor = Models.AlbumDescriptor.Parse(json);

            Assert.AreEqual(1, descriptor.Version);
            Assert.IsNotNull(descriptor.Children);
            Assert.AreEqual(3, descriptor.Children.Count());
            Assert.AreEqual(descriptor.Children.ToList()[0].Filename, "2014");
            Assert.AreEqual(descriptor.Children.ToList()[1].Filename, "2013");
            Assert.AreEqual(descriptor.Children.ToList()[2].Filename, "2007");
            Assert.AreEqual(descriptor.Children.ToList()[0].Title, null);
            Assert.AreEqual(descriptor.Children.ToList()[1].Title, null);
            Assert.AreEqual(descriptor.Children.ToList()[2].Title, null);
        }

        [TestMethod]
        public void TestParse()
        {
            var json = "{\"version\": 1, \"children\":  [ { \"filename\": \"2014\", \"title\": \"title_2014\"}, { \"filename\": \"2013\", \"title\": \"title_2013\" }, { \"filename\": \"2007\"} ] }";
            var descriptor = Models.AlbumDescriptor.Parse(json);

            Assert.AreEqual(1, descriptor.Version);
            Assert.IsNotNull(descriptor.Children);
            Assert.AreEqual(3, descriptor.Children.Count());
            Assert.AreEqual(descriptor.Children.ToList()[0].Filename, "2014");
            Assert.AreEqual(descriptor.Children.ToList()[1].Filename, "2013");
            Assert.AreEqual(descriptor.Children.ToList()[2].Filename, "2007");
            Assert.AreEqual(descriptor.Children.ToList()[0].Title, "title_2014");
            Assert.AreEqual(descriptor.Children.ToList()[1].Title, "title_2013");
            Assert.AreEqual(descriptor.Children.ToList()[2].Title, null);
        }
    }
}
