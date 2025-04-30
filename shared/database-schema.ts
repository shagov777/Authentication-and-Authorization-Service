import { DbSchema, DbModule, DbTable, DbColumn, DbRelationship } from "@/lib/utils";

// This file contains the full database schema definition
// It's used to provide data to the UI components

export const databaseSchema: DbSchema = {
  modules: [
    {
      name: "Authentication & Authorization",
      description: "Core account records and authentication management",
      tables: [
        {
          name: "auth_users",
          description: "Core account record (login details, email, password hash, role)",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for the user",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "email",
              type: "VARCHAR(255)",
              description: "User email address, used for login",
              isNotNull: true,
              isUnique: true
            },
            {
              name: "password_hash",
              type: "VARCHAR(255)",
              description: "Bcrypt hashed password",
              isNotNull: true
            },
            {
              name: "username",
              type: "VARCHAR(50)",
              description: "Optional username for login",
              isUnique: true
            },
            {
              name: "role",
              type: "VARCHAR(20)",
              description: "User role (player, admin, etc.)",
              isNotNull: true,
              defaultValue: "'player'"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Account creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "deleted_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Soft delete timestamp"
            }
          ],
          indexes: [
            {
              name: "idx_auth_users_email",
              columns: ["email"]
            },
            {
              name: "idx_auth_users_username",
              columns: ["username"]
            }
          ]
        },
        {
          name: "auth_sessions",
          description: "Active sessions with device info, IP, JWT token hashes",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for the session",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "token_hash",
              type: "VARCHAR(255)",
              description: "Hashed JWT token",
              isNotNull: true
            },
            {
              name: "device_info",
              type: "JSONB",
              description: "Device information in JSON format"
            },
            {
              name: "ip_address",
              type: "VARCHAR(45)",
              description: "IP address of the session",
              isNotNull: true
            },
            {
              name: "expires_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Session expiration time",
              isNotNull: true
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Session creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_auth_sessions_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_auth_sessions_expires_at",
              columns: ["expires_at"]
            }
          ]
        },
        {
          name: "auth_2fa",
          description: "2FA keys and status (TOTP secrets, status)",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for 2FA record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              isUnique: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "totp_secret",
              type: "VARCHAR(255)",
              description: "TOTP secret key (encrypted)",
              isNotNull: true
            },
            {
              name: "is_enabled",
              type: "BOOLEAN",
              description: "2FA status flag",
              isNotNull: true,
              defaultValue: "false"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "2FA setup timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_auth_2fa_user_id",
              columns: ["user_id"],
              unique: true
            }
          ]
        },
        {
          name: "auth_password_resets",
          description: "Password reset tokens and timestamps",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for reset record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "token",
              type: "VARCHAR(255)",
              description: "Reset token (hashed)",
              isNotNull: true
            },
            {
              name: "expires_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Token expiration time",
              isNotNull: true
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Reset request timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_auth_password_resets_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_auth_password_resets_token",
              columns: ["token"]
            }
          ]
        }
      ]
    },
    {
      name: "Profile Management",
      description: "User profile information and preferences",
      tables: [
        {
          name: "profile_players",
          description: "Personal info (name, DOB, avatar, settings, language, timezone)",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for profile record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              isUnique: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "first_name",
              type: "VARCHAR(100)",
              description: "User's first name"
            },
            {
              name: "last_name",
              type: "VARCHAR(100)",
              description: "User's last name"
            },
            {
              name: "date_of_birth",
              type: "DATE",
              description: "User's date of birth"
            },
            {
              name: "avatar_url",
              type: "VARCHAR(255)",
              description: "URL to user's avatar image"
            },
            {
              name: "settings",
              type: "JSONB",
              description: "User settings in JSON format"
            },
            {
              name: "language",
              type: "VARCHAR(10)",
              description: "Preferred language code",
              defaultValue: "'en'"
            },
            {
              name: "timezone",
              type: "VARCHAR(50)",
              description: "User's timezone",
              defaultValue: "'UTC'"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Profile creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_profile_players_user_id",
              columns: ["user_id"],
              unique: true
            }
          ]
        },
        {
          name: "profile_preferences",
          description: "Player preferences (notifications, marketing opt-ins)",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for preferences record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              isUnique: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "notifications_enabled",
              type: "BOOLEAN",
              description: "Whether notifications are enabled",
              isNotNull: true,
              defaultValue: "true"
            },
            {
              name: "email_marketing",
              type: "BOOLEAN",
              description: "Email marketing opt-in",
              isNotNull: true,
              defaultValue: "false"
            },
            {
              name: "sms_marketing",
              type: "BOOLEAN",
              description: "SMS marketing opt-in",
              isNotNull: true,
              defaultValue: "false"
            },
            {
              name: "push_notifications",
              type: "BOOLEAN",
              description: "Push notifications opt-in",
              isNotNull: true,
              defaultValue: "true"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Preferences creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_profile_preferences_user_id",
              columns: ["user_id"],
              unique: true
            }
          ]
        }
      ]
    },
    {
      name: "Wallet & Transactions",
      description: "Financial accounts and transaction records",
      tables: [
        {
          name: "wallet_accounts",
          description: "Wallets tied to players",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for wallet",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "currency",
              type: "VARCHAR(3)",
              description: "Currency code (USD, EUR, etc.)",
              isNotNull: true
            },
            {
              name: "balance",
              type: "DECIMAL(20,8)",
              description: "Current wallet balance",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Wallet status (active, frozen, etc.)",
              isNotNull: true,
              defaultValue: "'active'"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Wallet creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "deleted_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Soft delete timestamp"
            }
          ],
          indexes: [
            {
              name: "idx_wallet_accounts_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_wallet_accounts_currency",
              columns: ["currency"]
            },
            {
              name: "idx_wallet_accounts_user_currency",
              columns: ["user_id", "currency"],
              unique: true
            }
          ]
        },
        {
          name: "wallet_transactions",
          description: "All balance changes (deposit, withdrawal, gameplay)",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for transaction",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "wallet_id",
              type: "UUID",
              description: "Reference to wallet",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "wallet_accounts",
                column: "id"
              }
            },
            {
              name: "transaction_type",
              type: "VARCHAR(20)",
              description: "Type of transaction (deposit, withdrawal, bet, win, etc.)",
              isNotNull: true
            },
            {
              name: "amount",
              type: "DECIMAL(20,8)",
              description: "Transaction amount",
              isNotNull: true
            },
            {
              name: "reference_id",
              type: "VARCHAR(255)",
              description: "External reference ID",
              isUnique: true
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Transaction status (pending, completed, failed, etc.)",
              isNotNull: true,
              defaultValue: "'pending'"
            },
            {
              name: "metadata",
              type: "JSONB",
              description: "Additional transaction metadata"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Transaction creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_wallet_transactions_wallet_id",
              columns: ["wallet_id"]
            },
            {
              name: "idx_wallet_transactions_type",
              columns: ["transaction_type"]
            },
            {
              name: "idx_wallet_transactions_status",
              columns: ["status"]
            },
            {
              name: "idx_wallet_transactions_created_at",
              columns: ["created_at"]
            },
            {
              name: "idx_wallet_transactions_reference_id",
              columns: ["reference_id"],
              unique: true
            }
          ]
        },
        {
          name: "wallet_payment_methods",
          description: "Linked cards, bank accounts, crypto wallets",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for payment method",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "type",
              type: "VARCHAR(20)",
              description: "Payment method type (card, bank, crypto, etc.)",
              isNotNull: true
            },
            {
              name: "provider",
              type: "VARCHAR(50)",
              description: "Payment provider name"
            },
            {
              name: "details",
              type: "JSONB",
              description: "Encrypted payment details (last 4 digits, expiry, etc.)",
              isNotNull: true
            },
            {
              name: "is_default",
              type: "BOOLEAN",
              description: "Whether this is the default payment method",
              isNotNull: true,
              defaultValue: "false"
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Payment method status (active, expired, etc.)",
              isNotNull: true,
              defaultValue: "'active'"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "deleted_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Soft delete timestamp"
            }
          ],
          indexes: [
            {
              name: "idx_wallet_payment_methods_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_wallet_payment_methods_type",
              columns: ["type"]
            },
            {
              name: "idx_wallet_payment_methods_status",
              columns: ["status"]
            }
          ]
        }
      ]
    },
    {
      name: "Player Data",
      description: "Game statistics, achievements, and user activity",
      tables: [
        {
          name: "user_game_stats",
          description: "Game results, scores, last played games",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for game stat record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "game_id",
              type: "VARCHAR(100)",
              description: "Game identifier",
              isNotNull: true
            },
            {
              name: "sessions_played",
              type: "INTEGER",
              description: "Number of game sessions played",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "total_time_played",
              type: "INTEGER",
              description: "Total time played in seconds",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "highest_score",
              type: "INTEGER",
              description: "Highest score achieved",
              defaultValue: "0"
            },
            {
              name: "total_bets",
              type: "DECIMAL(20,8)",
              description: "Total amount bet",
              defaultValue: "0"
            },
            {
              name: "total_wins",
              type: "DECIMAL(20,8)",
              description: "Total amount won",
              defaultValue: "0"
            },
            {
              name: "last_played_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last played timestamp"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Record creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_user_game_stats_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_user_game_stats_game_id",
              columns: ["game_id"]
            },
            {
              name: "idx_user_game_stats_user_game",
              columns: ["user_id", "game_id"],
              unique: true
            },
            {
              name: "idx_user_game_stats_last_played",
              columns: ["last_played_at"]
            }
          ]
        },
        {
          name: "user_achievements",
          description: "Unlocked badges, milestones",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for achievement record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "achievement_id",
              type: "VARCHAR(100)",
              description: "Achievement identifier",
              isNotNull: true
            },
            {
              name: "unlocked_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "When the achievement was unlocked",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "progress",
              type: "INTEGER",
              description: "Progress percentage for partial achievements",
              isNotNull: true,
              defaultValue: "100"
            },
            {
              name: "metadata",
              type: "JSONB",
              description: "Additional achievement metadata"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Record creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_user_achievements_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_user_achievements_achievement_id",
              columns: ["achievement_id"]
            },
            {
              name: "idx_user_achievements_user_achievement",
              columns: ["user_id", "achievement_id"],
              unique: true
            }
          ]
        },
        {
          name: "user_leaderboards",
          description: "Current leaderboard standing",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for leaderboard entry",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "leaderboard_id",
              type: "VARCHAR(100)",
              description: "Leaderboard identifier",
              isNotNull: true
            },
            {
              name: "score",
              type: "DECIMAL(20,8)",
              description: "User's score on this leaderboard",
              isNotNull: true
            },
            {
              name: "rank",
              type: "INTEGER",
              description: "User's current rank"
            },
            {
              name: "period",
              type: "VARCHAR(20)",
              description: "Leaderboard period (daily, weekly, monthly, all-time)",
              isNotNull: true
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Record creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_user_leaderboards_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_user_leaderboards_leaderboard_id",
              columns: ["leaderboard_id"]
            },
            {
              name: "idx_user_leaderboards_score",
              columns: ["score"]
            },
            {
              name: "idx_user_leaderboards_composite",
              columns: ["leaderboard_id", "period", "user_id"],
              unique: true
            }
          ]
        },
        {
          name: "user_saved_states",
          description: "Save states for progressive activities or games",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for saved state",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "game_id",
              type: "VARCHAR(100)",
              description: "Game identifier",
              isNotNull: true
            },
            {
              name: "state_data",
              type: "JSONB",
              description: "Saved game state data",
              isNotNull: true
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Record creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_user_saved_states_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_user_saved_states_game_id",
              columns: ["game_id"]
            },
            {
              name: "idx_user_saved_states_user_game",
              columns: ["user_id", "game_id"],
              unique: true
            }
          ]
        }
      ]
    },
    {
      name: "Social Features",
      description: "Friend relationships and social interactions",
      tables: [
        {
          name: "social_friends",
          description: "Friend relationships (pending/accepted)",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for friendship record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "User who initiated the friend request",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "friend_id",
              type: "UUID",
              description: "User who received the friend request",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Friendship status (pending, accepted, blocked)",
              isNotNull: true,
              defaultValue: "'pending'"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Record creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_social_friends_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_social_friends_friend_id",
              columns: ["friend_id"]
            },
            {
              name: "idx_social_friends_status",
              columns: ["status"]
            },
            {
              name: "idx_social_friends_unique",
              columns: ["user_id", "friend_id"],
              unique: true
            }
          ],
          constraints: [
            "CHECK (user_id <> friend_id)"
          ]
        },
        {
          name: "social_messages",
          description: "Private messages between players",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for message",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "sender_id",
              type: "UUID",
              description: "User who sent the message",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "recipient_id",
              type: "UUID",
              description: "User who received the message",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "content",
              type: "TEXT",
              description: "Message content",
              isNotNull: true
            },
            {
              name: "read_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "When the message was read"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Message sent timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_social_messages_sender_id",
              columns: ["sender_id"]
            },
            {
              name: "idx_social_messages_recipient_id",
              columns: ["recipient_id"]
            },
            {
              name: "idx_social_messages_created_at",
              columns: ["created_at"]
            },
            {
              name: "idx_social_messages_conversation",
              columns: ["sender_id", "recipient_id", "created_at"]
            }
          ]
        },
        {
          name: "social_groups",
          description: "Group membership and group chat logs",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for group",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "name",
              type: "VARCHAR(100)",
              description: "Group name",
              isNotNull: true
            },
            {
              name: "description",
              type: "TEXT",
              description: "Group description"
            },
            {
              name: "created_by",
              type: "UUID",
              description: "User who created the group",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "is_private",
              type: "BOOLEAN",
              description: "Whether the group is private",
              isNotNull: true,
              defaultValue: "false"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Group creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_social_groups_created_by",
              columns: ["created_by"]
            },
            {
              name: "idx_social_groups_name",
              columns: ["name"]
            }
          ]
        }
      ]
    },
    {
      name: "Security",
      description: "Security logs, alerts, and monitoring",
      tables: [
        {
          name: "security_logs",
          description: "Login attempts, IP tracking, device fingerprints",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for log entry",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "event_type",
              type: "VARCHAR(50)",
              description: "Type of security event",
              isNotNull: true
            },
            {
              name: "ip_address",
              type: "VARCHAR(45)",
              description: "IP address of the request",
              isNotNull: true
            },
            {
              name: "user_agent",
              type: "TEXT",
              description: "User agent of the request"
            },
            {
              name: "device_fingerprint",
              type: "VARCHAR(255)",
              description: "Device fingerprint hash"
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Event status (success, failure, etc.)",
              isNotNull: true
            },
            {
              name: "details",
              type: "JSONB",
              description: "Additional event details"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Event timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_security_logs_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_security_logs_event_type",
              columns: ["event_type"]
            },
            {
              name: "idx_security_logs_ip_address",
              columns: ["ip_address"]
            },
            {
              name: "idx_security_logs_created_at",
              columns: ["created_at"]
            }
          ]
        },
        {
          name: "security_flags",
          description: "Suspicious activities, fraud flags",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for flag",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "flag_type",
              type: "VARCHAR(50)",
              description: "Type of flag (fraud, suspicious, etc.)",
              isNotNull: true
            },
            {
              name: "severity",
              type: "VARCHAR(20)",
              description: "Flag severity (low, medium, high)",
              isNotNull: true
            },
            {
              name: "details",
              type: "JSONB",
              description: "Flag details"
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Flag status (open, resolved, false_positive)",
              isNotNull: true,
              defaultValue: "'open'"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Flag creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "resolved_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "When the flag was resolved"
            }
          ],
          indexes: [
            {
              name: "idx_security_flags_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_security_flags_flag_type",
              columns: ["flag_type"]
            },
            {
              name: "idx_security_flags_severity",
              columns: ["severity"]
            },
            {
              name: "idx_security_flags_status",
              columns: ["status"]
            }
          ]
        },
        {
          name: "security_bans",
          description: "Account suspensions, bans, reasons, durations",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for ban record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "ban_type",
              type: "VARCHAR(20)",
              description: "Type of ban (temporary, permanent)",
              isNotNull: true
            },
            {
              name: "reason",
              type: "TEXT",
              description: "Reason for the ban",
              isNotNull: true
            },
            {
              name: "starts_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "When the ban starts",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "expires_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "When the ban expires (null for permanent)"
            },
            {
              name: "created_by",
              type: "UUID",
              description: "Admin who created the ban",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Record creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_security_bans_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_security_bans_ban_type",
              columns: ["ban_type"]
            },
            {
              name: "idx_security_bans_starts_at",
              columns: ["starts_at"]
            },
            {
              name: "idx_security_bans_expires_at",
              columns: ["expires_at"]
            }
          ]
        }
      ]
    },
    {
      name: "Customer Support",
      description: "Support ticket management and customer feedback",
      tables: [
        {
          name: "support_tickets",
          description: "Player support requests (with thread history)",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for ticket",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "subject",
              type: "VARCHAR(255)",
              description: "Ticket subject",
              isNotNull: true
            },
            {
              name: "category",
              type: "VARCHAR(50)",
              description: "Ticket category",
              isNotNull: true
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Ticket status (open, in_progress, resolved, etc.)",
              isNotNull: true,
              defaultValue: "'open'"
            },
            {
              name: "priority",
              type: "VARCHAR(20)",
              description: "Ticket priority (low, medium, high)",
              isNotNull: true,
              defaultValue: "'medium'"
            },
            {
              name: "assigned_to",
              type: "UUID",
              description: "Support agent assigned to the ticket",
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Ticket creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "resolved_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "When the ticket was resolved"
            }
          ],
          indexes: [
            {
              name: "idx_support_tickets_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_support_tickets_status",
              columns: ["status"]
            },
            {
              name: "idx_support_tickets_priority",
              columns: ["priority"]
            },
            {
              name: "idx_support_tickets_assigned_to",
              columns: ["assigned_to"]
            },
            {
              name: "idx_support_tickets_created_at",
              columns: ["created_at"]
            }
          ]
        },
        {
          name: "support_feedback",
          description: "General feedback and suggestions",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for feedback",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "type",
              type: "VARCHAR(50)",
              description: "Feedback type (suggestion, bug, complaint, etc.)",
              isNotNull: true
            },
            {
              name: "content",
              type: "TEXT",
              description: "Feedback content",
              isNotNull: true
            },
            {
              name: "rating",
              type: "INTEGER",
              description: "Feedback rating (1-5)"
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Processing status",
              isNotNull: true,
              defaultValue: "'pending'"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Feedback creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_support_feedback_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_support_feedback_type",
              columns: ["type"]
            },
            {
              name: "idx_support_feedback_rating",
              columns: ["rating"]
            },
            {
              name: "idx_support_feedback_created_at",
              columns: ["created_at"]
            }
          ]
        }
      ]
    },
    {
      name: "Reporting & Analytics",
      description: "Usage metrics and business analytics",
      tables: [
        {
          name: "analytics_player_activity",
          description: "Logins, sessions, game launches",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for activity record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "activity_type",
              type: "VARCHAR(50)",
              description: "Type of activity (login, game_launch, etc.)",
              isNotNull: true
            },
            {
              name: "ip_address",
              type: "VARCHAR(45)",
              description: "IP address of the request"
            },
            {
              name: "device_info",
              type: "JSONB",
              description: "Device information"
            },
            {
              name: "session_id",
              type: "UUID",
              description: "Reference to session"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Activity timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_analytics_player_activity_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_analytics_player_activity_type",
              columns: ["activity_type"]
            },
            {
              name: "idx_analytics_player_activity_created_at",
              columns: ["created_at"]
            }
          ]
        },
        {
          name: "analytics_financials",
          description: "Deposit/withdrawal analysis",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for financial record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "date",
              type: "DATE",
              description: "Date of the financial snapshot",
              isNotNull: true
            },
            {
              name: "currency",
              type: "VARCHAR(3)",
              description: "Currency code",
              isNotNull: true
            },
            {
              name: "total_deposits",
              type: "DECIMAL(20,8)",
              description: "Total deposits for the date",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "total_withdrawals",
              type: "DECIMAL(20,8)",
              description: "Total withdrawals for the date",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "total_bets",
              type: "DECIMAL(20,8)",
              description: "Total bets placed for the date",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "total_wins",
              type: "DECIMAL(20,8)",
              description: "Total winnings for the date",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "gross_gaming_revenue",
              type: "DECIMAL(20,8)",
              description: "GGR for the date",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Record creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_analytics_financials_date",
              columns: ["date"]
            },
            {
              name: "idx_analytics_financials_currency",
              columns: ["currency"]
            },
            {
              name: "idx_analytics_financials_date_currency",
              columns: ["date", "currency"],
              unique: true
            }
          ]
        },
        {
          name: "analytics_behavior",
          description: "Time spent, page views, actions taken",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for behavior record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "session_id",
              type: "UUID",
              description: "Reference to user session",
              isNotNull: true
            },
            {
              name: "page_url",
              type: "VARCHAR(255)",
              description: "URL of the page viewed",
              isNotNull: true
            },
            {
              name: "time_spent",
              type: "INTEGER",
              description: "Time spent on page in seconds",
              isNotNull: true
            },
            {
              name: "actions",
              type: "JSONB",
              description: "Actions taken on the page"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Behavior timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_analytics_behavior_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_analytics_behavior_session_id",
              columns: ["session_id"]
            },
            {
              name: "idx_analytics_behavior_page_url",
              columns: ["page_url"]
            },
            {
              name: "idx_analytics_behavior_created_at",
              columns: ["created_at"]
            }
          ]
        }
      ]
    },
    {
      name: "Affiliate Management",
      description: "Partner affiliates and commission tracking",
      tables: [
        {
          name: "affiliate_partners",
          description: "Partner info (names, sites, terms)",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for affiliate partner",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "name",
              type: "VARCHAR(100)",
              description: "Partner name",
              isNotNull: true
            },
            {
              name: "company",
              type: "VARCHAR(100)",
              description: "Partner company name"
            },
            {
              name: "website",
              type: "VARCHAR(255)",
              description: "Partner website"
            },
            {
              name: "email",
              type: "VARCHAR(255)",
              description: "Partner contact email",
              isNotNull: true
            },
            {
              name: "commission_rate",
              type: "DECIMAL(5,2)",
              description: "Agreed commission rate as percentage",
              isNotNull: true
            },
            {
              name: "terms",
              type: "JSONB",
              description: "Contract terms and conditions"
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Partner status (active, suspended, etc.)",
              isNotNull: true,
              defaultValue: "'active'"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Partner creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_affiliate_partners_name",
              columns: ["name"]
            },
            {
              name: "idx_affiliate_partners_email",
              columns: ["email"],
              unique: true
            },
            {
              name: "idx_affiliate_partners_status",
              columns: ["status"]
            }
          ]
        },
        {
          name: "affiliate_commissions",
          description: "Tracked earnings and payouts per player referred",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for commission record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "partner_id",
              type: "UUID",
              description: "Reference to affiliate partner",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "affiliate_partners",
                column: "id"
              }
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to referred user",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "amount",
              type: "DECIMAL(20,8)",
              description: "Commission amount",
              isNotNull: true
            },
            {
              name: "currency",
              type: "VARCHAR(3)",
              description: "Currency code",
              isNotNull: true
            },
            {
              name: "transaction_type",
              type: "VARCHAR(20)",
              description: "Type of transaction (deposit, bet, etc.)",
              isNotNull: true
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Commission status (pending, paid, etc.)",
              isNotNull: true,
              defaultValue: "'pending'"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Commission creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "paid_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "When the commission was paid"
            }
          ],
          indexes: [
            {
              name: "idx_affiliate_commissions_partner_id",
              columns: ["partner_id"]
            },
            {
              name: "idx_affiliate_commissions_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_affiliate_commissions_status",
              columns: ["status"]
            },
            {
              name: "idx_affiliate_commissions_created_at",
              columns: ["created_at"]
            }
          ]
        }
      ]
    },
    {
      name: "Bonus System",
      description: "Promotional offers and bonus redemptions",
      tables: [
        {
          name: "bonus_offers",
          description: "Active bonuses and campaigns",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for bonus offer",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "name",
              type: "VARCHAR(100)",
              description: "Bonus name",
              isNotNull: true
            },
            {
              name: "description",
              type: "TEXT",
              description: "Bonus description"
            },
            {
              name: "bonus_type",
              type: "VARCHAR(50)",
              description: "Type of bonus (deposit, free_spins, cashback, etc.)",
              isNotNull: true
            },
            {
              name: "value",
              type: "DECIMAL(20,8)",
              description: "Bonus value amount",
              isNotNull: true
            },
            {
              name: "currency",
              type: "VARCHAR(3)",
              description: "Currency code",
              isNotNull: true,
              defaultValue: "'USD'"
            },
            {
              name: "min_deposit",
              type: "DECIMAL(20,8)",
              description: "Minimum deposit required (if applicable)"
            },
            {
              name: "wagering_requirement",
              type: "DECIMAL(5,2)",
              description: "Wagering requirement multiplier"
            },
            {
              name: "valid_from",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Offer start date",
              isNotNull: true
            },
            {
              name: "valid_to",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Offer end date",
              isNotNull: true
            },
            {
              name: "terms_conditions",
              type: "TEXT",
              description: "Detailed terms and conditions"
            },
            {
              name: "is_active",
              type: "BOOLEAN",
              description: "Whether the offer is currently active",
              isNotNull: true,
              defaultValue: "true"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Offer creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_bonus_offers_name",
              columns: ["name"]
            },
            {
              name: "idx_bonus_offers_bonus_type",
              columns: ["bonus_type"]
            },
            {
              name: "idx_bonus_offers_valid_from",
              columns: ["valid_from"]
            },
            {
              name: "idx_bonus_offers_valid_to",
              columns: ["valid_to"]
            },
            {
              name: "idx_bonus_offers_is_active",
              columns: ["is_active"]
            }
          ]
        },
        {
          name: "bonus_redemptions",
          description: "Bonuses redeemed by players",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for redemption",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "bonus_id",
              type: "UUID",
              description: "Reference to bonus offer",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "bonus_offers",
                column: "id"
              }
            },
            {
              name: "wallet_id",
              type: "UUID",
              description: "Reference to user wallet",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "wallet_accounts",
                column: "id"
              }
            },
            {
              name: "amount",
              type: "DECIMAL(20,8)",
              description: "Redemption amount",
              isNotNull: true
            },
            {
              name: "status",
              type: "VARCHAR(20)",
              description: "Redemption status (active, completed, canceled, etc.)",
              isNotNull: true,
              defaultValue: "'active'"
            },
            {
              name: "wagering_progress",
              type: "DECIMAL(20,8)",
              description: "Current wagering progress amount",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "expires_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "When the bonus expires",
              isNotNull: true
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Redemption timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "completed_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "When the bonus was completed/wagered"
            }
          ],
          indexes: [
            {
              name: "idx_bonus_redemptions_user_id",
              columns: ["user_id"]
            },
            {
              name: "idx_bonus_redemptions_bonus_id",
              columns: ["bonus_id"]
            },
            {
              name: "idx_bonus_redemptions_wallet_id",
              columns: ["wallet_id"]
            },
            {
              name: "idx_bonus_redemptions_status",
              columns: ["status"]
            },
            {
              name: "idx_bonus_redemptions_expires_at",
              columns: ["expires_at"]
            }
          ]
        }
      ]
    },
    {
      name: "Loyalty / VIP",
      description: "Loyalty programs and VIP status tracking",
      tables: [
        {
          name: "loyalty_points",
          description: "Earned loyalty points per player",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for loyalty record",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "user_id",
              type: "UUID",
              description: "Reference to user account",
              isNotNull: true,
              isForeignKey: true,
              references: {
                table: "auth_users",
                column: "id"
              }
            },
            {
              name: "points",
              type: "INTEGER",
              description: "Current points balance",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "lifetime_points",
              type: "INTEGER",
              description: "Total lifetime points earned",
              isNotNull: true,
              defaultValue: "0"
            },
            {
              name: "tier_id",
              type: "UUID",
              description: "Reference to loyalty tier",
              isForeignKey: true,
              references: {
                table: "loyalty_tiers",
                column: "id"
              }
            },
            {
              name: "expiry_date",
              type: "DATE",
              description: "When the points expire"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Record creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_loyalty_points_user_id",
              columns: ["user_id"],
              unique: true
            },
            {
              name: "idx_loyalty_points_tier_id",
              columns: ["tier_id"]
            }
          ]
        },
        {
          name: "loyalty_tiers",
          description: "Tier definitions (Gold, Platinum, etc.)",
          columns: [
            {
              name: "id",
              type: "UUID",
              description: "Unique identifier for tier",
              isPrimaryKey: true,
              isNotNull: true,
              defaultValue: "gen_random_uuid()"
            },
            {
              name: "name",
              type: "VARCHAR(50)",
              description: "Tier name",
              isNotNull: true
            },
            {
              name: "level",
              type: "INTEGER",
              description: "Tier level (for ordering)",
              isNotNull: true
            },
            {
              name: "min_points",
              type: "INTEGER",
              description: "Minimum points required for tier",
              isNotNull: true
            },
            {
              name: "benefits",
              type: "JSONB",
              description: "Tier benefits and perks"
            },
            {
              name: "created_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Tier creation timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            },
            {
              name: "updated_at",
              type: "TIMESTAMP WITH TIME ZONE",
              description: "Last update timestamp",
              isNotNull: true,
              defaultValue: "CURRENT_TIMESTAMP"
            }
          ],
          indexes: [
            {
              name: "idx_loyalty_tiers_name",
              columns: ["name"],
              unique: true
            },
            {
              name: "idx_loyalty_tiers_level",
              columns: ["level"],
              unique: true
            }
          ]
        }
      ]
    }
  ],
  relationships: [
    // Auth module relationships
    {
      source: "auth_users",
      target: "auth_sessions",
      label: "Has many",
      type: "one-to-many"
    },
    {
      source: "auth_users",
      target: "auth_2fa",
      label: "Has one",
      type: "one-to-one"
    },
    {
      source: "auth_users",
      target: "auth_password_resets",
      label: "Has many",
      type: "one-to-many"
    },
    
    // Profile module relationships
    {
      source: "auth_users",
      target: "profile_players",
      label: "Has one",
      type: "one-to-one"
    },
    {
      source: "auth_users",
      target: "profile_preferences",
      label: "Has one",
      type: "one-to-one"
    },
    
    // Wallet module relationships
    {
      source: "auth_users",
      target: "wallet_accounts",
      label: "Has many",
      type: "one-to-many"
    },
    {
      source: "wallet_accounts",
      target: "wallet_transactions",
      label: "Has many",
      type: "one-to-many"
    },
    
    // Social module relationships
    {
      source: "auth_users",
      target: "social_friends",
      label: "Has many",
      type: "one-to-many"
    },
    {
      source: "auth_users",
      target: "social_messages",
      label: "Sends many",
      type: "one-to-many"
    },
    
    // Additional cross-module relationships
    {
      source: "auth_users",
      target: "security_logs",
      label: "Has many",
      type: "one-to-many"
    },
    {
      source: "auth_users",
      target: "security_flags",
      label: "Has many",
      type: "one-to-many"
    },
    {
      source: "auth_users",
      target: "bonus_redemptions",
      label: "Has many",
      type: "one-to-many"
    },
    {
      source: "bonus_offers",
      target: "bonus_redemptions",
      label: "Has many",
      type: "one-to-many"
    }
  ]
};
