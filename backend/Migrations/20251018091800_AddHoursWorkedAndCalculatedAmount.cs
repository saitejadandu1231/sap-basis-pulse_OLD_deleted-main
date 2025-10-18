using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHoursWorkedAndCalculatedAmount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CalculatedAmount",
                table: "Orders",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyRate",
                table: "Orders",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HoursWorked",
                table: "Orders",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CalculatedAmount",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "HourlyRate",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "HoursWorked",
                table: "Orders");
        }
    }
}
