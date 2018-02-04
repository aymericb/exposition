using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Serialization;
using Microsoft.AspNetCore.Diagnostics;
using Newtonsoft.Json;

namespace Exposition
{
    public class Startup
    {
        public IConfigurationRoot Configuration { get; }

        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            builder.AddEnvironmentVariables();
            this.Configuration = builder.Build();
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit http://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            // Framework Services
            services.AddMvc()
                    .AddJsonOptions(options => options.SerializerSettings.ContractResolver = new Utilities.SnakeCasePropertyNamesContractResolver());

            services.AddOptions();

            // Configuration
            services.Configure<AppSettings>(this.Configuration.GetSection("AppSettings"));

            // Application services
            services.AddSingleton<Services.IFileProvider, Services.FileProvider>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole();

#if DEVELOPER_EXCEPTIONS
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
#endif 

            app.UseExceptionHandler(action =>
            {
                action.Run(async context => {
                    context.Response.ContentType = "application/json";
                    var feature = context.Features.Get<IExceptionHandlerFeature>();
                    if (feature != null)
                    {
                        // Capture error
                        var error = Models.Error.Unknown;
                        var exception = feature.Error as ServerException;
                        if (exception != null)
                            error = exception.Error;

#if DEBUG
                        // Add debug info
                        error.Data = exception.Data;
#endif

                        // Write response
                        context.Response.StatusCode = (int)error.Status;
                        await context.Response.WriteAsync(JsonConvert.SerializeObject(error)).ConfigureAwait(false);
                    }
                });
            });

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
