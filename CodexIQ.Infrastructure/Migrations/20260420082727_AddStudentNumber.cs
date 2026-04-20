using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodexIQ.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExamPapers_Users_StudentId",
                table: "ExamPapers");

            migrationBuilder.AddColumn<string>(
                name: "StudentNumber",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ExamPapers_Users_StudentId",
                table: "ExamPapers",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExamPapers_Users_StudentId",
                table: "ExamPapers");

            migrationBuilder.DropColumn(
                name: "StudentNumber",
                table: "Users");

            migrationBuilder.AddForeignKey(
                name: "FK_ExamPapers_Users_StudentId",
                table: "ExamPapers",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
