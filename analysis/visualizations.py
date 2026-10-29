"""
Visualizations Generator for DA-002 Customer Analytics
Generates SVG/PNG analytical visual charts for dashboard, reports, and notebooks.
"""

import os
from typing import List, Dict, Any

def generate_svg_bar_chart(
    data: List[Dict[str, Any]],
    x_key: str,
    y_key: str,
    title: str,
    y_label: str,
    output_path: str,
    width: int = 700,
    height: int = 400
):
    """
    Generates a crisp, standalone SVG bar chart without requiring external graphics binaries.
    """
    if not data:
        return

    max_val = max(float(d[y_key]) for d in data) or 1.0
    margin_top = 50
    margin_bottom = 60
    margin_left = 80
    margin_right = 30

    plot_w = width - margin_left - margin_right
    plot_h = height - margin_top - margin_bottom
    n = len(data)
    bar_width = min(50, (plot_w / max(1, n)) * 0.7)
    gap = (plot_w - (bar_width * n)) / max(1, n + 1)

    svg_lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#ffffff; font-family:sans-serif;">',
        f'  <text x="{width/2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f172a">{title}</text>',
        f'  <line x1="{margin_left}" y1="{height - margin_bottom}" x2="{width - margin_right}" y2="{height - margin_bottom}" stroke="#cbd5e1" stroke-width="1.5" />',
        f'  <line x1="{margin_left}" y1="{margin_top}" x2="{margin_left}" y2="{height - margin_bottom}" stroke="#cbd5e1" stroke-width="1.5" />',
        f'  <text x="{margin_left - 15}" y="{margin_top + plot_h/2}" transform="rotate(-90 {margin_left - 15} {margin_top + plot_h/2})" text-anchor="middle" font-size="12" fill="#64748b">{y_label}</text>'
    ]

    for i, item in enumerate(data):
        val = float(item[y_key])
        bar_h = (val / max_val) * plot_h
        bx = margin_left + gap + i * (bar_width + gap)
        by = height - margin_bottom - bar_h

        # Bar
        svg_lines.append(f'  <rect x="{bx:.1f}" y="{by:.1f}" width="{bar_width:.1f}" height="{bar_h:.1f}" rx="3" fill="#2563eb" />')
        # Value label on top
        val_str = f"₹{val:,.0f}" if val >= 1000 else f"{val:,.0f}"
        svg_lines.append(f'  <text x="{bx + bar_width/2:.1f}" y="{by - 6:.1f}" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b">{val_str}</text>')
        # X-axis label
        lbl = str(item[x_key])
        if len(lbl) > 14:
            lbl = lbl[:12] + ".."
        svg_lines.append(f'  <text x="{bx + bar_width/2:.1f}" y="{height - margin_bottom + 18:.1f}" text-anchor="middle" font-size="11" fill="#475569">{lbl}</text>')

    svg_lines.append('</svg>')

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(svg_lines))
