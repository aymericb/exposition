using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Exposition
{
    public class ContractException : Exception
    {
        public enum Type
        {
            Assert,
            Precondition, 
            Postcondition,
            Invariant
        }

        static private string CreateMessage(Type type, string message)
        {
            var str = type.ToString() + " Failed";
            if (message != null)
                str += ": " + message + ".";
            else
                str += ".";
            return str;
        }

        public ContractException(Type type, string message=null)
            : base(CreateMessage(type, message))
        {
            this.Data["contract"] = type.ToString().ToLowerInvariant();
        }
    }

    public class Contract
    {
        static public void Assert(bool condition, string message=null)
        {
            if (!condition)
                throw new ContractException(ContractException.Type.Assert, message);
        }

        static public void AssertNotNull(object obj)
        {
            if (obj == null)
                throw new ContractException(ContractException.Type.Assert, "object is null");
        }

        static public void AssertStringNotEmpty(string str)
        {
            if (string.IsNullOrEmpty(str))
                throw new ContractException(ContractException.Type.Assert, "string is null or empty");
        }

        static public void Require(bool condition, string message=null)
        {
            if (!condition)
                throw new ContractException(ContractException.Type.Precondition, message);
        }

        static public void RequireNotNull(object obj)
        {
            if (obj == null)
                throw new ContractException(ContractException.Type.Precondition, "object is null");
        }

        static public void RequireStringNotEmpty(string str)
        {
            if (string.IsNullOrEmpty(str))
                throw new ContractException(ContractException.Type.Precondition, "string is null or empty");
        }

        static public void Ensure(bool condition, string message=null)
        {
            if (!condition)
                throw new ContractException(ContractException.Type.Postcondition, message);
        }

        static public void EnsureNotNull(object obj)
        {
            if (obj == null)
                throw new ContractException(ContractException.Type.Postcondition, "object is null");
        }

        static public void EnsureStringNotEmpty(string str)
        {
            if (string.IsNullOrEmpty(str))
                throw new ContractException(ContractException.Type.Postcondition, "string is null or empty");
        }

        static public void Invariant(bool condition, string message=null)
        {
            if (!condition)
                throw new ContractException(ContractException.Type.Invariant, message);
        }

        static public void InvariantNotNull(object obj)
        {
            if (obj == null)
                throw new ContractException(ContractException.Type.Invariant, "object is null");
        }

        static public void InvariantStringNotEmpty(string str)
        {
            if (string.IsNullOrEmpty(str))
                throw new ContractException(ContractException.Type.Invariant, "string is null or empty");
        }

    }
}
