using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ticketing_System_Backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "otp_verifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    phone_number = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    otp_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    purpose = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "register"),
                    full_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_used = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expires_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_otp_verifications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    full_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    phone_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    role = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_login_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    user_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    credit_balance = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false, defaultValue: 0.00m),
                    persistent_qr_token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    token_medium = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true, defaultValue: "Digital QR"),
                    is_phone_verified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "transport_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    device_uuid = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    token_type = table.Column<int>(type: "integer", nullable: false),
                    pass_tier = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    medium = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true, defaultValue: "Digital QR"),
                    signed_token = table.Column<string>(type: "text", nullable: false),
                    nonce = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expires_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_transport_tokens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "journeys",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    device_uuid = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    token_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tap_in_station = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tap_in_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tap_out_station = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    tap_out_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    fare_amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false, defaultValue: 0.00m),
                    status = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_journeys", x => x.id);
                    table.ForeignKey(
                        name: "FK_journeys_transport_tokens_token_id",
                        column: x => x.token_id,
                        principalTable: "transport_tokens",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_journeys_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ticket_inspections",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_identifier = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    token_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    device_uuid = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    journey_id = table.Column<Guid>(type: "uuid", nullable: true),
                    result = table.Column<int>(type: "integer", nullable: false),
                    location = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    inspector_id = table.Column<Guid>(type: "uuid", nullable: true),
                    inspected_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ticket_inspections", x => x.id);
                    table.ForeignKey(
                        name: "FK_ticket_inspections_journeys_journey_id",
                        column: x => x.journey_id,
                        principalTable: "journeys",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_journeys_token_id",
                table: "journeys",
                column: "token_id");

            migrationBuilder.CreateIndex(
                name: "IX_journeys_user_id",
                table: "journeys",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_ticket_inspections_inspected_at_utc",
                table: "ticket_inspections",
                column: "inspected_at_utc");

            migrationBuilder.CreateIndex(
                name: "IX_ticket_inspections_journey_id",
                table: "ticket_inspections",
                column: "journey_id");

            migrationBuilder.CreateIndex(
                name: "IX_ticket_inspections_token_identifier_inspected_at_utc",
                table: "ticket_inspections",
                columns: new[] { "token_identifier", "inspected_at_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_transport_tokens_user_id",
                table: "transport_tokens",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "otp_verifications");

            migrationBuilder.DropTable(
                name: "ticket_inspections");

            migrationBuilder.DropTable(
                name: "journeys");

            migrationBuilder.DropTable(
                name: "transport_tokens");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
