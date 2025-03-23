# Admin Management Scripts

This directory contains scripts for creating and managing admin users in the recycling centers application.

## Creating Admin Users

There are two ways to create an admin user:

### 1. Interactive Script (Development)

The interactive script prompts you for admin details:

```bash
node scripts/create-admin.js
```

This script will:
- Ask for name, email, and password
- Validate the inputs (email format, password length)
- Check if the user already exists
- Create a new admin user with the given details

### 2. Production Script (Non-interactive)

For production environments or automated deployments, use the non-interactive script:

```bash
# Set environment variables first
export ADMIN_NAME="Admin User"
export ADMIN_EMAIL="admin@yourdomain.com"
export ADMIN_PASSWORD="your-secure-password"

# Run the script
node scripts/create-admin-production.js
```

**Important security notes:**
- Use a strong password (minimum 12 characters)
- Don't store production passwords in your repository
- For production deployments, consider using a secrets manager

## Admin Capabilities

As an admin user, you'll have the following capabilities in the recycling centers application:

1. **Recycling Center Management:**
   - View all recycling centers 
   - Edit any recycling center details
   - Approve or reject recycling center claims
   - Delete recycling centers

2. **User Management:**
   - View all users
   - Edit user permissions
   - Delete users if necessary

3. **Material Management:**
   - Add new materials to the system
   - Edit existing material details
   - Set material categories and prices

4. **System Management:**
   - Run database migrations
   - Monitor system performance
   - Access logs and error reports

## Security Best Practices

When working with admin accounts, follow these security best practices:

1. Use strong, unique passwords (at least 12 characters with a mix of character types)
2. Enable two-factor authentication if available
3. Regularly rotate admin passwords
4. Limit the number of admin accounts
5. Only grant admin access to trusted individuals
6. Always use HTTPS when accessing admin interfaces
7. Implement IP restrictions for admin access in production if possible 