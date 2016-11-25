using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.RegularExpressions;

namespace Exposition.Utilities
{
    public class SnakeCasePropertyNamesContractResolver : DefaultContractResolver
    {
        static private Regex REGEX_IDENTIFIER = new Regex(@"[_a-zA-Z][_a-zA-Z0-9]*");

        public SnakeCasePropertyNamesContractResolver()
        : base()
        {
            // Nothing
        }

        protected override string ResolvePropertyName(string propertyName)
        {
            if (REGEX_IDENTIFIER.IsMatch(propertyName))
            {
                return ToSnakeCase(propertyName);
            }
            else
            {
                return propertyName;
            }
        }

        private string ToSnakeCase(string property)
        {
            var input = property.ToCharArray();
            var output = new List<char>(input.Length + 10);

            foreach (var c in input)
            {
                if (char.IsUpper(c))
                {
                    output.Add('_');
                    output.Add(char.ToLowerInvariant(c));
                }
                else
                {
                    output.Add(c);
                }
            }

            var output_str = new string(output.ToArray());
            if (output_str[0] == '_' && char.IsUpper(input[0]))
            {
                output_str = output_str.Substring(1);
            }

            return output_str;
        }
    }
}
