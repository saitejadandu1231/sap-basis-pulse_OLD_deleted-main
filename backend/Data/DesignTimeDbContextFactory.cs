using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace SapBasisPulse.Api.Data
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var env = System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
            var builder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile($"appsettings.{env}.json", optional: true)
                .AddEnvironmentVariables();

            var configuration = builder.Build();
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            var conn = configuration.GetConnectionString("DefaultConnection") ?? "Host=localhost;Port=5432;Database=sap_basis_pulse;Username=postgres;Password=postgres";
            optionsBuilder.UseNpgsql(conn);
            return new AppDbContext(optionsBuilder.Options);
        }
    }
}
