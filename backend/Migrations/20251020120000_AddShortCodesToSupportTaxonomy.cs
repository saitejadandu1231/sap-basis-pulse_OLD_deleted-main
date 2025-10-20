using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SapBasisPulse.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShortCodesToSupportTaxonomy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add ShortCode column to SupportTypes table
            migrationBuilder.AddColumn<string>(
                name: "ShortCode",
                table: "SupportTypes",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            // Add ShortCode column to SupportCategories table
            migrationBuilder.AddColumn<string>(
                name: "ShortCode",
                table: "SupportCategories",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            // Add ShortCode column to SupportSubOptions table
            migrationBuilder.AddColumn<string>(
                name: "ShortCode",
                table: "SupportSubOptions",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            // Update existing records with default short codes (you can change these later)
            migrationBuilder.Sql(@"
                UPDATE ""SupportTypes"" SET ""ShortCode"" = 
                    CASE 
                        WHEN ""Name"" LIKE '%SAP%' THEN 'SR'
                        WHEN ""Name"" LIKE '%Database%' THEN 'DB'
                        WHEN ""Name"" LIKE '%Network%' THEN 'NW'
                        WHEN ""Name"" LIKE '%Server%' THEN 'SV'
                        ELSE UPPER(LEFT(""Name"", 2))
                    END;
            ");

            migrationBuilder.Sql(@"
                UPDATE ""SupportCategories"" SET ""ShortCode"" = 
                    CASE 
                        WHEN ""Name"" LIKE '%Database%' THEN 'D'
                        WHEN ""Name"" LIKE '%Application%' THEN 'A'
                        WHEN ""Name"" LIKE '%Performance%' THEN 'P'
                        WHEN ""Name"" LIKE '%Security%' THEN 'S'
                        ELSE UPPER(LEFT(""Name"", 1))
                    END;
            ");

            migrationBuilder.Sql(@"
                UPDATE ""SupportSubOptions"" SET ""ShortCode"" = 
                    CASE 
                        WHEN ""Name"" LIKE '%Incident%' THEN 'I'
                        WHEN ""Name"" LIKE '%Request%' THEN 'R'
                        WHEN ""Name"" LIKE '%Change%' THEN 'C'
                        WHEN ""Name"" LIKE '%Problem%' THEN 'P'
                        ELSE UPPER(LEFT(""Name"", 1))
                    END;
            ");

            // Create unique constraints for short codes within their scope
            migrationBuilder.CreateIndex(
                name: "IX_SupportTypes_ShortCode",
                table: "SupportTypes",
                column: "ShortCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupportCategories_ShortCode_SupportTypeId",
                table: "SupportCategories",
                columns: new[] { "ShortCode", "SupportTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupportSubOptions_ShortCode_SupportCategoryId",
                table: "SupportSubOptions",
                columns: new[] { "ShortCode", "SupportCategoryId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop indexes
            migrationBuilder.DropIndex(
                name: "IX_SupportTypes_ShortCode",
                table: "SupportTypes");

            migrationBuilder.DropIndex(
                name: "IX_SupportCategories_ShortCode_SupportTypeId",
                table: "SupportCategories");

            migrationBuilder.DropIndex(
                name: "IX_SupportSubOptions_ShortCode_SupportCategoryId",
                table: "SupportSubOptions");

            // Remove ShortCode columns
            migrationBuilder.DropColumn(
                name: "ShortCode",
                table: "SupportTypes");

            migrationBuilder.DropColumn(
                name: "ShortCode",
                table: "SupportCategories");

            migrationBuilder.DropColumn(
                name: "ShortCode",
                table: "SupportSubOptions");
        }
    }
}