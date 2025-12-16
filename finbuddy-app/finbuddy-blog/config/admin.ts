// export default ({ env }) => ({
//   auth: {
//     secret: env('ADMIN_JWT_SECRET'),
//   },
//   apiToken: {
//     salt: env('API_TOKEN_SALT'),
//   },
//   transfer: {
//     token: {
//       salt: env('TRANSFER_TOKEN_SALT'),
//     },
//   },
//   secrets: {
//     encryptionKey: env('ENCRYPTION_KEY'),
//   },
//   flags: {
//     nps: env.bool('FLAG_NPS', true),
//     promoteEE: env.bool('FLAG_PROMOTE_EE', true),
//   },
// });


type Env = {
  (key: string, defaultValue?: string): string;
  bool: (key: string, defaultValue?: boolean) => boolean;
};

export default ({ env }: { env: Env }) => ({
  apiToken: {
    salt: env("API_TOKEN_SALT"),
  },
  transfer: {
    token: {
      salt: env("TRANSFER_TOKEN_SALT"),
    },
  },
  secrets: {
    encryptionKey: env("ENCRYPTION_KEY"),
  },
  flags: {
    nps: env.bool("FLAG_NPS", true),
    promoteEE: env.bool("FLAG_PROMOTE_EE", true),
  },
});
