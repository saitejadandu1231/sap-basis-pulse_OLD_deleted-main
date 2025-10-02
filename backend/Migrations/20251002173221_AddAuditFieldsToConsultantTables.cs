using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditFieldsToConsultantTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "ConsultantSkill",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ConsultantSkill",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "ConsultantSkill",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "ConsultantSkill",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "ConsultantAvailabilitySlots",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "ConsultantAvailabilitySlots",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ConsultantAvailabilitySlots",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "ConsultantAvailabilitySlots",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "ConsultantAvailabilitySlots",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "ConsultantSkill");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ConsultantSkill");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "ConsultantSkill");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "ConsultantSkill");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "ConsultantAvailabilitySlots");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "ConsultantAvailabilitySlots");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ConsultantAvailabilitySlots");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "ConsultantAvailabilitySlots");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "ConsultantAvailabilitySlots");
        }
    }
}
