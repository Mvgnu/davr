# Dashboard Login Credentials

## Test User Accounts

The following test accounts were created by the seed script:

### Regular User
- **Email:** `user@test.com`
- **Password:** `password123`
- **Role:** USER
- **Access:** User Dashboard

### Center Owner
- **Email:** `owner@test.com`
- **Password:** `password123`
- **Role:** CENTER_OWNER
- **Access:** Owner Dashboard

### Administrator
- **Email:** `admin@test.com`
- **Password:** `password123`
- **Role:** ADMIN
- **Access:** Admin Dashboard

## Important Notes

- ⚠️ **NOT** `admin@example.com` - use `admin@test.com`
- All passwords are `password123`
- These are development/test credentials only
- The seed script is located at: `scripts/seed-dashboard-users.ts`

## Test Data Created

### For User (`user@test.com`)
- 3 marketplace listings (active)
- Test materials assigned

### For Owner (`owner@test.com`)
- 1 recycling center "Green Recycling Center" in Berlin
- 5 material offers
- Working hours (Mon-Sat 8:00-18:00, Sun closed)

### Database State
- All users have verified emails
- Owner's center is in PENDING verification status
- Ready for admin to verify via dashboard
