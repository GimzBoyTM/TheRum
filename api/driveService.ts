import { google } from 'googleapis';

// Lấy thông tin chứng chỉ từ biến môi trường
let auth: any = null;
let drive: any = null;

export const initDriveService = () => {
  try {
    const credsJson = process.env.GOOGLE_DRIVE_CREDS_JSON;
    if (credsJson) {
      const credentials = JSON.parse(credsJson);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      drive = google.drive({ version: 'v3', auth });
      console.log('Google Drive API initialized successfully.');
    } else {
      console.warn('GOOGLE_DRIVE_CREDS_JSON not found. VIP Drive proxy will not work.');
    }
  } catch (error) {
    console.error('Error initializing Google Drive API:', error);
  }
};

export const grantDrivePermission = async (fileId: string, emailAddress: string): Promise<boolean> => {
  if (!drive) {
    throw new Error('Google Drive API chưa được cấu hình');
  }
  try {
    await drive.permissions.create({
      fileId,
      sendNotificationEmail: false,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: emailAddress,
      },
      supportsAllDrives: true,
    });
    return true;
  } catch (error: any) {
    console.error('Lỗi khi cấp quyền Google Drive:', error);
    // Nếu lỗi 400 thường là do email không hợp lệ hoặc không phải tài khoản Google
    if (error.response && error.response.status === 400) {
      throw new Error('invalid_email');
    }
    throw error;
  }
};
