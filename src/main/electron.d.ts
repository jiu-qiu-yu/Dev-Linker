declare const __dirname: string;
declare const __filename: string;

declare module 'electron' {
  export const app: any;
  export const BrowserWindow: any;
  export const ipcMain: any;
  export const dialog: any;
}
