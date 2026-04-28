using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodexIQ.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRubricScoresJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RubricScoresJson",
                table: "FinalEvaluations",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RubricScoresJson",
                table: "FinalEvaluations");
        }
    }
}
