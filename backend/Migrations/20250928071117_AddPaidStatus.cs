using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPaidStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "StatusMaster",
                columns: new[] { "Id", "StatusCode", "StatusName", "Description", "ColorCode", "IconCode", "SortOrder", "IsActive", "CreatedAt", "UpdatedAt" },
                values: new object[] { 8, "Paid", "Paid", "Payment has been completed successfully", "bg-emerald-500", "CheckCircle", 6, true, DateTime.UtcNow, DateTime.UtcNow });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "StatusMaster",
                keyColumn: "Id",
                keyValue: 8);
        }
    }
}
