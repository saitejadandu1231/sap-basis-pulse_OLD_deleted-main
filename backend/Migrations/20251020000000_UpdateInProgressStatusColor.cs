using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInProgressStatusColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update the In Progress status color from bg-yellow-500 to bg-indigo-500
            migrationBuilder.Sql(@"
                UPDATE ""StatusMaster"" 
                SET ""ColorCode"" = 'bg-indigo-500', ""UpdatedAt"" = now() at time zone 'utc'
                WHERE ""StatusCode"" = 'InProgress';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert the In Progress status color back to bg-yellow-500
            migrationBuilder.Sql(@"
                UPDATE ""StatusMaster"" 
                SET ""ColorCode"" = 'bg-yellow-500', ""UpdatedAt"" = now() at time zone 'utc'
                WHERE ""StatusCode"" = 'InProgress';
            ");
        }
    }
}