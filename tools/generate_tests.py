import os
import re
import csv

SRC=r"d:\\Backup\\Downloads\\Nova星宠-游戏完整设计指南与演进方案.md"
OUT_DIR=r"C:\\nova-design\\tests"
OUT_CSV=os.path.join(OUT_DIR, 'tests.csv')

def extract_section_59(text):
    # find '## 59.' header
    m = re.search(r"##\s*59\.\s*测试范围", text)
    if not m:
        return []
    start = m.end()
    rest = text[start:]
    # stop at next '## ' header
    end_m = re.search(r"\n##\s*\d+\.", rest)
    if end_m:
        rest = rest[:end_m.start()]
    # find numbered items like '1. Nova ID创建和重复创建。'
    items = re.findall(r"\n\s*(\d+)\.\s*(.+?)(?=\n\s*\d+\.|\Z)", '\n'+rest, re.S)
    return items

def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        text = f.read()

    items = extract_section_59(text)
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_CSV, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['test_id','description','preconditions','steps','expected_result'])
        for num, desc in items:
            desc = ' '.join(line.strip() for line in desc.splitlines())
            writer.writerow([num, desc, '', '', desc])

    print('Wrote', OUT_CSV)

if __name__ == '__main__':
    main()
