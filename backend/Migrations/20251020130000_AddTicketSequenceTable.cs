using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketSequenceTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TicketSequences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    NextSequence = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now() at time zone 'utc'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketSequences", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TicketSequences_Year",
                table: "TicketSequences",
                column: "Year",
                unique: true);

            // Initialize with current year
            var currentYear = DateTime.UtcNow.Year;
            migrationBuilder.InsertData(
                table: "TicketSequences",
                columns: new[] { "Year", "NextSequence", "LastUpdated" },
                values: new object[] { currentYear, 1, DateTime.UtcNow });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TicketSequences");
        }
    }
}