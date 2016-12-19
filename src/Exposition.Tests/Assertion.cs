using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Diagnostics;

namespace Exposition.Tests
{
    /** Additional helpers missing in Assert type */ 
    public static class Assertion
    {
        public static void Throws(Action task)
        {
            try
            {
                task();
            }
            catch (Exception)
            {
                // Good
                return;
            }

            throw new Exception("No exception thrown");
        }
    }

    [TestClass]
    public class AssertionTest
    {
        [TestMethod]
        public void TestThrowSuccess()
        {
            Assertion.Throws(() => { throw new Exception("expected exception");  });
        }

        [TestMethod]
        [ExpectedException(typeof(Exception), "No exception thrown")]
        public void TestThrowFail()
        {
            Assertion.Throws(() => {  } );
        }
    }
}
