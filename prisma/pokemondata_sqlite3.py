import os
import sys
import time
import pandas as pd
import sqlite3
from datetime import datetime
import uuid

def generate_cuid():
    """Generate a CUID-like identifier"""
    return 'c' + str(uuid.uuid4())

def format_time(seconds):
    """Convert seconds to human readable time"""
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"

def get_unique_columns(table_name):
    """Get the unique constraint columns for each table"""
    base_columns = "name, generation, battle_format, rating, year_month"
    
    unique_columns = {
        'pokemon_moves': f"{base_columns}, move",
        'pokemon_abilities': f"{base_columns}, ability",
        'pokemon_items': f"{base_columns}, item",
        'pokemon_teammates': f"{base_columns}, teammate",
        'pokemon_teratypes': f"{base_columns}, tera_type",
        'pokemon_spreads': f"{base_columns}, nature, hp_ev, atk_ev, def_ev, spatk_ev, spdef_ev, spd_ev",
        'pokemon_counters': f"{base_columns}, opp_pokemon",
        'pokemon_base': base_columns,
        'pokemon_usage': base_columns
    }
    
    return unique_columns.get(table_name, base_columns)

def create_db_from_csvs(csv_dir, db_name='pokemon_data.db'):
    """
    Create SQLite database from Pokemon team CSV files with optimized indexes and CUID primary keys
    """
    start_time = time.time()
    print(f"\nStarting database creation at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        conn = sqlite3.connect(db_name)
        conn.execute("PRAGMA foreign_keys = ON")
        
        # Define table schemas with their specific columns and indexes
        table_schemas = {
            'pokemon_base': {
                'columns': '''
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    generation TEXT,
                    battle_format TEXT,
                    rating INTEGER,
                    raw_count INTEGER,
                    avg_weight REAL,
                    viability_ceiling INTEGER,
                    year_month TEXT
                ''',
                'indexes': [
                    ('idx_base_name', 'name'),
                    ('idx_base_gen_format', 'generation, battle_format'),
                    ('idx_base_viability', 'viability_ceiling')
                ]
            },
            'pokemon_usage': {
                'columns': '''
                    id TEXT PRIMARY KEY,
                    rank INTEGER,
                    name TEXT,
                    usage_percent REAL,
                    raw_count INTEGER,
                    raw_percent REAL,
                    real_count INTEGER,
                    real_percent REAL,
                    year_month TEXT,
                    generation TEXT,
                    battle_format TEXT,
                    rating INTEGER
                ''',
                'indexes': [
                    ('idx_usage_rank', 'rank'),
                    ('idx_usage_percent', 'usage_percent')
                ]
            }
        }
        
        # Add schemas for other tables with consistent structure
        similar_table_schemas = {
            'pokemon_moves': ('move', 'usage'),
            'pokemon_abilities': ('ability', 'usage'),
            'pokemon_items': ('item', 'usage'),
            'pokemon_teammates': ('teammate', 'usage'),
            'pokemon_teratypes': ('tera_type', 'usage')
        }
        
        for table, (col_name, usage_col) in similar_table_schemas.items():
            table_schemas[table] = {
                'columns': f'''
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    generation TEXT,
                    battle_format TEXT,
                    rating INTEGER,
                    year_month TEXT,
                    {col_name} TEXT,
                    usage REAL
                ''',
                'indexes': [
                    (f'idx_{table}_{col_name}', col_name),
                    (f'idx_{table}_usage', 'usage')
                ]
            }
        
        # Add schema for spreads table
        table_schemas['pokemon_spreads'] = {
            'columns': '''
                id TEXT PRIMARY KEY,
                name TEXT,
                generation TEXT,
                battle_format TEXT,
                rating INTEGER,
                year_month TEXT,
                nature TEXT,
                hp_ev INTEGER,
                atk_ev INTEGER,
                def_ev INTEGER,
                spatk_ev INTEGER,
                spdef_ev INTEGER,
                spd_ev INTEGER,
                usage REAL
            ''',
            'indexes': [
                ('idx_spreads_nature', 'nature'),
                ('idx_spreads_usage', 'usage')
            ]
        }
        
        # Add schema for counters table
        table_schemas['pokemon_counters'] = {
            'columns': '''
                id TEXT PRIMARY KEY,
                name TEXT,
                generation TEXT,
                battle_format TEXT,
                rating INTEGER,
                year_month TEXT,
                opp_pokemon TEXT,
                lose_rate_against_opp REAL,
                mean REAL,
                std_dev REAL,
                ko_percent REAL,
                switch_percent REAL
            ''',
            'indexes': [
                ('idx_counters_opponent', 'opp_pokemon'),
                ('idx_counters_lose_rate', 'lose_rate_against_opp')
            ]
        }

        # Create tables
        print("\nCreating tables...")
        table_count = len(table_schemas)
        for i, (table_name, schema) in enumerate(table_schemas.items(), 1):
            print(f"\n[{i}/{table_count}] Creating table: {table_name}")
            create_table_sql = f'''
            CREATE TABLE IF NOT EXISTS {table_name} (
                {schema['columns']}
            )
            '''
            conn.execute(create_table_sql)

        # Import data from CSVs
        print("\nImporting data from CSV files...")
        csv_to_table_mapping = {
            'pokemon_base.csv': 'pokemon_base',
            'pokeusage.csv': 'pokemon_usage',
            'poketeam_teratypes.csv': 'pokemon_teratypes',
            'poketeam_spreads.csv': 'pokemon_spreads',
            'poketeam_counters.csv': 'pokemon_counters',
            'poketeam_moves.csv': 'pokemon_moves',
            'poketeam_abilities.csv': 'pokemon_abilities',
            'poketeam_items.csv': 'pokemon_items',
            'poketeam_teammates.csv': 'pokemon_teammates'
        }
        
        csv_count = len(csv_to_table_mapping)
        for i, (csv_file, table_name) in enumerate(csv_to_table_mapping.items(), 1):
            csv_path = os.path.join(csv_dir, csv_file)
            if os.path.exists(csv_path):
                file_size = os.path.getsize(csv_path) / (1024 * 1024)  # Size in MB
                print(f"\n[{i}/{csv_count}] Importing {csv_file} ({file_size:.2f} MB) into {table_name}")
                
                # Read CSV into DataFrame
                df = pd.read_csv(csv_path)
                original_rows = len(df)
                
                # Add ID column
                df['id'] = [generate_cuid() for _ in range(len(df))]
                
                # Handle column name consistency
                column_mappings = {
                    'yearMonth': 'year_month',
                    'Battle_Format': 'battle_format',
                    'Generation': 'generation',
                    'Tera_Types': 'tera_type',
                    'Opp_Pokemon': 'opp_pokemon',
                    'Rating': 'rating'  # Added this to ensure consistency
                }
                
                df = df.rename(columns={k: v for k, v in column_mappings.items() if k in df.columns})
                
                # Drop duplicates based on unique columns before importing
                unique_cols = get_unique_columns(table_name).split(', ')
                existing_cols = [col for col in unique_cols if col in df.columns]
                if existing_cols:
                    initial_rows = len(df)
                    df = df.drop_duplicates(subset=existing_cols, keep='first')
                    dropped_rows = initial_rows - len(df)
                    if dropped_rows > 0:
                        print(f"  Dropped {dropped_rows} duplicate rows")
                
                print(f"  Converting {len(df)} rows to SQL...")
                df.to_sql(table_name, conn, if_exists='replace', index=False)
                print(f"  ✓ Imported successfully")

        # Create indexes after data import
        print("\nCreating indexes...")
        for i, (table_name, schema) in enumerate(table_schemas.items(), 1):
            print(f"\n[{i}/{table_count}] Creating indexes for: {table_name}")
            for idx_name, idx_columns in schema['indexes']:
                print(f"  Creating index: {idx_name}")
                try:
                    conn.execute(f'''
                        CREATE INDEX IF NOT EXISTS {idx_name}
                        ON {table_name}({idx_columns})
                    ''')
                except sqlite3.OperationalError as e:
                    print(f"  Warning: Could not create index {idx_name}: {str(e)}")
                    continue

        # Create unique constraints that match Prisma schema
        print("\nCreating unique constraints...")
        for table_name in table_schemas.keys():
            unique_columns = get_unique_columns(table_name)
            try:
                conn.execute(f'''
                    CREATE UNIQUE INDEX IF NOT EXISTS unique_{table_name}
                    ON {table_name}({unique_columns})
                ''')
                print(f"  Created unique constraint for {table_name}")
            except sqlite3.OperationalError as e:
                print(f"  Warning: Could not create unique constraint for {table_name}: {str(e)}")
                continue
        
        print("\nOptimizing database...")
        conn.execute("ANALYZE")
        conn.commit()
        
        end_time = time.time()
        elapsed = end_time - start_time
        
        print(f"\nDatabase creation completed successfully!")
        print(f"Total time elapsed: {format_time(elapsed)}")
        
    except Exception as e:
        print(f"\nError during database creation: {str(e)}")
        raise
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    try:
        csv_directory = "sqldata"
        if not os.path.exists(csv_directory):
            print(f"Error: Directory '{csv_directory}' not found!")
            sys.exit(1)
        
        # List CSV files found
        csv_files = [f for f in os.listdir(csv_directory) if f.endswith('.csv')]
        print(f"Found {len(csv_files)} CSV files in {csv_directory}:")
        for file in csv_files:
            size_mb = os.path.getsize(os.path.join(csv_directory, file)) / (1024 * 1024)
            print(f"  - {file} ({size_mb:.2f} MB)")
            
        create_db_from_csvs(csv_directory)
        
    except Exception as e:
        print(f"Fatal error: {str(e)}")
        sys.exit(1)