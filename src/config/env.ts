import dotenv from 'dotenv'
dotenv.config()

export const env = {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://admin:admin@localhost:5432/mydb',
    PORT: process.env.PORT || '3000',
    JWT_SECRET: process.env.JWT_SECRET || 'supersecret_jwt_key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'supersecret_refresh_key',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@example.com',
    
    // Cloudinary Config
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
}

if (!env.DATABASE_URL || !env.PORT || !env.JWT_SECRET || !env.REDIS_URL) {
    throw new Error('Missing required environment variables')
}