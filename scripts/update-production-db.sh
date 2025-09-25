#!/bin/bash

# Production Database Update Script for Unix/Linux/macOS
# Use this script to update your existing production database with SSO configuration

echo "=== Updating Production Database with SSO Configuration ==="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set!"
    echo "Please set your production database connection string:"
    echo 'Example: export DATABASE_URL="Host=your-host;Port=5432;Database=your-db;Username=user;Password=pass;SSL Mode=Require"'
    exit 1
fi

# Navigate to backend directory
cd backend || { echo "❌ Cannot find backend directory"; exit 1; }

echo "🔄 Applying EF Core migrations to production database..."

# Set production environment
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="$DATABASE_URL"

# Apply migrations
if dotnet ef database update --verbose; then
    echo "✅ Database migrations applied successfully!"
else
    echo "❌ Error applying migrations"
    echo ""
    echo "=== Alternative: Manual SQL Execution ==="
    echo "If EF migrations fail, you can run the SQL script manually:"
    echo "1. Connect to your production database"
    echo "2. Execute: scripts/update-production-database.sql"
    exit 1
fi

echo ""
echo "=== Verifying Database Updates ==="
echo "✅ Database update completed!"
echo ""
echo "=== Next Steps ==="
echo "1. Verify SSO configuration in your admin panel"
echo "2. Test Google OAuth login flow"  
echo "3. Check application logs for any SSO-related errors"
echo "4. Update your frontend environment variables if needed"

echo ""
echo "🎉 Production database update completed successfully!"