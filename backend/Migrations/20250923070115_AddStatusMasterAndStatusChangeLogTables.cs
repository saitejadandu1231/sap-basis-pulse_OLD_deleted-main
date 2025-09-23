using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusMasterAndStatusChangeLogTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Orders",
                newName: "StatusString");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdated",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StatusId",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValue: 1);  // Default to "New" status

            migrationBuilder.CreateTable(
                name: "StatusMaster",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StatusCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StatusName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ColorCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IconCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatusMaster", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StatusChangeLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromStatusId = table.Column<int>(type: "integer", nullable: false),
                    ToStatusId = table.Column<int>(type: "integer", nullable: false),
                    ChangedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatusChangeLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StatusChangeLogs_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StatusChangeLogs_StatusMaster_FromStatusId",
                        column: x => x.FromStatusId,
                        principalTable: "StatusMaster",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StatusChangeLogs_StatusMaster_ToStatusId",
                        column: x => x.ToStatusId,
                        principalTable: "StatusMaster",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StatusChangeLogs_Users_ChangedByUserId",
                        column: x => x.ChangedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_StatusId",
                table: "Orders",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_StatusChangeLogs_ChangedByUserId",
                table: "StatusChangeLogs",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StatusChangeLogs_FromStatusId",
                table: "StatusChangeLogs",
                column: "FromStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_StatusChangeLogs_OrderId",
                table: "StatusChangeLogs",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_StatusChangeLogs_ToStatusId",
                table: "StatusChangeLogs",
                column: "ToStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_StatusMaster_StatusCode",
                table: "StatusMaster",
                column: "StatusCode",
                unique: true);

            // Seed StatusMaster data first
            migrationBuilder.InsertData(
                table: "StatusMaster",
                columns: new[] { "Id", "StatusCode", "StatusName", "Description", "ColorCode", "IconCode", "SortOrder", "IsActive", "CreatedAt" },
                values: new object[,]
                {
                    { 1, "New", "New", "Newly created support request", "bg-blue-500", "Clock", 1, true, DateTime.UtcNow },
                    { 2, "InProgress", "In Progress", "Support request is being worked on", "bg-yellow-500", "TrendingUp", 2, true, DateTime.UtcNow },
                    { 3, "PendingCustomerAction", "Pending Customer", "Waiting for customer response or action", "bg-orange-500", "AlertCircle", 3, true, DateTime.UtcNow },
                    { 4, "TopicClosed", "Topic Closed", "Support topic has been closed", "bg-gray-500", "CheckCircle", 4, true, DateTime.UtcNow },
                    { 5, "Closed", "Closed", "Support request has been completed and closed", "bg-green-500", "CheckCircle", 5, true, DateTime.UtcNow },
                    { 6, "ReOpened", "Re-opened", "Previously closed request has been re-opened", "bg-purple-500", "AlertCircle", 6, true, DateTime.UtcNow }
                });

            // Update existing Orders to have proper StatusId based on current StatusString values
            migrationBuilder.Sql(@"
                UPDATE ""Orders"" SET ""StatusId"" = 
                    CASE ""StatusString""
                        WHEN 'New' THEN 1
                        WHEN 'Open' THEN 1
                        WHEN 'InProgress' THEN 2
                        WHEN 'PendingCustomerAction' THEN 3
                        WHEN 'TopicClosed' THEN 4
                        WHEN 'Closed' THEN 5
                        WHEN 'ReOpened' THEN 6
                        ELSE 1
                    END;
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_StatusMaster_StatusId",
                table: "Orders",
                column: "StatusId",
                principalTable: "StatusMaster",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_StatusMaster_StatusId",
                table: "Orders");

            migrationBuilder.DropTable(
                name: "StatusChangeLogs");

            migrationBuilder.DropTable(
                name: "StatusMaster");

            migrationBuilder.DropIndex(
                name: "IX_Orders_StatusId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "LastUpdated",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "StatusString",
                table: "Orders",
                newName: "Status");
        }
    }
}
