using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketNumberTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TicketNumberTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Template = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SupportTypeId = table.Column<Guid>(type: "uuid", nullable: true),
                    SupportCategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    SupportSubOptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    CurrentSequence = table.Column<int>(type: "integer", nullable: false),
                    DateFormat = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "yyyy-MM-dd"),
                    SequenceFormat = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "0000"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketNumberTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketNumberTemplates_SupportCategories_SupportCategoryId",
                        column: x => x.SupportCategoryId,
                        principalTable: "SupportCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TicketNumberTemplates_SupportSubOptions_SupportSubOptionId",
                        column: x => x.SupportSubOptionId,
                        principalTable: "SupportSubOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TicketNumberTemplates_SupportTypes_SupportTypeId",
                        column: x => x.SupportTypeId,
                        principalTable: "SupportTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TicketNumberTemplates_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketNumberTemplates_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TicketNumberTemplates_CreatedByUserId",
                table: "TicketNumberTemplates",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketNumberTemplates_IsDefault",
                table: "TicketNumberTemplates",
                column: "IsDefault");

            migrationBuilder.CreateIndex(
                name: "IX_TicketNumberTemplates_SupportCategoryId",
                table: "TicketNumberTemplates",
                column: "SupportCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketNumberTemplates_SupportSubOptionId",
                table: "TicketNumberTemplates",
                column: "SupportSubOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketNumberTemplates_SupportTypeId_SupportCategoryId_Suppo~",
                table: "TicketNumberTemplates",
                columns: new[] { "SupportTypeId", "SupportCategoryId", "SupportSubOptionId", "Priority", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_TicketNumberTemplates_UpdatedByUserId",
                table: "TicketNumberTemplates",
                column: "UpdatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TicketNumberTemplates");
        }
    }
}
