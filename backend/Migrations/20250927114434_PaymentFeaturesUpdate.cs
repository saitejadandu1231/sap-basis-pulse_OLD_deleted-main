using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class PaymentFeaturesUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EscrowCancelledAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EscrowInitiatedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EscrowNotes",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EscrowReleaseCondition",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EscrowReleasedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsInEscrow",
                table: "Payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EscrowCancelledAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "EscrowInitiatedAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "EscrowNotes",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "EscrowReleaseCondition",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "EscrowReleasedAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "IsInEscrow",
                table: "Payments");
        }
    }
}
