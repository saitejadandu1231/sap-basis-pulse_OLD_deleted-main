using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddConsultantSkills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConsultantSkill",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsultantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupportTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupportCategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    SupportSubOptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsultantSkill", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConsultantSkill_SupportCategories_SupportCategoryId",
                        column: x => x.SupportCategoryId,
                        principalTable: "SupportCategories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ConsultantSkill_SupportSubOptions_SupportSubOptionId",
                        column: x => x.SupportSubOptionId,
                        principalTable: "SupportSubOptions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ConsultantSkill_SupportTypes_SupportTypeId",
                        column: x => x.SupportTypeId,
                        principalTable: "SupportTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConsultantSkill_Users_ConsultantId",
                        column: x => x.ConsultantId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantSkill_ConsultantId",
                table: "ConsultantSkill",
                column: "ConsultantId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantSkill_SupportCategoryId",
                table: "ConsultantSkill",
                column: "SupportCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantSkill_SupportSubOptionId",
                table: "ConsultantSkill",
                column: "SupportSubOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantSkill_SupportTypeId",
                table: "ConsultantSkill",
                column: "SupportTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConsultantSkill");
        }
    }
}
