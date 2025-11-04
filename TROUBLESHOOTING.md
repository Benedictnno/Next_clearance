# EKSU Digital Clearance Management System - Troubleshooting Guide

## Common Issues and Solutions

### 1. Database Connection Issues

#### MongoDB Connection Failed
**Error**: `MongoServerError: connection failed`
**Solution**:
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/eksu_clearance
```

#### Prisma Connection Issues
**Error**: `PrismaClientInitializationError`
**Solution**:
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Reset database (development only)
npx prisma db reset
```

### 2. Authentication Issues

#### Session Not Found
**Error**: `Session not found` or `Unauthorized`
**Solution**:
1. Clear browser cookies and localStorage
2. Check session secret in environment variables
3. Verify JWT token is not expired
4. Restart the application

#### Student Registration Failed
**Error**: `Student not found in university records`
**Solution**:
1. Verify external API is accessible: `https://coreeksu.vercel.app/api/users/{id}`
2. Check network connectivity
3. Verify matric number format (e.g., CS/20/1234)
4. Check external API response format

### 3. File Upload Issues

#### Upload Failed
**Error**: `File upload failed` or `Invalid file type`
**Solution**:
1. Check file size (max 10MB)
2. Verify file type is allowed (PDF, JPG, PNG, DOC, DOCX, WEBP)
3. Check uploads directory permissions
4. Verify disk space available

#### File Not Found After Upload
**Error**: `File not found` when accessing uploaded files
**Solution**:
1. Check if uploads directory exists: `mkdir -p uploads`
2. Verify file permissions: `chmod 755 uploads`
3. Check file path in database
4. Verify static file serving configuration

### 4. API Endpoint Issues

#### 404 Not Found
**Error**: `API route not found`
**Solution**:
1. Check route file exists in correct directory
2. Verify file exports the correct HTTP methods
3. Check for typos in route paths
4. Restart development server

#### 500 Internal Server Error
**Error**: `Internal server error`
**Solution**:
1. Check server logs for detailed error messages
2. Verify all required environment variables are set
3. Check database connection
4. Verify all dependencies are installed

### 5. External API Integration Issues

#### External Student API Timeout
**Error**: `fetch failed` or timeout
**Solution**:
1. Check external API status
2. Verify network connectivity
3. Check API timeout settings
4. Implement retry logic with exponential backoff

#### Data Sync Issues
**Error**: `Failed to sync student data`
**Solution**:
1. Check external API response format
2. Verify data mapping logic
3. Check for required fields
4. Implement fallback to cached data

### 6. PDF Generation Issues

#### PDF Generation Failed
**Error**: `Failed to generate PDF`
**Solution**:
1. Check if all clearance steps are approved
2. Verify student data is complete
3. Check PDF template files exist
4. Verify file permissions for output directory

#### QR Code Generation Failed
**Error**: `QR code generation failed`
**Solution**:
1. Check qrcode package is installed
2. Verify QR code data is valid
3. Check image size limits
4. Verify canvas support in environment

### 7. Notification Issues

#### Notifications Not Appearing
**Error**: Notifications not showing in UI
**Solution**:
1. Check notification service is working
2. Verify database connection
3. Check notification polling interval
4. Verify user ID matching

#### Email Notifications Not Sending
**Error**: Email service not working
**Solution**:
1. Check email service configuration
2. Verify SMTP settings
3. Check email service credentials
4. Test with simple email first

### 8. Performance Issues

#### Slow Page Loads
**Symptoms**: Pages taking too long to load
**Solution**:
1. Check database query performance
2. Add database indexes
3. Implement caching
4. Optimize API calls

#### Memory Issues
**Error**: `JavaScript heap out of memory`
**Solution**:
1. Increase Node.js memory limit: `node --max-old-space-size=4096`
2. Check for memory leaks
3. Optimize file processing
4. Implement streaming for large files

### 9. Development Environment Issues

#### TypeScript Errors
**Error**: Type errors in development
**Solution**:
1. Run `npm run type-check`
2. Check for missing type definitions
3. Verify import paths
4. Update TypeScript version if needed

