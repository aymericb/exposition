using System;
using System.Collections;
using System.Net;
using Newtonsoft.Json;

namespace Exposition.Models
{
    public class Error
    {
        public static readonly Error Unknown = new Error("internal_error", "The server has encountered an unexpected error.", HttpStatusCode.InternalServerError);

        public static readonly Error ItemNotFound = new Error("item_not_found", "The requested item does not exist", HttpStatusCode.NotFound);
        public static readonly Error ItemForbidden = new Error("item_forbidden", "The requested item is not accessible", HttpStatusCode.Forbidden);

        private Error(string code, string description, HttpStatusCode status)
        {
            this.Code = code;
            this.Description = description;
            this.Status = status;
        }

        [JsonProperty(PropertyName = "error")]
        public string Code { get; }

        [JsonProperty(PropertyName = "description")]
        public string Description { get; }

        [JsonIgnore]
        public HttpStatusCode Status { get; }

#if DEBUG
        [JsonProperty(PropertyName = "debug")]
        public IDictionary Data { get; set; }
#endif
    }
}
