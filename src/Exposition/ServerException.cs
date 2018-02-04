using System;
namespace Exposition
{
    public class ServerException : Exception
    {
        public ServerException(Models.Error error)
        {
            this.Error = error;
        }

        public Models.Error Error { get; }
    }
}
