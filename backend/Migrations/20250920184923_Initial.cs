using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Entity = table.Column<string>(type: "text", nullable: false),
                    EntityId = table.Column<string>(type: "text", nullable: false),
                    Details = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SupportTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    SsoProvider = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SupportCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SupportTypeId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupportCategories_SupportTypes_SupportTypeId",
                        column: x => x.SupportTypeId,
                        principalTable: "SupportTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SupportSubOptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SupportTypeId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportSubOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupportSubOptions_SupportTypes_SupportTypeId",
                        column: x => x.SupportTypeId,
                        principalTable: "SupportTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoginActivities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoginStatus = table.Column<string>(type: "text", nullable: false),
                    LoginTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LogoutTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SsoProviderUsed = table.Column<string>(type: "text", nullable: false),
                    DeviceInfo = table.Column<string>(type: "text", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoginActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoginActivities_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomerChoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsultantId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ScheduledTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SupportTypeId = table.Column<Guid>(type: "uuid", nullable: true),
                    SupportCategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    SupportSubOptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    SlotId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerChoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerChoices_SupportCategories_SupportCategoryId",
                        column: x => x.SupportCategoryId,
                        principalTable: "SupportCategories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CustomerChoices_SupportSubOptions_SupportSubOptionId",
                        column: x => x.SupportSubOptionId,
                        principalTable: "SupportSubOptions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CustomerChoices_SupportTypes_SupportTypeId",
                        column: x => x.SupportTypeId,
                        principalTable: "SupportTypes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CustomerChoices_Users_ConsultantId",
                        column: x => x.ConsultantId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CustomerChoices_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ConsultantAvailabilitySlots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsultantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SlotStartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SlotEndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BookedByCustomerChoiceId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsultantAvailabilitySlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConsultantAvailabilitySlots_CustomerChoices_BookedByCustome~",
                        column: x => x.BookedByCustomerChoiceId,
                        principalTable: "CustomerChoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ConsultantAvailabilitySlots_Users_ConsultantId",
                        column: x => x.ConsultantId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerChoiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsultantId = table.Column<Guid>(type: "uuid", nullable: true),
                    OrderNumber = table.Column<string>(type: "text", nullable: false),
                    SupportTypeName = table.Column<string>(type: "text", nullable: false),
                    SupportTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupportCategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupportSubOptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: false),
                    SrIdentifier = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    TimeSlotId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_ConsultantAvailabilitySlots_TimeSlotId",
                        column: x => x.TimeSlotId,
                        principalTable: "ConsultantAvailabilitySlots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Orders_CustomerChoices_CustomerChoiceId",
                        column: x => x.CustomerChoiceId,
                        principalTable: "CustomerChoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Orders_SupportCategories_SupportCategoryId",
                        column: x => x.SupportCategoryId,
                        principalTable: "SupportCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Orders_SupportSubOptions_SupportSubOptionId",
                        column: x => x.SupportSubOptionId,
                        principalTable: "SupportSubOptions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Orders_SupportTypes_SupportTypeId",
                        column: x => x.SupportTypeId,
                        principalTable: "SupportTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Orders_Users_ConsultantId",
                        column: x => x.ConsultantId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Orders_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketRatings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    RatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RatedUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RatingForRole = table.Column<string>(type: "text", nullable: false),
                    CommunicationProfessionalism = table.Column<int>(type: "integer", nullable: true),
                    ResolutionQuality = table.Column<int>(type: "integer", nullable: true),
                    ResponseTime = table.Column<int>(type: "integer", nullable: true),
                    Comments = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketRatings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketRatings_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketRatings_Users_RatedByUserId",
                        column: x => x.RatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketRatings_Users_RatedUserId",
                        column: x => x.RatedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantAvailabilitySlots_BookedByCustomerChoiceId",
                table: "ConsultantAvailabilitySlots",
                column: "BookedByCustomerChoiceId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantAvailabilitySlots_ConsultantId",
                table: "ConsultantAvailabilitySlots",
                column: "ConsultantId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerChoices_ConsultantId",
                table: "CustomerChoices",
                column: "ConsultantId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerChoices_SupportCategoryId",
                table: "CustomerChoices",
                column: "SupportCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerChoices_SupportSubOptionId",
                table: "CustomerChoices",
                column: "SupportSubOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerChoices_SupportTypeId",
                table: "CustomerChoices",
                column: "SupportTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerChoices_UserId",
                table: "CustomerChoices",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_LoginActivities_UserId",
                table: "LoginActivities",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ConsultantId",
                table: "Orders",
                column: "ConsultantId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CreatedByUserId",
                table: "Orders",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CustomerChoiceId",
                table: "Orders",
                column: "CustomerChoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_SupportCategoryId",
                table: "Orders",
                column: "SupportCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_SupportSubOptionId",
                table: "Orders",
                column: "SupportSubOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_SupportTypeId",
                table: "Orders",
                column: "SupportTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TimeSlotId",
                table: "Orders",
                column: "TimeSlotId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportCategories_SupportTypeId",
                table: "SupportCategories",
                column: "SupportTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportSubOptions_SupportTypeId",
                table: "SupportSubOptions",
                column: "SupportTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketRatings_OrderId",
                table: "TicketRatings",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketRatings_RatedByUserId",
                table: "TicketRatings",
                column: "RatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketRatings_RatedUserId",
                table: "TicketRatings",
                column: "RatedUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "LoginActivities");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "TicketRatings");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropTable(
                name: "ConsultantAvailabilitySlots");

            migrationBuilder.DropTable(
                name: "CustomerChoices");

            migrationBuilder.DropTable(
                name: "SupportCategories");

            migrationBuilder.DropTable(
                name: "SupportSubOptions");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "SupportTypes");
        }
    }
}
