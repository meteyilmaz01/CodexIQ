using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodexIQ.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentInsight : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StudentInsights",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    InsightText = table.Column<string>(type: "text", nullable: false),
                    IsInsightDirty = table.Column<bool>(type: "boolean", nullable: false),
                    ExamCountAtLastInsight = table.Column<int>(type: "integer", nullable: false),
                    InsightGeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentInsights", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentInsights_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentInsights_StudentId",
                table: "StudentInsights",
                column: "StudentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentInsights");
        }
    }
}
