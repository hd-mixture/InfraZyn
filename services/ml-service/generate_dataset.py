"""
SYNTHETIC LONGITUDINAL INFRASTRUCTURE DATASET GENERATOR
SIH26103 | Team InfraZyn | DevTeXhHub

IMPORTANT SCIENTIFIC NOTICE:
This dataset is SYNTHETIC and generated exclusively for machine learning pipeline
development, temporal validation calibration, and API integration testing.
It does NOT represent official MoSPI PAIMANA or Government of India statistics.
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Set deterministic random seed for reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

SECTORS = [
    'Railways',
    'Roads & Highways',
    'Power',
    'Ports & Shipping',
    'Petroleum & Natural Gas',
]

STATES_TERRAIN = [
    ('Uttar Pradesh', 0.15),
    ('Maharashtra', 0.20),
    ('Gujarat', 0.15),
    ('Tamil Nadu', 0.15),
    ('Andhra Pradesh', 0.20),
    ('Bihar', 0.20),
    ('Odisha', 0.25),
    ('Madhya Pradesh', 0.20),
    ('Karnataka', 0.20),
    ('West Bengal', 0.25),
    ('Assam', 0.60),
    ('Himachal Pradesh', 0.70),
    ('Uttarakhand', 0.75),
    ('Jammu & Kashmir', 0.85),
    ('Arunachal Pradesh', 0.85),
    ('Sikkim', 0.80),
]

def calculate_hermite_scurve(elapsed_months: float, total_months: float) -> float:
    """Computes expected physical progress via Cubic Hermite S-Curve."""
    if total_months <= 0:
        return 100.0
    tau = min(1.0, max(0.0, elapsed_months / total_months))
    scurve_progress = (3.0 * (tau ** 2) - 2.0 * (tau ** 3)) * 100.0
    return round(scurve_progress, 1)

def generate_synthetic_dataset(num_records: int = 1200) -> pd.DataFrame:
    records = []
    
    start_date_range = datetime(2018, 1, 1)
    end_date_range = datetime(2026, 6, 30)
    total_days = (end_date_range - start_date_range).days

    num_projects = 250
    projects = []
    for i in range(num_projects):
        state, terrain = random.choice(STATES_TERRAIN)
        sector = random.choice(SECTORS)
        sanctioned_cost = round(float(np.random.lognormal(mean=7.5, sigma=0.95)), 2) # ~ ₹500 Cr to ₹25,000 Cr
        planned_duration = random.randint(30, 96) # months
        approval_date = start_date_range + timedelta(days=random.randint(0, total_days - (planned_duration * 30)))
        
        projects.append({
            'project_id': f"PRJ-SYNTH-{i+1:04d}",
            'state': state,
            'terrain_complexity': terrain,
            'sector': sector,
            'sanctioned_cost': sanctioned_cost,
            'planned_duration': planned_duration,
            'approval_date': approval_date,
        })

    # Generate monthly / quarterly snapshots across project lifecycles
    for _ in range(num_records):
        proj = random.choice(projects)
        
        # Snapshot date between project approval and 2026-06-30
        min_snapshot = proj['approval_date'] + timedelta(days=90)
        max_snapshot = end_date_range
        if min_snapshot >= max_snapshot:
            snapshot_date = min_snapshot
        else:
            snapshot_date = min_snapshot + timedelta(days=random.randint(0, (max_snapshot - min_snapshot).days))
            
        elapsed_months = max(3, int((snapshot_date - proj['approval_date']).days / 30.4))
        planned_duration = proj['planned_duration']
        
        # S-Curve expected progress at snapshot date
        expected_progress = calculate_hermite_scurve(elapsed_months, planned_duration)
        
        # Realized progress includes execution friction
        terrain = proj['terrain_complexity']
        bottlenecks = int(np.random.poisson(lam=terrain * 1.8))
        revisions = int(np.random.binomial(n=3, p=0.25 + (terrain * 0.2)))
        
        # Physical progress deficit
        drag = (terrain * 14.0) + (bottlenecks * 4.5) + np.random.normal(0, 5.0)
        actual_progress = max(2.0, min(99.0, expected_progress - drag))
        progress_gap = max(0.0, round(expected_progress - actual_progress, 1))
        
        # Financial disbursement
        # Under normal conditions spend ratio tracks progress; friction introduces spend intensity anomalies
        intensity_anomaly = np.random.normal(1.05 + (terrain * 0.25) + (bottlenecks * 0.12), 0.22)
        expenditure_intensity = max(0.4, round(intensity_anomaly, 2))
        
        cumulative_expenditure = round(
            proj['sanctioned_cost'] * (actual_progress / 100.0) * expenditure_intensity, 2
        )
        
        # ---------------------------------------------------------------------
        # TARGET VARIABLE GENERATION (Strictly Independent to Prevent Leakage)
        # ---------------------------------------------------------------------
        # Target A: Cost Overrun (Binary: >= 10% final cost escalation)
        # Latent cost overrun risk z_cost combines spend intensity, progress gap, scale, bottlenecks + stochastic noise
        scale_factor = min(1.5, proj['sanctioned_cost'] / 5000.0)
        z_cost = (
            -2.4 
            + (2.2 * (expenditure_intensity - 1.0)) 
            + (0.04 * progress_gap) 
            + (0.8 * terrain) 
            + (0.35 * bottlenecks) 
            + (0.3 * scale_factor)
            + np.random.logistic(0, 0.6)
        )
        cost_overrun_prob = 1.0 / (1.0 + np.exp(-z_cost))
        cost_overrun = 1 if cost_overrun_prob >= 0.50 else 0
        
        # Target B: Time Overrun (Binary: >= 12 months delay past original completion target)
        # Latent schedule slippage risk z_time combines progress gap, project age, terrain + independent noise
        deadline_proximity = max(0, planned_duration - elapsed_months)
        urgency_deficit = progress_gap / max(1.0, deadline_proximity)
        z_time = (
            -2.0
            + (0.07 * progress_gap)
            + (1.2 * urgency_deficit)
            + (1.1 * terrain)
            + (0.4 * bottlenecks)
            + np.random.logistic(0, 0.65)
        )
        time_overrun_prob = 1.0 / (1.0 + np.exp(-z_time))
        time_overrun = 1 if time_overrun_prob >= 0.50 else 0

        # Post-outcome realizations (retained for auditing and reference; strictly excluded from model features)
        simulated_escalation_pct = max(0.0, (expenditure_intensity - 0.95) * 35.0 + (cost_overrun * 18.0) + np.random.normal(0, 6.0))
        realized_final_cost = round(proj['sanctioned_cost'] * (1.0 + (simulated_escalation_pct / 100.0)), 2)
        realized_final_delay_months = max(0, int((progress_gap * 0.8) + (time_overrun * 16) + np.random.normal(2, 4)))

        records.append({
            # Identification & Metadata
            'snapshot_date': snapshot_date.strftime('%Y-%m-%d'),
            'project_id': proj['project_id'],
            'sector': proj['sector'],
            'state': proj['state'],
            
            # KNOWN AT PREDICTION TIME (FEATURES)
            'sanctioned_cost': proj['sanctioned_cost'],
            'project_age_months': elapsed_months,
            'planned_duration_months': planned_duration,
            'cumulative_expenditure_to_date': cumulative_expenditure,
            'physical_progress_to_date': round(actual_progress, 1),
            'progress_gap': progress_gap,
            'expenditure_intensity': expenditure_intensity,
            'terrain_complexity_index': proj['terrain_complexity'],
            'clearance_bottlenecks_count': bottlenecks,
            'historical_revisions_count': revisions,
            
            # PREDICTION TARGETS
            'cost_overrun': cost_overrun,
            'time_overrun': time_overrun,
            
            # POST-OUTCOME REALIZATION (FOR AUDIT ONLY - STRICTLY FORBIDDEN IN FEATURES)
            'realized_final_cost': realized_final_cost,
            'realized_final_delay_months': realized_final_delay_months,
        })

    df = pd.DataFrame(records)
    # Sort chronologically by snapshot_date for temporal consistency
    df = df.sort_values('snapshot_date').reset_index(drop=True)
    return df

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    output_path = os.path.join(data_dir, 'synthetic_infrastructure_dataset.csv')
    print(f"Generating synthetic longitudinal dataset (N=1200)...")
    df = generate_synthetic_dataset(1200)
    df.to_csv(output_path, index=False)
    print(f"Saved synthetic dataset to: {output_path}")
    print(f"Summary Statistics:")
    print(f"Total Snapshots: {len(df)}")
    print(f"Date Span: {df['snapshot_date'].min()} to {df['snapshot_date'].max()}")
    print(f"Cost Overrun Prevalence: {df['cost_overrun'].mean()*100:.1f}%")
    print(f"Time Overrun Prevalence: {df['time_overrun'].mean()*100:.1f}%")
    print(f"Sectors Covered: {df['sector'].unique().tolist()}")

if __name__ == '__main__':
    main()
