using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodexIQ.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJoinCodeToClass : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "JoinCode",
                table: "Classrooms",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JoinCode",
                table: "Classrooms");
        }
    }
}
