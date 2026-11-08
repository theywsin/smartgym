-- Runtime role for the app. It does not own the tables, so row-level security applies to it.
CREATE ROLE smartgym_app LOGIN PASSWORD 'app';
