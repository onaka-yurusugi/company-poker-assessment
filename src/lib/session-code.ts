// 紛らわしい文字を除外: O/0/I/1/l
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export const generateSessionCode = (): string => {
  let code = "";
  const array = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(array);
  for (const byte of array) {
    code += CHARSET[byte % CHARSET.length];
  }
  return code;
};
