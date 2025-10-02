using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixConsultantSkillTableName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ConsultantSkill_SupportCategories_SupportCategoryId",
                table: "ConsultantSkill");

            migrationBuilder.DropForeignKey(
                name: "FK_ConsultantSkill_SupportSubOptions_SupportSubOptionId",
                table: "ConsultantSkill");

            migrationBuilder.DropForeignKey(
                name: "FK_ConsultantSkill_SupportTypes_SupportTypeId",
                table: "ConsultantSkill");

            migrationBuilder.DropIndex(
                name: "IX_ConsultantSkill_ConsultantId",
                table: "ConsultantSkill");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "ConsultantSkill",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "GETUTCDATE()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantSkill_ConsultantId_SupportTypeId_SupportCategoryI~",
                table: "ConsultantSkill",
                columns: new[] { "ConsultantId", "SupportTypeId", "SupportCategoryId", "SupportSubOptionId" },
                unique: true,
                filter: "[SupportCategoryId] IS NOT NULL OR [SupportSubOptionId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_ConsultantSkill_SupportCategories_SupportCategoryId",
                table: "ConsultantSkill",
                column: "SupportCategoryId",
                principalTable: "SupportCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ConsultantSkill_SupportSubOptions_SupportSubOptionId",
                table: "ConsultantSkill",
                column: "SupportSubOptionId",
                principalTable: "SupportSubOptions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ConsultantSkill_SupportTypes_SupportTypeId",
                table: "ConsultantSkill",
                column: "SupportTypeId",
                principalTable: "SupportTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ConsultantSkill_SupportCategories_SupportCategoryId",
                table: "ConsultantSkill");

            migrationBuilder.DropForeignKey(
                name: "FK_ConsultantSkill_SupportSubOptions_SupportSubOptionId",
                table: "ConsultantSkill");

            migrationBuilder.DropForeignKey(
                name: "FK_ConsultantSkill_SupportTypes_SupportTypeId",
                table: "ConsultantSkill");

            migrationBuilder.DropIndex(
                name: "IX_ConsultantSkill_ConsultantId_SupportTypeId_SupportCategoryI~",
                table: "ConsultantSkill");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "ConsultantSkill",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "GETUTCDATE()");

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantSkill_ConsultantId",
                table: "ConsultantSkill",
                column: "ConsultantId");

            migrationBuilder.AddForeignKey(
                name: "FK_ConsultantSkill_SupportCategories_SupportCategoryId",
                table: "ConsultantSkill",
                column: "SupportCategoryId",
                principalTable: "SupportCategories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ConsultantSkill_SupportSubOptions_SupportSubOptionId",
                table: "ConsultantSkill",
                column: "SupportSubOptionId",
                principalTable: "SupportSubOptions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ConsultantSkill_SupportTypes_SupportTypeId",
                table: "ConsultantSkill",
                column: "SupportTypeId",
                principalTable: "SupportTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
