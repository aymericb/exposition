using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Exposition.Models
{
    public class NonEmptyEnumerableAttribute : ValidationAttribute
    {
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            var list = value as IList;
            if (list == null)
                return new ValidationResult("Not an enumerable");
            if (list.Count > 0)
                return ValidationResult.Success;
            else
                return new ValidationResult("Empty collection");            
        }
    }
}
