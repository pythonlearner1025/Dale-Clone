import {DatabaseSettings, sqlValue, TableAuthExtensionData, TableData, TableRulesExtensionData} from "teenybase"
import {authFields, baseFields, createdTrigger} from "teenybase/scaffolds/fields";

const userTable: TableData = {
    name: "users",
    autoSetUid: true,
    fields: [
        ...baseFields,
        ...authFields,
    ],
    indexes: [{fields: "role COLLATE NOCASE"}],
    extensions: [
        {
            name: "rules",
            listRule: "(auth.uid == id) | auth.role ~ '%admin' | meta->>'$.pvt'!=true",
            viewRule: "(auth.uid == id) | auth.role ~ '%admin'",
            createRule: "(auth.uid == null & role == 'guest') | (auth.role ~ '%admin' & role != 'superadmin')",
            updateRule: "(auth.uid == id & role == new.role & meta == new.meta) | (auth.role ~ '%admin' & new.role != 'superadmin' & (role != 'superadmin' | auth.role = 'superadmin'))",
            deleteRule: "auth.role ~ '%admin' & role !~ '%admin'",
        } as TableRulesExtensionData,
        {
            name: "auth",
            passwordType: "sha256",
            passwordCurrentSuffix: "Current",
            passwordConfirmSuffix: "Confirm",
            jwtSecret: "$JWT_SECRET_USERS",
            jwtTokenDuration: 3 * 60 * 60,
            maxTokenRefresh: 4,
            emailTemplates: {
                verification: {
                    variables: {
                        message_title: 'Email Verification',
                        message_description: 'Welcome to {{APP_NAME}}. Click the button below to verify your email address.',
                        message_footer: 'If you did not request this, please ignore this email.',
                        action_text: 'Verify Email',
                        action_link: '{{APP_URL}}#/verify-email/{{TOKEN}}',
                    }
                },
                passwordReset: {
                    variables: {
                        message_title: 'Password Reset',
                        message_description: 'Click the button below to reset the password for your {{APP_NAME}} account.',
                        message_footer: 'If you did not request this, you can safely ignore this email.',
                        action_text: 'Reset Password',
                        action_link: '{{APP_URL}}#/reset-password/{{TOKEN}}',
                    }
                }
            }
        } as TableAuthExtensionData,
    ],
    triggers: [
        createdTrigger,
    ],
}

const eventsTable: TableData = {
    name: "events",
    autoSetUid: true,
    fields: [
        ...baseFields,
        {name: "owner_id", type: "relation", sqlType: "text", notNull: true, foreignKey: {table: "users", column: "id"}},
        {name: "title", type: "text", sqlType: "text", notNull: true},
        {name: "target_date", type: "date", sqlType: "timestamp", notNull: true},
        {name: "start_date", type: "date", sqlType: "timestamp", notNull: true},
    ],
    indexes: [
        {fields: "owner_id"},
        {fields: "target_date"},
    ],
    extensions: [
        {
            name: "rules",
            listRule: "auth.uid != null & owner_id == auth.uid",
            viewRule: "auth.uid != null & owner_id == auth.uid",
            createRule: "auth.uid != null & owner_id == auth.uid",
            updateRule: "auth.uid != null & owner_id == auth.uid & owner_id = new.owner_id",
            deleteRule: "auth.uid != null & owner_id == auth.uid",
        } as TableRulesExtensionData,
    ],
    triggers: [
        createdTrigger,
    ],
}

const kvStoreTable: TableData = {
    name: "kv_store",
    autoSetUid: false,
    fields: [
        {name: "key", type: "text", sqlType: "text", notNull: true, primary: true},
        {name: "value", type: "json", sqlType: "json", notNull: true},
        {name: "expire", type: "date", sqlType: "timestamp"},
    ],
    extensions: [],
}

export default {
    tables: [userTable, eventsTable, kvStoreTable],
    appName: "Dale",
    appUrl: "https://dale.example.com",
    jwtSecret: "$JWT_SECRET_MAIN",

    email: {
        from: "Dale <noreply@example.com>",
        tags: ["dale"],
        variables: {
            company_name: "Dale",
            company_copyright: "Dale",
            company_address: "Company address",
            support_email: "support@example.com",
            company_url: "https://example.com",
        },
        mailgun: {
            MAILGUN_API_SERVER: "mail.example.com",
            MAILGUN_API_KEY: "$MAILGUN_API_KEY",
            MAILGUN_WEBHOOK_SIGNING_KEY: "$MAILGUN_WEBHOOK_SIGNING_KEY",
            MAILGUN_WEBHOOK_ID: "dale-app",
            DISCORD_MAILGUN_NOTIFY_WEBHOOK: "xxxxxxxxx"
        },
    },
} satisfies DatabaseSettings
