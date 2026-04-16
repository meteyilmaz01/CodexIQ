using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodexIQ.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NullableStudentId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // FK'yı düşür
            migrationBuilder.DropForeignKey(
                name: "FK_ExamPapers_Users_StudentId",
                table: "ExamPapers");

            // Sütunu nullable yap
            migrationBuilder.AlterColumn<Guid>(
                name: "StudentId",
                table: "ExamPapers",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            // FK'yı nullable ile yeniden ekle
            migrationBuilder.AddForeignKey(
                name: "FK_ExamPapers_Users_StudentId",
                table: "ExamPapers",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExamPapers_Users_StudentId",
                table: "ExamPapers");

            migrationBuilder.AlterColumn<Guid>(
                name: "StudentId",
                table: "ExamPapers",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldNullable: true,
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_ExamPapers_Users_StudentId",
                table: "ExamPapers",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
