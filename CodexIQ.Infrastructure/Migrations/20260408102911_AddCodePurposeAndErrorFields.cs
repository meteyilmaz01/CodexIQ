using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodexIQ.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCodePurposeAndErrorFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogicErrorsJson",
                table: "FinalEvaluations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SyntaxErrorsJson",
                table: "FinalEvaluations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TeacherNote",
                table: "FinalEvaluations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodePurpose",
                table: "Exams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProgrammingLanguage",
                table: "Exams",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogicErrorsJson",
                table: "FinalEvaluations");

            migrationBuilder.DropColumn(
                name: "SyntaxErrorsJson",
                table: "FinalEvaluations");

            migrationBuilder.DropColumn(
                name: "TeacherNote",
                table: "FinalEvaluations");

            migrationBuilder.DropColumn(
                name: "CodePurpose",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "ProgrammingLanguage",
                table: "Exams");
        }
    }
}
