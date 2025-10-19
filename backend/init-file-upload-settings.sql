-- Initialize file upload system settings
INSERT INTO system_settings (key, value, data_type, description, created_at, updated_at) 
VALUES 
    ('EnableFileUploads', 'false', 'boolean', 'Enable file upload functionality for tickets', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MaxFileUploadSizeBytes', '10485760', 'number', 'Maximum file upload size in bytes (10MB default)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MaxFilesPerTicket', '5', 'number', 'Maximum number of files allowed per ticket', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;