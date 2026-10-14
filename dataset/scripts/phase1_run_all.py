"""
Phase 1 – Master Runner
Runs all Phase 1 steps in order.
Usage: py -3 dataset\scripts\phase1_run_all.py
"""
import subprocess, sys, os

SCRIPTS = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable

steps = [
    ("Task 1 – Inspect PBF",            os.path.join(SCRIPTS, "phase1_inspect.py")),
    ("Tasks 2-6 – Extract & Export",    os.path.join(SCRIPTS, "phase1_extract.py")),
    ("Task 7 – Validate",               os.path.join(SCRIPTS, "phase1_validate.py")),
    ("Report – Generate Report",         os.path.join(SCRIPTS, "phase1_report.py")),
]

for label, script in steps:
    print(f"\n{'='*60}")
    print(f"RUNNING: {label}")
    print(f"{'='*60}")
    result = subprocess.run([PY, script], capture_output=False, text=True)
    if result.returncode != 0:
        print(f"\n❌ FAILED at step: {label}")
        sys.exit(result.returncode)
    print(f"\n✅ Completed: {label}")

print("\n" + "="*60)
print("Phase 1 COMPLETE ✅")
print("="*60)
