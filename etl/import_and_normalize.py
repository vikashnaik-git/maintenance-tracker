# etl/import_and_normalize.py
import os, pandas as pd, re
from dateutil import parser
from google.cloud import firestore
from supabase import create_client  # if you want to push images or archive later

# CONFIG
FOLDER = "etl/data"  # update if you put CSVs elsewhere
E_Q = "/mnt/data/equipment_master.csv"
E_TM = "/mnt/data/equipment_task_map.csv"
M_T = "/mnt/data/maintenance_tasks.csv"
T_A = "/mnt/data/task_allotment.csv"

# Firestore client (ensure GOOGLE_APPLICATION_CREDENTIALS env var set)
db = firestore.Client()

def parse_date_flexible(s):
    if not s or str(s).strip()=="":
        return None
    s = str(s).strip()
    # try common formats
    for fmt in ("%d-%m-%Y","%d/%m/%Y","%Y-%m-%d","%d-%m-%y"):
        try:
            return parser.parse(s, dayfirst=True)
        except:
            pass
    try:
        return parser.parse(s, dayfirst=True)
    except Exception:
        return None

def parse_gps(s):
    if not s or str(s).strip()=="":
        return None
    s = str(s).strip()
    # look for lat,lon
    if "," in s:
        parts = [p.strip() for p in s.split(",")]
        try:
            lat = float(parts[0]); lon = float(parts[1])
            return {"lat": lat, "lon": lon}
        except:
            return None
    return None

def normalize_frequency(freq):
    if freq is None: return None
    f = str(freq).strip().lower()
    if f=="":
        return None
    # numeric
    m = re.match(r"^\d+$", f)
    if m:
        return int(f)
    # words
    if "daily" in f or f=="day":
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
    # fallback none
    return None

def import_equipment():
    df = pd.read_csv(E_Q, dtype=str, keep_default_na=False, encoding='utf-8', engine='python')
    for _, r in df.iterrows():
        doc_id = str(r.get("equipment_id")).strip()
        doc = {
            "equipment_id": doc_id,
            "department": r.get("department",""),
            "area": r.get("area",""),
            "section": r.get("section",""),
            "equipment_name": r.get("equipment_name",""),
            "startDate_raw": r.get("startDate","")
        }
        parsed = parse_date_flexible(r.get("startDate",""))
        if parsed:
            doc["startDate"] = parsed
        gps = parse_gps(r.get("gps_location",""))
        doc["gps_location"] = r.get("gps_location","")
        if gps:
            doc["gps"] = gps
        db.collection("equipment_master").document(doc_id).set(doc)
    print("Imported equipment_master")

def import_tasks():
    df = pd.read_csv(M_T, dtype=str, keep_default_na=False, encoding='latin1', engine='python')
    # drop unnamed columns
    df = df[[c for c in df.columns if not c.startswith("Unnamed")]]
    for _, r in df.iterrows():
        task_id = str(r.get("task_id")).strip()
        frequency = r.get("frequency","")
        freq_days = normalize_frequency(frequency)
        doc = {
            "task_id": task_id,
            "equipment_id": r.get("equipment_id",""),
            "equipment_name": r.get("equipment_name",""),
            "frequency": frequency,
            "task_activity": r.get("task_activity",""),
            "component_focus": r.get("component_focus",""),
            "description_check": r.get("description_check",""),
            "frequency_days": freq_days
        }
        db.collection("maintenance_tasks").document(task_id).set(doc)
    print("Imported maintenance_tasks")

def import_equipment_task_map():
    df = pd.read_csv(E_TM, dtype=str, keep_default_na=False, encoding='utf-8', engine='python')
    for _, r in df.iterrows():
        # use sl_no as doc id if it is unique, else auto generate
        sl = str(r.get("sl_no","")).strip()
        doc = {
            "sl_no": sl,
            "task_id": r.get("task_id",""),
            "equipment_Id": r.get("equipment_Id",""),
            "equipment_id_norm": r.get("equipment_Id","")  # normalized key for lookups
        }
        ref = db.collection("equipment_task_map").document(sl if sl!="" else None)
        # if sl empty let Firestore auto create
        if sl=="":
            db.collection("equipment_task_map").add(doc)
        else:
            ref.set(doc)
    print("Imported equipment_task_map")

def import_task_allotment():
    df = pd.read_csv(T_A, dtype=str, keep_default_na=False, encoding='utf-8', engine='python')
    for _, r in df.iterrows():
        doc = {
            "employee_id": r.get("employee_id",""),
            "employee_name": r.get("employee_name",""),
            "employee_email": r.get("employee_email",""),
            "designation": r.get("designation",""),
            "company": r.get("company",""),
            "department": r.get("department",""),
            "area": r.get("area",""),
            "section": r.get("section","")
        }
        # infer role
        des = str(r.get("designation","")).lower()
        doc["role"] = "engineer" if "engineer" in des else "manager" if "manager" in des else "engineer"
        db.collection("task_allotment").add(doc)
    print("Imported task_allotment")

if __name__ == "__main__":
    import_equipment()
    import_tasks()
    import_equipment_task_map()
    import_task_allotment()
    print("ETL complete")
