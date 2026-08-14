import os
import re
import sys

SRC=r"d:\\Backup\\Downloads\\Nova星宠-游戏完整设计指南与演进方案.md"
OUT_DIR=r"C:\\nova-design\\chapters"

def slugify(title):
    s = re.sub(r"[\s]+","-", title.strip())
    s = re.sub(r"[^\w\-\u4e00-\u9fff]","", s)
    return s

def main(src=SRC, out_dir=OUT_DIR):
    with open(src, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    indices = []
    for i, line in enumerate(lines):
        if line.startswith('# '):
            indices.append(i)

    if not indices:
        print('No top-level sections found in', src)
        return 1

    os.makedirs(out_dir, exist_ok=True)

    for idx, start in enumerate(indices):
        end = indices[idx+1] if idx+1 < len(indices) else len(lines)
        block = ''.join(lines[start:end]).rstrip() + '\n'
        title_line = lines[start].strip()[2:]
        file_index = f"{idx+1:02d}"
        filename = f"{file_index}-{slugify(title_line)}.md"
        path = os.path.join(out_dir, filename)
        with open(path, 'w', encoding='utf-8') as out:
            out.write(block)
        print('Wrote', path)

    print('Split complete. Files created in', out_dir)
    return 0

if __name__ == '__main__':
    sys.exit(main())
