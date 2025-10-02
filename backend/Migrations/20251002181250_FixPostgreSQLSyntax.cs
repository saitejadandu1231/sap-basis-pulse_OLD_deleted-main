using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixPostgreSQLSyntax : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ConsultantAvailabilitySlots_ConsultantId",
                table: "ConsultantAvailabilitySlots");

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "ConsultantSkill",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "ConsultantSkill",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "ConsultantSkill",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "GETUTCDATE()");

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "ConsultantAvailabilitySlots",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "ConsultantAvailabilitySlots",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "ConsultantAvailabilitySlots",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "ConsultantAvailabilitySlots",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantAvailabilitySlots_ConsultantId_SlotStartTime",
                table: "ConsultantAvailabilitySlots",
                columns: new[] { "ConsultantId", "SlotStartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantAvailabilitySlots_UserId",
                table: "ConsultantAvailabilitySlots",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ConsultantAvailabilitySlots_Users_UserId",
                table: "ConsultantAvailabilitySlots",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ConsultantAvailabilitySlots_Users_UserId",
                table: "ConsultantAvailabilitySlots");

            migrationBuilder.DropIndex(
                name: "IX_ConsultantAvailabilitySlots_ConsultantId_SlotStartTime",
                table: "ConsultantAvailabilitySlots");

            migrationBuilder.DropIndex(
                name: "IX_ConsultantAvailabilitySlots_UserId",
                table: "ConsultantAvailabilitySlots");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "ConsultantAvailabilitySlots");

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "ConsultantSkill",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "ConsultantSkill",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "ConsultantSkill",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "GETUTCDATE()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "ConsultantAvailabilitySlots",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "ConsultantAvailabilitySlots",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "ConsultantAvailabilitySlots",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantAvailabilitySlots_ConsultantId",
                table: "ConsultantAvailabilitySlots",
                column: "ConsultantId");
        }
    }
}
