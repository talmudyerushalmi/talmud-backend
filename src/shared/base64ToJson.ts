export const base64ToJson = (base64String: string) => {
  const json = Buffer.from(base64String, 'base64').toString();
  return JSON.parse(json);
};
