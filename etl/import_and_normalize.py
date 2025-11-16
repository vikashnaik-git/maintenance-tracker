import os
import pandas as pd
import re
from dateutil import parser
import firebase_admin
from firebase_admin import credentials, firestore
import schedule
import time

# ---------------------------------------------------------------------
# 🔹 1️⃣ Setup Firebase connection
# ---------------------------------------------------------------------
ROOT_DIR = r"D:\maintenance_tracker_project"
BASE_DIR = os.path.join(ROOT_DIR, "etl")
DATA_DIR = os.path.join(BASE_DIR, "data")

SERVICE_ACCOUNT_PATH = os.path.join(ROOT_DIR, "service-account.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ---------------------------------------------------------------------
# 🔹 2️⃣ Define CSV paths
# ---------------------------------------------------------------------
E_Q = os.path.join(DATA_DIR, "equipment_master.csv")
E_TM = os.path.join(DATA_DIR, "equipment_task_map.csv")
M_T = os.path.join(DATA_DIR, "maintenance_tasks.csv")
T_A = os.path.join(DATA_DIR, "task_allotment.csv")

# ---------------------------------------------------------------------
# 🔹 3️⃣ Safe CSV Reader
# ---------------------------------------------------------------------
def read_csv_safe(path):
    """Reads CSV safely; retries with latin1 if utf-8 fails."""
    try:
        return pd.read_csv(path, dtype=str, keep_default_na=False, encoding='utf-8', engine='python')
    except UnicodeDecodeError:
        print(f"⚠️ Encoding issue detected in {path}. Retrying with 'latin1'...")
        return pd.read_csv(path, dtype=str, keep_default_na=False, encoding='latin1', engine='python')

# ---------------------------------------------------------------------
# 🔹 4️⃣ Helper functions
# ---------------------------------------------------------------------
def parse_date_flexible(s):
    """Try to parse dates in multiple formats"""
    if not s or str(s).strip() == "":
        return None
    s = str(s).strip()
    try:
        return parser.parse(s, dayfirst=True)
    except Exception:
        return None

def parse_gps(s):
    """Parse GPS coordinates from string like '19.0760, 72.8777'"""
    if not s or str(s).strip() == "":
        return None
    s = str(s).strip()
    if "," in s:
        parts = [p.strip() for p in s.split(",")]
        try:
            lat = float(parts[0])
            lon = float(parts[1])
            return {"lat": lat, "lon": lon}
        except Exception:
            return None
    return None

def normalize_frequency(freq):
    """Normalize textual frequency to days"""
    if freq is None:
        return None
    f = str(freq).strip().lower()
    if f == "":
        return None
    if re.match(r"^\d+$", f):
        return int(f)
    if "daily" in f or f == "day":
        return 1
    if "weekly" in f:
        return 7
    if "biweekly" in f:
        return 14
    if "monthly" in f:
        return 30
    if "quarter" in f:
        return 90
    if "year" in f or "annual" in f:
        return 365
    return None

def normalize_text(s):
    """Trim and standardize text values"""
    if pd.isna(s):
        return None
    return str(s).strip().title()

# ---------------------------------------------------------------------
# 🔹 5️⃣ Import individual tables
# ---------------------------------------------------------------------
def import_equipment():
    print("📦 Importing equipment_master...")
    df = read_csv_safe(E_Q)
    df = df.applymap(lambda x: normalize_text(x))

    for _, r in df.iterrows():
        doc_id = str(r.get("equipment_id")).strip()
        if not doc_id:
            continue

        doc = {
            "equipment_id": doc_id,
            "department": r.get("department", ""),
            "area": r.get("area", ""),
            "section": r.get("section", ""),
            "equipment_name": r.get("equipment_name", ""),
            "startDate_raw": r.get("startDate", "")
        }

        parsed = parse_date_flexible(r.get("startDate", ""))
        if parsed:
            doc["startDate"] = parsed

        gps = parse_gps(r.get("gps_location", ""))
        doc["gps_location"] = r.get("gps_location", "")
        if gps:
            doc["gps"] = gps

        db.collection("equipment_master").document(doc_id).set(doc)

    print("✅ equipment_master imported successfully!")


def import_tasks():
    print("📦 Importing maintenance_tasks...")
    df = read_csv_safe(M_T)
    df = df[[c for c in df.columns if not c.startswith("Unnamed")]]
    df = df.applymap(lambda x: normalize_text(x))

    for _, r in df.iterrows():
        task_id = str(r.get("task_id")).strip()
        if not task_id:
            continue

        frequency = r.get("frequency", "")
        freq_days = normalize_frequency(frequency)

        doc = {
            "task_id": task_id,
            "equipment_id": r.get("equipment_id", ""),
            "equipment_name": r.get("equipment_name", ""),
            "frequency": frequency,
            "task_activity": r.get("task_activity", ""),
            "component_focus": r.get("component_focus", ""),
            "description_check": r.get("description_check", ""),
            "frequency_days": freq_days
        }

        db.collection("maintenance_tasks").document(task_id).set(doc)

    print("✅ maintenance_tasks imported successfully!")


def import_equipment_task_map():
    print("📦 Importing equipment_task_map...")
    df = read_csv_safe(E_TM)
    df = df.applymap(lambda x: normalize_text(x))

    for _, r in df.iterrows():
        sl = str(r.get("sl_no", "")).strip()
        doc = {
            "sl_no": sl,
            "task_id": r.get("task_id", ""),
            "equipment_id": r.get("equipment_Id", ""),
            "equipment_id_norm": r.get("equipment_Id", "")
        }

        if sl == "":
            db.collection("equipment_task_map").add(doc)
        else:
            db.collection("equipment_task_map").document(sl).set(doc)

    print("✅ equipment_task_map imported successfully!")


def import_task_allotment():
    print("📦 Importing task_allotment...")
    df = read_csv_safe(T_A)
    df = df.applymap(lambda x: normalize_text(x))

    for _, r in df.iterrows():
        des = str(r.get("designation", "")).lower()
        role = "manager" if "manager" in des else "engineer"

        doc = {
            "employee_id": r.get("employee_id", ""),
            "employee_name": r.get("employee_name", ""),
            "employee_email": r.get("employee_email", ""),
            "designation": r.get("designation", ""),
            "company": r.get("company", ""),
            "department": r.get("department", ""),
            "area": r.get("area", ""),
            "section": r.get("section", ""),
            "role": role
        }

        db.collection("task_allotment").add(doc)

    print("✅ task_allotment imported successfully!")

# ---------------------------------------------------------------------
# 🔹 6️⃣ Run ETL once
# ---------------------------------------------------------------------
def run_etl():
    print("🚀 Starting Firebase ETL process...")
    import_equipment()
    import_tasks()
    import_equipment_task_map()
    import_task_allotment()
    print("🎯 ETL complete! All data imported into Firestore.")

# ---------------------------------------------------------------------
# 🔹 7️⃣ Optional: Schedule to run once per day at 02:00 AM
# ---------------------------------------------------------------------
def schedule_daily():
    schedule.every().day.at("02:00").do(run_etl)
    print("🕑 ETL scheduled to run daily at 02:00 AM.")
    while True:
        schedule.run_pending()
        time.sleep(60)

# ---------------------------------------------------------------------
# 🏁 Entry point
# ---------------------------------------------------------------------
if __name__ == "__main__":
    run_etl()       # Run immediately
    # schedule_daily()  # Uncomment this line to enable daily automatic run