#### Build Failures
**Error**: Build process fails
**Solution**:
1. Check for syntax errors
2. Verify all dependencies are installed
3. Check environment variables
4. Clear build cache: `rm -rf .next`

### 10. Production Deployment Issues

#### Vercel Deployment Failed
**Error**: Deployment fails on Vercel
**Solution**:
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Check for build errors
4. Verify Node.js version compatibility

#### Environment Variables Missing
**Error**: `Environment variable not found`
**Solution**:
1. Check all required variables are set
2. Verify variable names match exactly
3. Check for typos in variable names
4. Restart application after setting variables

## Debugging Tools

### 1. Enable Debug Logging
```bash
# Set debug environment variable
DEBUG=eksu-clearance:* npm run dev
```

### 2. Database Debugging
```bash
# Connect to MongoDB directly
mongosh mongodb://localhost:27017/eksu_clearance

# Check collections
db.students.find().limit(5)
db.clearance_progress.find().limit(5)
```

### 3. API Testing
```bash
# Test API endpoints with curl
curl -X GET http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/auth/student/signin \
  -H "Content-Type: application/json" \
  -d '{"matric_no": "CS/20/1234", "password": "password"}'
```

### 4. File System Debugging
```bash
# Check uploads directory
ls -la uploads/
chmod 755 uploads/
```

## Monitoring and Health Checks

### 1. Health Check Endpoint
```http
GET /api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "external_api": "accessible",
    "file_storage": "available"
  }
}
```

### 2. Database Health Check
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"
```

### 3. External API Health Check
```bash
# Test external API
curl -I https://coreeksu.vercel.app/api/users/68f650ad139569c128ca2f6d
```

## Performance Optimization

### 1. Database Indexes
```javascript
// Create indexes for better performance
db.students.createIndex({ "userId": 1 })
db.clearance_progress.createIndex({ "studentId": 1, "stepId": 1 })
db.notifications.createIndex({ "userId": 1, "createdAt": -1 })
```

### 2. Caching Strategy
```javascript
// Implement Redis caching
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
```

### 3. File Storage Optimization
```javascript
// Use streaming for large files
const stream = fs.createReadStream(filePath);
const chunks = [];
stream.on('data', chunk => chunks.push(chunk));
```

## Security Issues

### 1. File Upload Security
- Validate file types and sizes
- Scan files for malicious content
- Use secure filename generation
- Implement proper access controls

### 2. API Security
- Implement rate limiting
- Validate all inputs
- Use HTTPS in production
- Implement proper error handling

### 3. Database Security
- Use connection strings with authentication
- Implement proper access controls
- Regular security updates
- Monitor for suspicious activity

## Getting Help

### 1. Check Logs
```bash
# Application logs
tail -f logs/app.log

# Error logs
grep "ERROR" logs/app.log
```

### 2. Community Support
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Documentation: [API Documentation](API_DOCS.md)
- Email: support@eksu-clearance.edu.ng

### 3. Professional Support
- System Administrator: admin@eksu.edu.ng
- Technical Lead: tech@eksu.edu.ng
- Emergency: +234-XXX-XXXX

## Prevention Tips

### 1. Regular Maintenance
- Update dependencies monthly
- Monitor system performance
- Backup data regularly
- Review security logs

### 2. Testing
- Test all features before deployment
- Use staging environment
- Implement automated testing
- Monitor error rates

### 3. Documentation
- Keep documentation updated
- Document all changes
- Maintain troubleshooting guides
- Train support staff

## Emergency Procedures

### 1. System Down
1. Check server status
2. Review error logs
3. Restart services if needed
4. Notify users of maintenance

### 2. Data Loss
1. Stop all operations
2. Check backup availability
3. Restore from latest backup
4. Verify data integrity

### 3. Security Breach
1. Isolate affected systems
2. Change all passwords
3. Review access logs
4. Notify security team

Remember: Always test solutions in a development environment before applying to production!