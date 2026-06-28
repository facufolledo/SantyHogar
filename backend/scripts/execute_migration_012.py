"""Execute migration 012 to fix timezone for ordenes table."""
import asyncio
from pathlib import Path
from app.database.connection import get_supabase_client

async def execute_migration():
    """Execute the migration SQL."""
    migration_file = Path(__file__).parent.parent / "database" / "migrations" / "012_fix_timezone_ordenes.sql"
    
    with open(migration_file, 'r') as f:
        sql = f.read()
    
    client = get_supabase_client()
    
    try:
        # Execute the SQL directly
        result = client.rpc('exec', {'sql': sql}).execute()
        print("Migration executed successfully!")
        print(result)
    except Exception as e:
        print(f"Error executing migration: {e}")
        # Try alternative approach: split and execute line by line
        print("\nAttempting alternative approach...")
        
        # Split by semicolon and execute each statement
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        
        for i, statement in enumerate(statements, 1):
            try:
                print(f"\nExecuting statement {i}...")
                print(statement[:100] + "..." if len(statement) > 100 else statement)
                # Note: Supabase's Python client doesn't support raw SQL execution directly
                # You need to use the SQL Editor in Supabase dashboard
                print("(Note: Use Supabase SQL Editor to run this)")
            except Exception as e2:
                print(f"Error with statement {i}: {e2}")

if __name__ == "__main__":
    print("Migration 012: Fix timezone for ordenes table")
    print("\nSQL to execute (use Supabase SQL Editor):")
    print("=" * 80)
    
    migration_file = Path(__file__).parent.parent / "database" / "migrations" / "012_fix_timezone_ordenes.sql"
    with open(migration_file, 'r') as f:
        print(f.read())
    
    print("=" * 80)
    print("\nTo execute:")
    print("1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql/new")
    print("2. Paste the SQL above")
    print("3. Click 'Run'")
