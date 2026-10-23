using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ticketing_System_Backend.Migrations
{
    /// <inheritdoc />
    public partial class tapInTapOut : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_journeys_user_id\"; DROP INDEX IF EXISTS ix_journeys_user_id;");

            migrationBuilder.AddColumn<Guid>(
                name: "alighting_stop_id",
                table: "journeys",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "boarding_stop_id",
                table: "journeys",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "bus_id",
                table: "journeys",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "fare_policy",
                table: "journeys",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "route_id",
                table: "journeys",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "stops_travelled",
                table: "journeys",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "stops",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    zone = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stops", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "transit_routes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    route_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transit_routes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "buses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    registration_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    route_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_buses", x => x.id);
                    table.ForeignKey(
                        name: "FK_buses_transit_routes_route_id",
                        column: x => x.route_id,
                        principalTable: "transit_routes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "route_stops",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    route_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stop_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sequence = table.Column<int>(type: "integer", nullable: false),
                    distance_from_start_km = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_route_stops", x => x.id);
                    table.ForeignKey(
                        name: "FK_route_stops_stops_stop_id",
                        column: x => x.stop_id,
                        principalTable: "stops",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_route_stops_transit_routes_route_id",
                        column: x => x.route_id,
                        principalTable: "transit_routes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_journeys_alighting_stop_id",
                table: "journeys",
                column: "alighting_stop_id");

            migrationBuilder.CreateIndex(
                name: "IX_journeys_boarding_stop_id",
                table: "journeys",
                column: "boarding_stop_id");

            migrationBuilder.CreateIndex(
                name: "IX_journeys_bus_id",
                table: "journeys",
                column: "bus_id");

            migrationBuilder.CreateIndex(
                name: "IX_journeys_device_uuid_status",
                table: "journeys",
                columns: new[] { "device_uuid", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_journeys_route_id",
                table: "journeys",
                column: "route_id");

            migrationBuilder.CreateIndex(
                name: "IX_journeys_user_id_status",
                table: "journeys",
                columns: new[] { "user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_buses_registration_number",
                table: "buses",
                column: "registration_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_buses_route_id",
                table: "buses",
                column: "route_id");

            migrationBuilder.CreateIndex(
                name: "IX_route_stops_route_id_sequence",
                table: "route_stops",
                columns: new[] { "route_id", "sequence" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_route_stops_route_id_stop_id",
                table: "route_stops",
                columns: new[] { "route_id", "stop_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_route_stops_stop_id",
                table: "route_stops",
                column: "stop_id");

            migrationBuilder.CreateIndex(
                name: "IX_stops_code",
                table: "stops",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_transit_routes_route_number",
                table: "transit_routes",
                column: "route_number",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_journeys_buses_bus_id",
                table: "journeys",
                column: "bus_id",
                principalTable: "buses",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_journeys_stops_alighting_stop_id",
                table: "journeys",
                column: "alighting_stop_id",
                principalTable: "stops",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_journeys_stops_boarding_stop_id",
                table: "journeys",
                column: "boarding_stop_id",
                principalTable: "stops",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_journeys_transit_routes_route_id",
                table: "journeys",
                column: "route_id",
                principalTable: "transit_routes",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_journeys_buses_bus_id",
                table: "journeys");

            migrationBuilder.DropForeignKey(
                name: "FK_journeys_stops_alighting_stop_id",
                table: "journeys");

            migrationBuilder.DropForeignKey(
                name: "FK_journeys_stops_boarding_stop_id",
                table: "journeys");

            migrationBuilder.DropForeignKey(
                name: "FK_journeys_transit_routes_route_id",
                table: "journeys");

            migrationBuilder.DropTable(
                name: "buses");

            migrationBuilder.DropTable(
                name: "route_stops");

            migrationBuilder.DropTable(
                name: "stops");

            migrationBuilder.DropTable(
                name: "transit_routes");

            migrationBuilder.DropIndex(
                name: "IX_journeys_alighting_stop_id",
                table: "journeys");

            migrationBuilder.DropIndex(
                name: "IX_journeys_boarding_stop_id",
                table: "journeys");

            migrationBuilder.DropIndex(
                name: "IX_journeys_bus_id",
                table: "journeys");

            migrationBuilder.DropIndex(
                name: "IX_journeys_device_uuid_status",
                table: "journeys");

            migrationBuilder.DropIndex(
                name: "IX_journeys_route_id",
                table: "journeys");

            migrationBuilder.DropIndex(
                name: "IX_journeys_user_id_status",
                table: "journeys");

            migrationBuilder.DropColumn(
                name: "alighting_stop_id",
                table: "journeys");

            migrationBuilder.DropColumn(
                name: "boarding_stop_id",
                table: "journeys");

            migrationBuilder.DropColumn(
                name: "bus_id",
                table: "journeys");

            migrationBuilder.DropColumn(
                name: "fare_policy",
                table: "journeys");

            migrationBuilder.DropColumn(
                name: "route_id",
                table: "journeys");

            migrationBuilder.DropColumn(
                name: "stops_travelled",
                table: "journeys");

            migrationBuilder.CreateIndex(
                name: "IX_journeys_user_id",
                table: "journeys",
                column: "user_id");
        }
    }
}
