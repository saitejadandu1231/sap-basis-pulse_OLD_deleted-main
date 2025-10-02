#!/bin/bash

# Production Database Update Script for Consultant Tables Audit Fields
# Use this script to add audit fields to ConsultantSkill and ConsultantAvailabilitySlots tables

set -e  # Exit on any error

echo "=== Adding Audit Fields to Consultant Tables ==="

# Check if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable not set!"
    echo "Please set the DATABASE_URL environment variable or pass it as an argument."
    echo "Example: export DATABASE_URL='postgresql://user:pass@host:5432/db'"
    echo "Or: ./add-audit-fields-to-consultant-tables.sh postgresql://user:pass@host:5432/db"
    exit 1
fi

# Use provided argument if given, otherwise use environment variable
DB_URL="${1:-$DATABASE_URL}"

echo "Using database URL: $DB_URL"

# Option 1: Using psql command line
echo "Executing audit fields migration script..."
if command -v psql &> /dev/null; then
    echo "Using psql command line tool..."
    psql "$DB_URL" -f "scripts/add-audit-fields-to-consultant-tables.sql"

    if [ $? -eq 0 ]; then
        echo "✅ Audit fields added successfully using psql!"
    else
        echo "❌ psql command failed"
        echo "Falling back to manual execution instructions..."
    fi
else
    echo "❌ psql command not found"
    echo "Please install PostgreSQL client tools or execute the SQL script manually."
fi

# Manual execution instructions
echo ""
echo "=== Manual SQL Execution Instructions ==="
echo "If the automated script fails, execute the SQL script manually:"
echo "1. Connect to your production PostgreSQL database"
echo "2. Run: psql '$DB_URL' -f scripts/add-audit-fields-to-consultant-tables.sql"
echo "3. Or copy and paste the contents of scripts/add-audit-fields-to-consultant-tables.sql"

# Verification
echo ""
echo "=== Verification ==="
echo "After running the script, verify the changes:"
echo "1. Check that new columns exist in ConsultantSkill table:"
echo "   - CreatedBy (text, nullable)"
echo "   - IsDeleted (boolean, not null, default false)"
echo "   - UpdatedAt (timestamp with time zone, nullable)"
echo "   - UpdatedBy (text, nullable)"
echo ""
echo "2. Check that new columns exist in ConsultantAvailabilitySlots table:"
echo "   - CreatedAt (timestamp with time zone, not null)"
echo "   - CreatedBy (text, nullable)"
echo "   - IsDeleted (boolean, not null, default false)"
echo "   - UpdatedAt (timestamp with time zone, nullable)"
echo "   - UpdatedBy (text, nullable)"
echo ""
echo "✅ Audit fields migration completed!"