import json
from pathlib import Path
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster
from graphify.export import to_json, to_html

print("Kod dosyaları taranıyor...")
files = collect_files(Path('.'))
extracted = extract(files, cache_root=Path('.'))

print("Grafik inşa ediliyor ve kümeleniyor...")
G = build_from_json(extracted)
communities = cluster(G)

Path('graphify-out').mkdir(exist_ok=True)
to_json(G, communities, 'graphify-out/graph.json')
to_html(G, communities, 'graphify-out/graph.html')
print(f"Başarılı! JSON ve HTML dosyaları graphify-out/ klasörüne kaydedildi.")